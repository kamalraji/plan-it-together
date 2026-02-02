-- =============================================
-- COMMENT ANALYTICS EVENTS TABLE
-- Tracks user interactions with comments for engagement analysis
-- =============================================

-- Create analytics events table
CREATE TABLE IF NOT EXISTS public.comment_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  comment_id UUID REFERENCES public.spark_comments(id) ON DELETE CASCADE,
  post_id UUID,
  user_id UUID NOT NULL,
  target_user_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_comment_analytics_user ON public.comment_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_analytics_comment ON public.comment_analytics_events(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_analytics_post ON public.comment_analytics_events(post_id);
CREATE INDEX IF NOT EXISTS idx_comment_analytics_event_type ON public.comment_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_comment_analytics_created ON public.comment_analytics_events(created_at);

-- RLS policies
ALTER TABLE public.comment_analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own analytics events
CREATE POLICY "Users can insert own analytics"
ON public.comment_analytics_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own analytics
CREATE POLICY "Users can view own analytics"
ON public.comment_analytics_events FOR SELECT
USING (auth.uid() = user_id);

-- RPC function to get top commenters
CREATE OR REPLACE FUNCTION public.get_top_commenters(p_post_id UUID, p_limit INT DEFAULT 5)
RETURNS TABLE(user_id UUID, comment_count BIGINT, username TEXT, avatar_url TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.user_id,
    COUNT(*) as comment_count,
    up.full_name as username,
    up.avatar_url
  FROM public.spark_comments sc
  LEFT JOIN public.user_profiles up ON sc.user_id = up.user_id
  WHERE sc.post_id = p_post_id AND sc.is_deleted = false
  GROUP BY sc.user_id, up.full_name, up.avatar_url
  ORDER BY comment_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;