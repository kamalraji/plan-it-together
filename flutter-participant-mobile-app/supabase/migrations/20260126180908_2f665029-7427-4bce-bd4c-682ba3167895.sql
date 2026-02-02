-- Fix security definer view by dropping and recreating as regular view with RLS check
DROP VIEW IF EXISTS public.ai_matching_hourly_stats;

-- Recreate as a function that enforces admin check (safer than security definer view)
CREATE OR REPLACE FUNCTION public.get_ai_matching_hourly_stats(
  p_context TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  hour TIMESTAMPTZ,
  total_events BIGINT,
  unique_users BIGINT,
  matches_loaded BIGINT,
  matches_viewed BIGINT,
  matches_expanded BIGINT,
  conversation_starters_used BIGINT,
  follows BIGINT,
  errors BIGINT,
  avg_match_score NUMERIC,
  context TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enforce admin-only access
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    date_trunc('hour', a.created_at) as hour,
    count(*)::BIGINT as total_events,
    count(DISTINCT a.user_id)::BIGINT as unique_users,
    count(*) FILTER (WHERE a.event_type = 'ai_matches_loaded')::BIGINT as matches_loaded,
    count(*) FILTER (WHERE a.event_type = 'ai_match_viewed')::BIGINT as matches_viewed,
    count(*) FILTER (WHERE a.event_type = 'ai_match_expanded')::BIGINT as matches_expanded,
    count(*) FILTER (WHERE a.event_type = 'ai_conversation_starter_used')::BIGINT as conversation_starters_used,
    count(*) FILTER (WHERE a.event_type = 'ai_match_followed')::BIGINT as follows,
    count(*) FILTER (WHERE a.event_type = 'ai_error_occurred')::BIGINT as errors,
    avg(a.match_score) FILTER (WHERE a.match_score IS NOT NULL) as avg_match_score,
    a.context
  FROM public.ai_matching_analytics a
  WHERE a.created_at > now() - (p_days || ' days')::INTERVAL
    AND (p_context IS NULL OR a.context = p_context)
  GROUP BY date_trunc('hour', a.created_at), a.context
  ORDER BY hour DESC;
END;
$$;

-- Revoke direct access, only allow authenticated users (function enforces admin check)
REVOKE ALL ON FUNCTION public.get_ai_matching_hourly_stats(TEXT, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_ai_matching_hourly_stats(TEXT, INTEGER) TO authenticated;