import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  corsHeaders,
  validateAuth,
  checkRateLimit,
  validateUUID,
  errorResponse,
  successResponse,
  initRequestContext,
  logInfo,
  logWarning,
  logError,
  logRequestComplete,
  checkSlowOperation,
} from "../_shared/security.ts";

// =============================================
// TYPES
// =============================================
interface MatchRequest {
  context: 'pulse' | 'zone';
  event_id?: string;
  limit?: number;
  offset?: number;
  filters?: {
    skills?: string[];
    interests?: string[];
    goals?: string[];
    online_only?: boolean;
  };
}

interface MatchResult {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  organization: string | null;
  match_score: number;
  shared_skills: string[];
  shared_interests: string[];
  shared_goals: string[];
  is_online: boolean;
  is_premium: boolean;
  is_verified: boolean;
  match_category: string;
  embedding_similarity: number | null;
  behavioral_score: number;
}

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  organization: string | null;
  skills: string[] | null;
  interests: string[] | null;
  looking_for: string[] | null;
  is_online: boolean | null;
  is_premium: boolean | null;
  is_verified: boolean | null;
  last_active_at: string | null;
}

interface MyProfileRow {
  skills: string[] | null;
  interests: string[] | null;
  looking_for: string[] | null;
  organization: string | null;
  current_event_id: string | null;
}

interface InteractionRow {
  target_user_id: string;
  event_type: string;
  created_at: string;
}

interface SignalWeight {
  signal_name: string;
  pulse_weight: number;
  zone_weight: number;
  decay_half_life_days: number;
  is_active: boolean;
}

interface ExperimentWeights {
  experiment_id: string | null;
  variant: string;
  weights: {
    embedding: number;
    behavioral: number;
    overlap: number;
    session: number;
    freshness: number;
  };
}

// =============================================
// MATCHING LOGIC
// =============================================
async function getSmartMatches(
  supabase: SupabaseClient,
  userId: string,
  request: MatchRequest,
  experimentWeights: ExperimentWeights
): Promise<{ matches: MatchResult[]; avgScore: number }> {
  const limit = Math.min(request.limit || 20, 50);
  const offset = request.offset || 0;
  const context = request.context;
  const weights = experimentWeights.weights;

  // Get current user's profile
  const { data: myProfileData } = await supabase
    .from('impact_profiles')
    .select('skills, interests, looking_for, organization, current_event_id')
    .eq('user_id', userId)
    .single();

  const myProfile = myProfileData as MyProfileRow | null;

  const { data: myEmbeddingData } = await supabase
    .from('profile_embeddings')
    .select('user_embedding')
    .eq('user_id', userId)
    .single();

  // Build candidate query
  let candidateQuery = supabase
    .from('impact_profiles')
    .select(`
      user_id,
      full_name,
      avatar_url,
      headline,
      organization,
      skills,
      interests,
      looking_for,
      is_online,
      is_premium,
      is_verified,
      last_active_at
    `)
    .neq('user_id', userId)
    .limit(500);

  // Zone context: filter to event attendees
  if (context === 'zone' && request.event_id) {
    const { data: attendees } = await supabase
      .from('event_checkins')
      .select('user_id')
      .eq('event_id', request.event_id);
    
    if (attendees && attendees.length > 0) {
      const attendeeIds = attendees.map((a: { user_id: string }) => a.user_id);
      candidateQuery = candidateQuery.in('user_id', attendeeIds);
    }
  }

  // Apply filters
  if (request.filters?.online_only) {
    candidateQuery = candidateQuery.eq('is_online', true);
  }
  if (request.filters?.skills?.length) {
    candidateQuery = candidateQuery.overlaps('skills', request.filters.skills);
  }
  if (request.filters?.interests?.length) {
    candidateQuery = candidateQuery.overlaps('interests', request.filters.interests);
  }

  const { data: candidatesData, error: candidateError } = await candidateQuery;

  if (candidateError || !candidatesData) {
    logError('Failed to fetch candidates', candidateError);
    return { matches: [], avgScore: 0 };
  }

  const candidates = candidatesData as ProfileRow[];

  // Get blocked users
  const { data: blockedUsers } = await supabase
    .from('blocked_users')
    .select('blocked_user_id')
    .eq('user_id', userId);
  
  const blockedIds = new Set((blockedUsers || []).map((b: { blocked_user_id: string }) => b.blocked_user_id));

  // Get embedding similarities using pgvector cosine distance
  const candidateIds = candidates.map(c => c.user_id);
  const embeddingSimilarities = new Map<string, number>();
  
  if (myEmbeddingData?.user_embedding) {
    const { data: similarityData, error: simError } = await supabase.rpc(
      'get_embedding_similarities',
      {
        query_user_id: userId,
        candidate_ids: candidateIds
      }
    );
    
    if (!simError && similarityData) {
      for (const row of similarityData as { user_id: string; similarity: number }[]) {
        embeddingSimilarities.set(row.user_id, row.similarity);
      }
    } else if (simError) {
      logWarning('Embedding similarity query failed, using fallback', { error: simError.message });
    }
  }

  // Get behavioral scores
  const { data: interactionsData } = await supabase
    .from('user_interaction_events')
    .select('target_user_id, event_type, created_at')
    .eq('user_id', userId)
    .in('target_user_id', candidateIds);

  const interactions = (interactionsData || []) as InteractionRow[];

  // Get signal weights
  const { data: signalWeightsData } = await supabase
    .from('ml_signal_weights')
    .select('*')
    .eq('is_active', true);

  const signalWeights = (signalWeightsData || []) as SignalWeight[];
  const weightMap = new Map(signalWeights.map(w => [w.signal_name, w]));

  // Calculate behavioral scores
  const behavioralScores = new Map<string, number>();
  for (const interaction of interactions) {
    const weight = weightMap.get(interaction.event_type);
    if (weight) {
      const contextWeight = context === 'zone' ? weight.zone_weight : weight.pulse_weight;
      const decay = Math.exp(-0.693 * (Date.now() - new Date(interaction.created_at).getTime()) / (weight.decay_half_life_days * 86400000));
      const score = contextWeight * decay;
      behavioralScores.set(
        interaction.target_user_id,
        (behavioralScores.get(interaction.target_user_id) || 0) + score
      );
    }
  }

  // Get session overlap for zone context
  const sessionOverlaps = new Map<string, number>();
  if (context === 'zone' && request.event_id) {
    const { data: myBookmarks } = await supabase
      .from('session_bookmarks')
      .select('session_id')
      .eq('user_id', userId)
      .eq('event_id', request.event_id);
    
    const mySessionIds = new Set((myBookmarks || []).map((b: { session_id: string }) => b.session_id));
    
    if (mySessionIds.size > 0) {
      const { data: otherBookmarks } = await supabase
        .from('session_bookmarks')
        .select('user_id, session_id')
        .eq('event_id', request.event_id)
        .in('user_id', candidateIds);
      
      for (const bookmark of (otherBookmarks || []) as { user_id: string; session_id: string }[]) {
        if (mySessionIds.has(bookmark.session_id)) {
          sessionOverlaps.set(
            bookmark.user_id,
            (sessionOverlaps.get(bookmark.user_id) || 0) + 1
          );
        }
      }
    }
  }

  // Score and rank candidates
  const scoredCandidates: MatchResult[] = candidates
    .filter(c => !blockedIds.has(c.user_id))
    .map(candidate => {
      const mySkills = myProfile?.skills || [];
      const myInterests = myProfile?.interests || [];
      const myLookingFor = myProfile?.looking_for || [];
      const candSkills = candidate.skills || [];
      const candInterests = candidate.interests || [];
      const candLookingFor = candidate.looking_for || [];

      // Calculate overlap scores
      const sharedSkills = mySkills.filter(s => candSkills.includes(s));
      const sharedInterests = myInterests.filter(i => candInterests.includes(i));
      const sharedGoals = myLookingFor.filter(g => candLookingFor.includes(g));

      // Goal complementarity
      const goalComplementarity = 
        mySkills.some(s => candLookingFor.includes(s)) ||
        candSkills.some(s => myLookingFor.includes(s));

      // Overlap score (0-100)
      const skillScore = Math.min(40, sharedSkills.length * 12);
      const interestScore = Math.min(30, sharedInterests.length * 10);
      const goalScore = goalComplementarity ? 25 : sharedGoals.length * 8;
      const orgScore = myProfile?.organization && 
        myProfile.organization.toLowerCase() === (candidate.organization || '').toLowerCase() ? 12 : 0;
      const overlapScore = skillScore + interestScore + goalScore + orgScore;

      // Embedding similarity from pgvector cosine distance
      const embeddingSimilarity = embeddingSimilarities.get(candidate.user_id) ?? null;

      // Behavioral score
      const rawBehavioral = behavioralScores.get(candidate.user_id) || 0;
      const behavioralScore = Math.min(100, Math.max(-50, rawBehavioral));

      // Session overlap score
      const sessionScore = Math.min(100, (sessionOverlaps.get(candidate.user_id) || 0) * 15);

      // Freshness score
      const lastActive = candidate.last_active_at ? new Date(candidate.last_active_at).getTime() : 0;
      const hoursSinceActive = (Date.now() - lastActive) / 3600000;
      const freshnessScore = Math.max(0, 100 - hoursSinceActive * 2);

      // Final weighted score using experiment weights
      const finalScore = Math.round(
        (embeddingSimilarity !== null ? embeddingSimilarity : overlapScore) * weights.embedding +
        behavioralScore * weights.behavioral +
        overlapScore * weights.overlap +
        sessionScore * weights.session +
        freshnessScore * weights.freshness
      );

      // Determine match category
      let matchCategory = 'general';
      if (goalComplementarity) matchCategory = 'complementary';
      else if (sharedSkills.length >= 3) matchCategory = 'professional';
      else if (sharedInterests.length >= 3) matchCategory = 'social';
      else if (sessionScore > 30) matchCategory = 'event';

      return {
        user_id: candidate.user_id,
        full_name: candidate.full_name || 'User',
        avatar_url: candidate.avatar_url,
        headline: candidate.headline,
        organization: candidate.organization,
        match_score: Math.max(0, Math.min(100, finalScore)),
        shared_skills: sharedSkills,
        shared_interests: sharedInterests,
        shared_goals: sharedGoals,
        is_online: candidate.is_online || false,
        is_premium: candidate.is_premium || false,
        is_verified: candidate.is_verified || false,
        match_category: matchCategory,
        embedding_similarity: embeddingSimilarity,
        behavioral_score: behavioralScore
      };
    });

  // Sort by match score
  scoredCandidates.sort((a, b) => {
    if (a.is_premium !== b.is_premium) return a.is_premium ? -1 : 1;
    if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
    return b.match_score - a.match_score;
  });

  const paginatedMatches = scoredCandidates.slice(offset, offset + limit);
  const avgScore = paginatedMatches.length > 0 
    ? paginatedMatches.reduce((sum, m) => sum + m.match_score, 0) / paginatedMatches.length 
    : 0;

  return { matches: paginatedMatches, avgScore };
}

// =============================================
// MAIN HANDLER WITH A/B TESTING INTEGRATION
// =============================================
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = initRequestContext('get-ai-matches');
  const startTime = Date.now();

  try {
    // 1. Authentication
    const authStart = Date.now();
    const auth = await validateAuth(req);
    checkSlowOperation('auth_validation', authStart, 200);
    
    if (!auth.authenticated || !auth.userId) {
      logRequestComplete(401);
      return errorResponse('Unauthorized', 401, corsHeaders);
    }

    // 2. Rate limiting (60 requests per minute)
    const rateCheck = checkRateLimit(auth.userId, 'get-ai-matches', { maxRequests: 60, windowMs: 60000 });
    if (!rateCheck.allowed) {
      logWarning('Rate limit exceeded', { userId: auth.userId, remaining: rateCheck.remaining });
      logRequestComplete(429);
      return errorResponse('Rate limit exceeded', 429, corsHeaders);
    }

    // 3. Parse request
    const body = await req.json() as MatchRequest;
    
    if (!body.context || !['pulse', 'zone'].includes(body.context)) {
      logRequestComplete(400);
      return errorResponse('context must be "pulse" or "zone"', 400, corsHeaders);
    }
    
    if (body.context === 'zone' && !body.event_id) {
      logRequestComplete(400);
      return errorResponse('event_id required for zone context', 400, corsHeaders);
    }
    
    if (body.event_id && !validateUUID(body.event_id)) {
      logRequestComplete(400);
      return errorResponse('Invalid event_id format', 400, corsHeaders);
    }

    // 4. Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 5. Fetch experiment weights from A/B testing system
    const { data: weightConfigData, error: weightError } = await supabase.rpc(
      'get_experiment_weights',
      {
        target_user_id: auth.userId,
        context: body.context
      }
    );

    const defaultWeights = body.context === 'zone' ? {
      embedding: 0.25,
      behavioral: 0.15,
      overlap: 0.20,
      session: 0.30,
      freshness: 0.10
    } : {
      embedding: 0.40,
      behavioral: 0.30,
      overlap: 0.20,
      session: 0.00,
      freshness: 0.10
    };

    const experimentWeights: ExperimentWeights = weightError ? {
      experiment_id: null,
      variant: 'control',
      weights: defaultWeights
    } : {
      experiment_id: weightConfigData?.experiment_id || null,
      variant: weightConfigData?.variant || 'control',
      weights: weightConfigData?.weights || defaultWeights
    };

    // 6. Get matches with experiment weights
    const matchingStart = Date.now();
    const { matches, avgScore } = await getSmartMatches(supabase, auth.userId, body, experimentWeights);
    const matchingDuration = Date.now() - matchingStart;
    
    // Log slow matching operations
    if (matchingDuration > 500) {
      logWarning('Slow matching operation', {
        userId: auth.userId,
        context: body.context,
        durationMs: matchingDuration,
        matchCount: matches.length,
        variant: experimentWeights.variant,
      });
    }

    // 7. Log match impression for A/B testing analytics
    const totalDuration = Date.now() - startTime;
    
    if (matches.length > 0) {
      await supabase.from('ai_match_impressions').insert({
        user_id: auth.userId,
        experiment_id: experimentWeights.experiment_id,
        variant: experimentWeights.variant,
        context: body.context,
        event_id: body.event_id || null,
        match_user_ids: matches.map(m => m.user_id),
        match_scores: matches.map(m => m.match_score),
        avg_score: avgScore,
        weights_config: experimentWeights.weights,
        processing_time_ms: totalDuration
      }).then(({ error }) => {
        if (error) {
          logWarning('Failed to log match impression', { error: error.message });
        }
      });
    }

    const premiumCount = matches.filter(m => m.is_premium).length;
    const onlineCount = matches.filter(m => m.is_online).length;

    logInfo('Returned matches', { 
      userId: auth.userId, 
      context: body.context,
      matchCount: matches.length,
      avgScore: Math.round(avgScore),
      premiumCount,
      onlineCount,
      matchingDurationMs: matchingDuration,
      totalDurationMs: totalDuration,
      experimentId: experimentWeights.experiment_id,
      variant: experimentWeights.variant,
    });
    
    logRequestComplete(200);
    return successResponse({ 
      success: true, 
      matches,
      context: body.context,
      total: matches.length,
      _meta: {
        avg_score: Math.round(avgScore),
        processing_time_ms: totalDuration,
        experiment_id: experimentWeights.experiment_id,
        variant: experimentWeights.variant,
        weights_used: experimentWeights.weights
      }
    }, corsHeaders);

  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Get AI matches error', error, { durationMs: duration });
    logRequestComplete(500);
    return errorResponse('Internal server error', 500, corsHeaders);
  }
});
