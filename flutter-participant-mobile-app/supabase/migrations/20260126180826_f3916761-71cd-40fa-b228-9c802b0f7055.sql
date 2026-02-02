-- ============================================
-- Phase 8: AI Matching Monitoring & Analytics Tables
-- ============================================

-- AI Matching Performance Metrics (server-side aggregation)
CREATE TABLE IF NOT EXISTS public.ai_matching_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_matching_metrics ENABLE ROW LEVEL SECURITY;

-- Users can insert their own metrics
CREATE POLICY "Users can insert own metrics"
ON public.ai_matching_metrics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only service role can read (for analytics dashboard)
CREATE POLICY "Service role can read all metrics"
ON public.ai_matching_metrics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- AI Matching Analytics Events (client-side tracking)
CREATE TABLE IF NOT EXISTS public.ai_matching_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  match_user_id UUID,
  match_score INTEGER,
  match_category TEXT,
  context TEXT NOT NULL DEFAULT 'pulse',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_matching_analytics ENABLE ROW LEVEL SECURITY;

-- Users can insert their own analytics
CREATE POLICY "Users can insert own analytics"
ON public.ai_matching_analytics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only admins can read analytics
CREATE POLICY "Admins can read all analytics"
ON public.ai_matching_analytics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for efficient analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_matching_analytics_user_id ON public.ai_matching_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_matching_analytics_event_type ON public.ai_matching_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_ai_matching_analytics_created_at ON public.ai_matching_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_matching_analytics_context ON public.ai_matching_analytics(context);

CREATE INDEX IF NOT EXISTS idx_ai_matching_metrics_user_id ON public.ai_matching_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_matching_metrics_created_at ON public.ai_matching_metrics(created_at DESC);

-- AI Match Quality Tracking (for model improvement)
CREATE TABLE IF NOT EXISTS public.ai_match_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  match_score INTEGER NOT NULL,
  match_category TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'irrelevant', 'great_match')),
  feedback_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, target_user_id)
);

-- Enable RLS
ALTER TABLE public.ai_match_feedback ENABLE ROW LEVEL SECURITY;

-- Users can manage their own feedback
CREATE POLICY "Users can manage own feedback"
ON public.ai_match_feedback
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for feedback analysis
CREATE INDEX IF NOT EXISTS idx_ai_match_feedback_user_id ON public.ai_match_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_match_feedback_type ON public.ai_match_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_match_feedback_score ON public.ai_match_feedback(match_score);

-- ============================================
-- Performance Monitoring Views (for dashboards)
-- ============================================

-- Hourly aggregated metrics view
CREATE OR REPLACE VIEW public.ai_matching_hourly_stats AS
SELECT 
  date_trunc('hour', created_at) as hour,
  count(*) as total_events,
  count(DISTINCT user_id) as unique_users,
  count(*) FILTER (WHERE event_type = 'ai_matches_loaded') as matches_loaded,
  count(*) FILTER (WHERE event_type = 'ai_match_viewed') as matches_viewed,
  count(*) FILTER (WHERE event_type = 'ai_match_expanded') as matches_expanded,
  count(*) FILTER (WHERE event_type = 'ai_conversation_starter_used') as conversation_starters_used,
  count(*) FILTER (WHERE event_type = 'ai_match_followed') as follows,
  count(*) FILTER (WHERE event_type = 'ai_error_occurred') as errors,
  avg(match_score) FILTER (WHERE match_score IS NOT NULL) as avg_match_score,
  context
FROM public.ai_matching_analytics
WHERE created_at > now() - interval '7 days'
GROUP BY date_trunc('hour', created_at), context
ORDER BY hour DESC;

-- Grant access to admins only
REVOKE ALL ON public.ai_matching_hourly_stats FROM anon, authenticated;
GRANT SELECT ON public.ai_matching_hourly_stats TO authenticated;

-- ============================================
-- Refresh interaction summary function (for scheduled job)
-- ============================================
CREATE OR REPLACE FUNCTION public.refresh_ai_matching_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Refresh the interaction summary materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_interaction_summary;
  
  -- Clean up old analytics data (keep 90 days)
  DELETE FROM public.ai_matching_analytics
  WHERE created_at < now() - interval '90 days';
  
  -- Clean up old metrics data (keep 30 days)
  DELETE FROM public.ai_matching_metrics
  WHERE created_at < now() - interval '30 days';
END;
$$;

-- Revoke direct API access
REVOKE EXECUTE ON FUNCTION public.refresh_ai_matching_data() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_ai_matching_data() TO service_role;