-- Create table for feed scroll depth analytics
CREATE TABLE public.feed_scroll_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  max_scroll_depth REAL NOT NULL DEFAULT 0,
  posts_viewed INTEGER NOT NULL DEFAULT 0,
  total_posts_available INTEGER NOT NULL DEFAULT 0,
  scroll_duration_seconds INTEGER NOT NULL DEFAULT 0,
  reached_end BOOLEAN NOT NULL DEFAULT false,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for content engagement analytics
CREATE TABLE public.feed_engagement_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  post_id UUID NOT NULL,
  post_type TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'view', 'spark', 'comment', 'share', 'bookmark', 'expand'
  time_spent_seconds INTEGER DEFAULT 0,
  scroll_position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_feed_scroll_analytics_user_id ON public.feed_scroll_analytics(user_id);
CREATE INDEX idx_feed_scroll_analytics_created_at ON public.feed_scroll_analytics(created_at);
CREATE INDEX idx_feed_engagement_user_id ON public.feed_engagement_analytics(user_id);
CREATE INDEX idx_feed_engagement_post_type ON public.feed_engagement_analytics(post_type);
CREATE INDEX idx_feed_engagement_event_type ON public.feed_engagement_analytics(event_type);
CREATE INDEX idx_feed_engagement_created_at ON public.feed_engagement_analytics(created_at);

-- Enable RLS
ALTER TABLE public.feed_scroll_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_engagement_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies: Users can insert their own analytics
CREATE POLICY "Users can insert own scroll analytics"
ON public.feed_scroll_analytics FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own scroll analytics"
ON public.feed_scroll_analytics FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own engagement analytics"
ON public.feed_engagement_analytics FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own engagement analytics"
ON public.feed_engagement_analytics FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Create RPC for aggregated analytics (for admin dashboards)
CREATE OR REPLACE FUNCTION public.get_content_engagement_stats(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now() - INTERVAL '7 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS TABLE (
  post_type TEXT,
  event_type TEXT,
  total_events BIGINT,
  unique_users BIGINT,
  avg_time_spent NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fea.post_type,
    fea.event_type,
    COUNT(*)::BIGINT as total_events,
    COUNT(DISTINCT fea.user_id)::BIGINT as unique_users,
    ROUND(AVG(fea.time_spent_seconds)::NUMERIC, 2) as avg_time_spent
  FROM public.feed_engagement_analytics fea
  WHERE fea.created_at BETWEEN start_date AND end_date
  GROUP BY fea.post_type, fea.event_type
  ORDER BY total_events DESC;
END;
$$;

-- Create RPC for scroll depth distribution
CREATE OR REPLACE FUNCTION public.get_scroll_depth_distribution(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now() - INTERVAL '7 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS TABLE (
  depth_bucket TEXT,
  session_count BIGINT,
  avg_posts_viewed NUMERIC,
  avg_duration_seconds NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN fsa.max_scroll_depth < 0.25 THEN '0-25%'
      WHEN fsa.max_scroll_depth < 0.50 THEN '25-50%'
      WHEN fsa.max_scroll_depth < 0.75 THEN '50-75%'
      ELSE '75-100%'
    END as depth_bucket,
    COUNT(*)::BIGINT as session_count,
    ROUND(AVG(fsa.posts_viewed)::NUMERIC, 1) as avg_posts_viewed,
    ROUND(AVG(fsa.scroll_duration_seconds)::NUMERIC, 1) as avg_duration_seconds
  FROM public.feed_scroll_analytics fsa
  WHERE fsa.created_at BETWEEN start_date AND end_date
  GROUP BY depth_bucket
  ORDER BY depth_bucket;
END;
$$;