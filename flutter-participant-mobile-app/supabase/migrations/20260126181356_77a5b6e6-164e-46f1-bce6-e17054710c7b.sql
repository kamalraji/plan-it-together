-- =====================================================
-- PHASE 9: ENGAGEMENT SCORING & SCHEDULED MAINTENANCE
-- =====================================================

-- 1. Engagement scores table for aggregated user engagement metrics
CREATE TABLE IF NOT EXISTS public.user_engagement_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  
  -- Core engagement metrics (0-100 scale)
  profile_completeness_score INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  responsiveness_score INTEGER DEFAULT 0,
  networking_score INTEGER DEFAULT 0,
  
  -- Composite score
  overall_engagement_score INTEGER GENERATED ALWAYS AS (
    (profile_completeness_score + activity_score + responsiveness_score + networking_score) / 4
  ) STORED,
  
  -- Engagement tier for quick filtering
  engagement_tier TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN (profile_completeness_score + activity_score + responsiveness_score + networking_score) / 4 >= 80 THEN 'highly_engaged'
      WHEN (profile_completeness_score + activity_score + responsiveness_score + networking_score) / 4 >= 50 THEN 'moderately_engaged'
      WHEN (profile_completeness_score + activity_score + responsiveness_score + networking_score) / 4 >= 20 THEN 'lightly_engaged'
      ELSE 'inactive'
    END
  ) STORED,
  
  -- Tracking
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient tier-based filtering
CREATE INDEX IF NOT EXISTS idx_user_engagement_tier ON public.user_engagement_scores(engagement_tier);
CREATE INDEX IF NOT EXISTS idx_user_engagement_overall ON public.user_engagement_scores(overall_engagement_score DESC);

-- Enable RLS
ALTER TABLE public.user_engagement_scores ENABLE ROW LEVEL SECURITY;

-- Users can view their own scores
CREATE POLICY "Users can view own engagement scores"
ON public.user_engagement_scores FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- System can manage all scores (via service role)
CREATE POLICY "Service role manages engagement scores"
ON public.user_engagement_scores FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Function to calculate engagement score for a single user
CREATE OR REPLACE FUNCTION public.calculate_user_engagement_score(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_score INTEGER := 0;
  activity_score INTEGER := 0;
  responsiveness_score INTEGER := 0;
  networking_score INTEGER := 0;
  profile_data RECORD;
  activity_count INTEGER;
  response_rate NUMERIC;
  connection_count INTEGER;
BEGIN
  -- 1. Profile completeness (0-100)
  SELECT 
    CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 15 ELSE 0 END +
    CASE WHEN bio IS NOT NULL AND length(bio) > 50 THEN 20 ELSE CASE WHEN bio IS NOT NULL THEN 10 ELSE 0 END END +
    CASE WHEN avatar_url IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN skills IS NOT NULL AND array_length(skills, 1) > 0 THEN 15 ELSE 0 END +
    CASE WHEN interests IS NOT NULL AND array_length(interests, 1) > 0 THEN 15 ELSE 0 END +
    CASE WHEN headline IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN linkedin_url IS NOT NULL OR twitter_url IS NOT NULL THEN 10 ELSE 0 END
  INTO profile_score
  FROM user_profiles
  WHERE id = target_user_id;
  
  profile_score := COALESCE(profile_score, 0);
  
  -- 2. Activity score (based on last 30 days)
  SELECT COUNT(*) INTO activity_count
  FROM (
    SELECT 1 FROM registrations WHERE user_id = target_user_id AND created_at > now() - interval '30 days'
    UNION ALL
    SELECT 1 FROM attendance_records WHERE user_id = target_user_id AND check_in_time > now() - interval '30 days'
    UNION ALL
    SELECT 1 FROM sparks WHERE user_id = target_user_id AND created_at > now() - interval '30 days'
    LIMIT 50
  ) recent_activity;
  
  activity_score := LEAST(activity_count * 10, 100);
  
  -- 3. Responsiveness score (message response rate)
  SELECT 
    CASE 
      WHEN received_count = 0 THEN 50
      ELSE LEAST((sent_count::NUMERIC / NULLIF(received_count, 0) * 100)::INTEGER, 100)
    END
  INTO responsiveness_score
  FROM (
    SELECT 
      COUNT(*) FILTER (WHERE sender_id = target_user_id) as sent_count,
      COUNT(*) FILTER (WHERE sender_id != target_user_id) as received_count
    FROM dm_messages dm
    JOIN dm_channels dc ON dm.channel_id = dc.id
    WHERE (dc.user1_id = target_user_id OR dc.user2_id = target_user_id)
      AND dm.sent_at > now() - interval '30 days'
  ) msg_stats;
  
  responsiveness_score := COALESCE(responsiveness_score, 50);
  
  -- 4. Networking score (connections + follows)
  SELECT 
    LEAST(
      (SELECT COUNT(*) FROM user_follows WHERE follower_id = target_user_id) * 5 +
      (SELECT COUNT(*) FROM user_follows WHERE following_id = target_user_id) * 3,
      100
    )
  INTO networking_score;
  
  networking_score := COALESCE(networking_score, 0);
  
  -- Upsert the scores
  INSERT INTO user_engagement_scores (
    user_id, 
    profile_completeness_score, 
    activity_score, 
    responsiveness_score, 
    networking_score,
    last_calculated_at
  )
  VALUES (
    target_user_id,
    profile_score,
    activity_score,
    responsiveness_score,
    networking_score,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    profile_completeness_score = EXCLUDED.profile_completeness_score,
    activity_score = EXCLUDED.activity_score,
    responsiveness_score = EXCLUDED.responsiveness_score,
    networking_score = EXCLUDED.networking_score,
    last_calculated_at = now(),
    updated_at = now();
  
  RETURN (profile_score + activity_score + responsiveness_score + networking_score) / 4;
END;
$$;

-- 3. Batch engagement score refresh function (for scheduled jobs)
CREATE OR REPLACE FUNCTION public.refresh_all_engagement_scores(batch_size INTEGER DEFAULT 500)
RETURNS TABLE(processed_count INTEGER, avg_score NUMERIC, duration_ms INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_time TIMESTAMPTZ := clock_timestamp();
  user_record RECORD;
  total_processed INTEGER := 0;
  total_score BIGINT := 0;
BEGIN
  -- Process users who haven't been calculated recently or never
  FOR user_record IN 
    SELECT up.id
    FROM user_profiles up
    LEFT JOIN user_engagement_scores ues ON up.id = ues.user_id
    WHERE ues.last_calculated_at IS NULL 
       OR ues.last_calculated_at < now() - interval '24 hours'
    ORDER BY COALESCE(ues.last_calculated_at, '1970-01-01'::timestamptz)
    LIMIT batch_size
  LOOP
    total_score := total_score + calculate_user_engagement_score(user_record.id);
    total_processed := total_processed + 1;
  END LOOP;
  
  processed_count := total_processed;
  avg_score := CASE WHEN total_processed > 0 THEN total_score::NUMERIC / total_processed ELSE 0 END;
  duration_ms := EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time)::INTEGER;
  
  RETURN NEXT;
END;
$$;

-- 4. Scheduled maintenance function (combines all cleanup tasks)
CREATE OR REPLACE FUNCTION public.run_ai_matching_maintenance()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB := '{}'::JSONB;
  engagement_result RECORD;
  expired_insights INTEGER;
  old_analytics INTEGER;
  stale_embeddings INTEGER;
BEGIN
  -- 1. Refresh engagement scores
  SELECT * INTO engagement_result FROM refresh_all_engagement_scores(500);
  result := result || jsonb_build_object(
    'engagement_scores', jsonb_build_object(
      'processed', engagement_result.processed_count,
      'avg_score', engagement_result.avg_score,
      'duration_ms', engagement_result.duration_ms
    )
  );
  
  -- 2. Delete expired AI match insights (older than 7 days)
  DELETE FROM ai_match_insights
  WHERE expires_at < now()
  RETURNING COUNT(*) INTO expired_insights;
  
  result := result || jsonb_build_object('expired_insights_deleted', COALESCE(expired_insights, 0));
  
  -- 3. Archive old analytics (keep 90 days)
  DELETE FROM ai_matching_analytics
  WHERE created_at < now() - interval '90 days'
  RETURNING COUNT(*) INTO old_analytics;
  
  result := result || jsonb_build_object('old_analytics_deleted', COALESCE(old_analytics, 0));
  
  -- 4. Mark stale embeddings for re-generation
  UPDATE profile_embeddings
  SET updated_at = now() - interval '8 days'
  WHERE user_id IN (
    SELECT up.id 
    FROM user_profiles up
    JOIN profile_embeddings pe ON up.id = pe.user_id
    WHERE up.updated_at > pe.updated_at + interval '1 hour'
  )
  RETURNING COUNT(*) INTO stale_embeddings;
  
  result := result || jsonb_build_object('stale_embeddings_marked', COALESCE(stale_embeddings, 0));
  
  -- 5. Refresh materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_interaction_summary;
  result := result || jsonb_build_object('materialized_view_refreshed', true);
  
  result := result || jsonb_build_object('completed_at', now());
  
  RETURN result;
END;
$$;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_user_engagement_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_all_engagement_scores(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.run_ai_matching_maintenance() TO service_role;