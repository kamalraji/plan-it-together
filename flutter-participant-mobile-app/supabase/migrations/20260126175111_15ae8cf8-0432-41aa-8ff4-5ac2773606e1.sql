-- Phase 3: Enhanced AI Matching RPC with Multi-Signal Score Fusion

-- 1. Create comprehensive AI matches function
CREATE OR REPLACE FUNCTION public.get_ai_matches_v2(
  p_user_id UUID,
  p_event_id UUID DEFAULT NULL,
  p_context TEXT DEFAULT 'pulse', -- 'pulse' or 'zone'
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  headline TEXT,
  bio TEXT,
  organization TEXT,
  skills TEXT[],
  interests TEXT[],
  looking_for TEXT[],
  is_online BOOLEAN,
  is_verified BOOLEAN,
  is_premium BOOLEAN,
  -- Scoring components
  final_score FLOAT,
  embedding_similarity FLOAT,
  interaction_score FLOAT,
  profile_overlap_score FLOAT,
  freshness_score FLOAT,
  reciprocity_score FLOAT,
  context_score FLOAT,
  -- Match metadata
  match_category TEXT,
  common_skills TEXT[],
  common_interests TEXT[],
  follows_you BOOLEAN,
  you_follow BOOLEAN,
  has_pending_meeting BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Context-aware weights
  w_embedding FLOAT;
  w_interaction FLOAT;
  w_overlap FLOAT;
  w_freshness FLOAT;
  w_context FLOAT;
  w_reciprocity FLOAT;
  -- User embeddings
  v_bio_emb vector(768);
  v_skills_emb vector(768);
  v_interests_emb vector(768);
BEGIN
  -- Set weights based on context
  IF p_context = 'zone' THEN
    -- Zone: prioritize event context and session overlap
    w_embedding := 0.25;
    w_interaction := 0.10;
    w_overlap := 0.15;
    w_freshness := 0.10;
    w_context := 0.30;
    w_reciprocity := 0.10;
  ELSE
    -- Pulse: prioritize semantic similarity and behavior
    w_embedding := 0.35;
    w_interaction := 0.25;
    w_overlap := 0.15;
    w_freshness := 0.10;
    w_context := 0.05;
    w_reciprocity := 0.10;
  END IF;

  -- Get user embeddings
  SELECT pe.bio_embedding, pe.skills_embedding, pe.interests_embedding
  INTO v_bio_emb, v_skills_emb, v_interests_emb
  FROM public.profile_embeddings pe
  WHERE pe.user_id = p_user_id;

  RETURN QUERY
  WITH 
  -- Stage 1: Candidate pool (exclude blocked, already matched)
  candidates AS (
    SELECT 
      ip.user_id,
      ip.full_name,
      ip.avatar_url,
      ip.headline,
      ip.bio,
      ip.organization,
      ip.skills,
      ip.interests,
      ip.looking_for,
      ip.is_online,
      ip.is_verified,
      ip.is_premium,
      ip.created_at AS profile_created_at,
      ip.updated_at AS profile_updated_at
    FROM public.impact_profiles ip
    WHERE ip.user_id != p_user_id
      -- Exclude blocked users
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users bu
        WHERE (bu.user_id = p_user_id AND bu.blocked_user_id = ip.user_id)
           OR (bu.user_id = ip.user_id AND bu.blocked_user_id = p_user_id)
      )
      -- Exclude skipped in last 24 hours
      AND NOT EXISTS (
        SELECT 1 FROM public.profile_skips ps
        WHERE ps.user_id = p_user_id 
          AND ps.skipped_user_id = ip.user_id
          AND ps.skipped_at > now() - INTERVAL '24 hours'
      )
      -- Zone context: only checked-in attendees
      AND (
        p_event_id IS NULL 
        OR EXISTS (
          SELECT 1 FROM public.event_checkins ec
          WHERE ec.user_id = ip.user_id AND ec.event_id = p_event_id
        )
      )
      -- Exclude private profiles (unless following)
      AND (
        ip.is_private = false
        OR EXISTS (
          SELECT 1 FROM public.followers f
          WHERE f.follower_id = p_user_id 
            AND f.following_id = ip.user_id
            AND f.status = 'accepted'
        )
      )
  ),
  
  -- Stage 2a: Embedding similarity scores
  embedding_scores AS (
    SELECT 
      c.user_id,
      CASE 
        WHEN v_bio_emb IS NULL THEN 0.5
        ELSE (
          COALESCE(1 - (pe.bio_embedding <=> v_bio_emb), 0.5) * 0.4 +
          COALESCE(1 - (pe.skills_embedding <=> v_skills_emb), 0.5) * 0.35 +
          COALESCE(1 - (pe.interests_embedding <=> v_interests_emb), 0.5) * 0.25
        )
      END AS emb_score
    FROM candidates c
    LEFT JOIN public.profile_embeddings pe ON pe.user_id = c.user_id
  ),
  
  -- Stage 2b: Interaction history scores (with time decay)
  interaction_scores AS (
    SELECT 
      c.user_id,
      COALESCE(
        (
          SELECT SUM(
            CASE uie.event_type
              WHEN 'contact_exchanged' THEN 100
              WHEN 'meeting_accepted' THEN 80
              WHEN 'message_replied' THEN 60
              WHEN 'message_sent' THEN 40
              WHEN 'follow' THEN 30
              WHEN 'save' THEN 25
              WHEN 'profile_expand' THEN 10
              WHEN 'dwell_time' THEN 5
              WHEN 'scroll_past' THEN -5
              WHEN 'skip' THEN -15
              ELSE 0
            END * EXP(-EXTRACT(EPOCH FROM now() - uie.created_at) / (30 * 86400))
          ) / 100.0
          FROM public.user_interaction_events uie
          WHERE uie.user_id = p_user_id AND uie.target_user_id = c.user_id
        ), 0
      ) AS int_score
    FROM candidates c
  ),
  
  -- Stage 2c: Profile overlap scores (skills, interests, goals)
  overlap_scores AS (
    SELECT 
      c.user_id,
      (
        -- Skills overlap (max 40 points)
        LEAST(COALESCE(array_length(
          ARRAY(SELECT UNNEST(c.skills) INTERSECT SELECT UNNEST(
            (SELECT skills FROM public.impact_profiles WHERE user_id = p_user_id)
          )), 1
        ), 0) * 8, 40) +
        -- Interests overlap (max 30 points)
        LEAST(COALESCE(array_length(
          ARRAY(SELECT UNNEST(c.interests) INTERSECT SELECT UNNEST(
            (SELECT interests FROM public.impact_profiles WHERE user_id = p_user_id)
          )), 1
        ), 0) * 6, 30) +
        -- Goal complementarity (max 30 points)
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM UNNEST(c.looking_for) lf
            WHERE lf = ANY((SELECT looking_for FROM public.impact_profiles WHERE user_id = p_user_id))
          ) THEN 30
          ELSE 0
        END
      ) / 100.0 AS ovl_score
    FROM candidates c
  ),
  
  -- Stage 2d: Freshness scores (new users get boost)
  freshness_scores AS (
    SELECT 
      c.user_id,
      CASE 
        -- New profile (< 7 days): 100%
        WHEN c.profile_created_at > now() - INTERVAL '7 days' THEN 1.0
        -- Recent profile (< 30 days): 80%
        WHEN c.profile_created_at > now() - INTERVAL '30 days' THEN 0.8
        -- Active profile (updated recently): 60%
        WHEN c.profile_updated_at > now() - INTERVAL '7 days' THEN 0.6
        -- Online now: 50%
        WHEN c.is_online THEN 0.5
        -- Default: 30%
        ELSE 0.3
      END AS fresh_score
    FROM candidates c
  ),
  
  -- Stage 2e: Context scores (event/session overlap for Zone)
  context_scores AS (
    SELECT 
      c.user_id,
      CASE 
        WHEN p_event_id IS NULL THEN 0.5
        ELSE (
          -- Same event checked in: 30%
          CASE WHEN EXISTS (
            SELECT 1 FROM public.event_checkins ec
            WHERE ec.user_id = c.user_id AND ec.event_id = p_event_id
          ) THEN 0.3 ELSE 0 END +
          -- Session attendance overlap: up to 50%
          LEAST(
            (SELECT COUNT(*)::FLOAT / 10
             FROM public.session_bookmarks sb1
             INNER JOIN public.session_bookmarks sb2 
               ON sb1.session_id = sb2.session_id
             WHERE sb1.user_id = p_user_id AND sb2.user_id = c.user_id),
            0.5
          ) +
          -- Recent check-in (< 1 hour): 20%
          CASE WHEN EXISTS (
            SELECT 1 FROM public.event_checkins ec
            WHERE ec.user_id = c.user_id 
              AND ec.event_id = p_event_id
              AND ec.checked_in_at > now() - INTERVAL '1 hour'
          ) THEN 0.2 ELSE 0 END
        )
      END AS ctx_score
    FROM candidates c
  ),
  
  -- Stage 2f: Reciprocity scores (mutual interest)
  reciprocity_scores AS (
    SELECT 
      c.user_id,
      (
        -- They follow you: 40%
        CASE WHEN EXISTS (
          SELECT 1 FROM public.followers f
          WHERE f.follower_id = c.user_id AND f.following_id = p_user_id AND f.status = 'accepted'
        ) THEN 0.4 ELSE 0 END +
        -- They saved you: 30%
        CASE WHEN EXISTS (
          SELECT 1 FROM public.saved_profiles sp
          WHERE sp.user_id = c.user_id AND sp.saved_user_id = p_user_id
        ) THEN 0.3 ELSE 0 END +
        -- They viewed you recently: 20%
        CASE WHEN EXISTS (
          SELECT 1 FROM public.user_interaction_events uie
          WHERE uie.user_id = c.user_id AND uie.target_user_id = p_user_id
            AND uie.event_type = 'profile_view'
            AND uie.created_at > now() - INTERVAL '7 days'
        ) THEN 0.2 ELSE 0 END +
        -- Pending meeting request to you: 10%
        CASE WHEN EXISTS (
          SELECT 1 FROM public.networking_meetings nm
          WHERE nm.requester_id = c.user_id AND nm.target_id = p_user_id
            AND nm.status = 'PENDING'
        ) THEN 0.1 ELSE 0 END
      ) AS recip_score
    FROM candidates c
  ),
  
  -- Stage 3: Score fusion
  fused_scores AS (
    SELECT 
      c.*,
      es.emb_score,
      is_s.int_score,
      os.ovl_score,
      fs.fresh_score,
      cs.ctx_score,
      rs.recip_score,
      -- Final weighted score
      (
        w_embedding * COALESCE(es.emb_score, 0.5) +
        w_interaction * GREATEST(LEAST(is_s.int_score, 1), 0) +
        w_overlap * COALESCE(os.ovl_score, 0) +
        w_freshness * COALESCE(fs.fresh_score, 0.3) +
        w_context * COALESCE(cs.ctx_score, 0.5) +
        w_reciprocity * COALESCE(rs.recip_score, 0)
      ) AS total_score,
      -- Determine match category
      CASE 
        WHEN COALESCE(os.ovl_score, 0) > 0.6 THEN 'professional'
        WHEN COALESCE(rs.recip_score, 0) > 0.5 THEN 'mutual_interest'
        WHEN COALESCE(es.emb_score, 0) > 0.7 THEN 'similar_background'
        WHEN COALESCE(cs.ctx_score, 0) > 0.5 THEN 'event_connection'
        ELSE 'discovery'
      END AS category
    FROM candidates c
    LEFT JOIN embedding_scores es ON es.user_id = c.user_id
    LEFT JOIN interaction_scores is_s ON is_s.user_id = c.user_id
    LEFT JOIN overlap_scores os ON os.user_id = c.user_id
    LEFT JOIN freshness_scores fs ON fs.user_id = c.user_id
    LEFT JOIN context_scores cs ON cs.user_id = c.user_id
    LEFT JOIN reciprocity_scores rs ON rs.user_id = c.user_id
  )
  
  -- Final output with metadata
  SELECT 
    fs.user_id,
    fs.full_name,
    fs.avatar_url,
    fs.headline,
    fs.bio,
    fs.organization,
    fs.skills,
    fs.interests,
    fs.looking_for,
    fs.is_online,
    fs.is_verified,
    fs.is_premium,
    fs.total_score AS final_score,
    fs.emb_score AS embedding_similarity,
    fs.int_score AS interaction_score,
    fs.ovl_score AS profile_overlap_score,
    fs.fresh_score AS freshness_score,
    fs.recip_score AS reciprocity_score,
    fs.ctx_score AS context_score,
    fs.category AS match_category,
    -- Common skills
    ARRAY(
      SELECT UNNEST(fs.skills) INTERSECT 
      SELECT UNNEST((SELECT skills FROM public.impact_profiles WHERE user_id = p_user_id))
    ) AS common_skills,
    -- Common interests
    ARRAY(
      SELECT UNNEST(fs.interests) INTERSECT 
      SELECT UNNEST((SELECT interests FROM public.impact_profiles WHERE user_id = p_user_id))
    ) AS common_interests,
    -- Follow status
    EXISTS (
      SELECT 1 FROM public.followers f
      WHERE f.follower_id = fs.user_id AND f.following_id = p_user_id AND f.status = 'accepted'
    ) AS follows_you,
    EXISTS (
      SELECT 1 FROM public.followers f
      WHERE f.follower_id = p_user_id AND f.following_id = fs.user_id AND f.status = 'accepted'
    ) AS you_follow,
    -- Pending meeting
    EXISTS (
      SELECT 1 FROM public.networking_meetings nm
      WHERE (nm.requester_id = p_user_id AND nm.target_id = fs.user_id)
         OR (nm.requester_id = fs.user_id AND nm.target_id = p_user_id)
      AND nm.status = 'PENDING'
    ) AS has_pending_meeting
  FROM fused_scores fs
  ORDER BY fs.total_score DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- 2. Create helper function to get match explanation
CREATE OR REPLACE FUNCTION public.get_match_explanation(
  p_user_id UUID,
  p_target_user_id UUID
)
RETURNS TABLE (
  explanation TEXT,
  top_reasons TEXT[],
  conversation_starters TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_common_skills TEXT[];
  v_common_interests TEXT[];
  v_same_org BOOLEAN;
  v_follows_you BOOLEAN;
  v_reasons TEXT[] := ARRAY[]::TEXT[];
  v_starters TEXT[] := ARRAY[]::TEXT[];
  v_user_name TEXT;
  v_target_name TEXT;
BEGIN
  -- Get names
  SELECT full_name INTO v_user_name FROM public.impact_profiles WHERE user_id = p_user_id;
  SELECT full_name INTO v_target_name FROM public.impact_profiles WHERE user_id = p_target_user_id;
  
  -- Calculate common elements
  SELECT ARRAY(
    SELECT UNNEST(ip1.skills) INTERSECT SELECT UNNEST(ip2.skills)
  ) INTO v_common_skills
  FROM public.impact_profiles ip1, public.impact_profiles ip2
  WHERE ip1.user_id = p_user_id AND ip2.user_id = p_target_user_id;
  
  SELECT ARRAY(
    SELECT UNNEST(ip1.interests) INTERSECT SELECT UNNEST(ip2.interests)
  ) INTO v_common_interests
  FROM public.impact_profiles ip1, public.impact_profiles ip2
  WHERE ip1.user_id = p_user_id AND ip2.user_id = p_target_user_id;
  
  -- Check organization
  SELECT ip1.organization = ip2.organization INTO v_same_org
  FROM public.impact_profiles ip1, public.impact_profiles ip2
  WHERE ip1.user_id = p_user_id AND ip2.user_id = p_target_user_id
    AND ip1.organization IS NOT NULL;
  
  -- Check follow status
  SELECT EXISTS (
    SELECT 1 FROM public.followers f
    WHERE f.follower_id = p_target_user_id AND f.following_id = p_user_id AND f.status = 'accepted'
  ) INTO v_follows_you;
  
  -- Build reasons
  IF array_length(v_common_skills, 1) > 0 THEN
    v_reasons := array_append(v_reasons, 'You both have expertise in ' || array_to_string(v_common_skills[1:3], ', '));
    v_starters := array_append(v_starters, 'I noticed we both work with ' || v_common_skills[1] || '. What projects are you working on?');
  END IF;
  
  IF array_length(v_common_interests, 1) > 0 THEN
    v_reasons := array_append(v_reasons, 'Shared interests in ' || array_to_string(v_common_interests[1:3], ', '));
    v_starters := array_append(v_starters, 'I see you''re also interested in ' || v_common_interests[1] || '! What got you into it?');
  END IF;
  
  IF v_same_org THEN
    v_reasons := array_append(v_reasons, 'You work at the same organization');
    v_starters := array_append(v_starters, 'Hey! I see we''re from the same org. Which team are you on?');
  END IF;
  
  IF v_follows_you THEN
    v_reasons := array_append(v_reasons, v_target_name || ' follows you');
    v_starters := array_append(v_starters, 'Thanks for following me! I''d love to connect.');
  END IF;
  
  -- Default if no specific reasons
  IF array_length(v_reasons, 1) IS NULL THEN
    v_reasons := ARRAY['Similar professional background'];
    v_starters := ARRAY['Hi! I came across your profile and thought we might have some interesting things to discuss.'];
  END IF;

  RETURN QUERY SELECT 
    'You and ' || v_target_name || ' are a great match because of ' || v_reasons[1],
    v_reasons,
    v_starters;
END;
$$;