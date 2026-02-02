-- Create route analytics events table
CREATE TABLE IF NOT EXISTS public.route_analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  route_name TEXT NOT NULL,
  route_params TEXT,
  referrer TEXT,
  entered_at TIMESTAMPTZ NOT NULL,
  exited_at TIMESTAMPTZ,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL DEFAULT 'page_view',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create route navigation patterns table
CREATE TABLE IF NOT EXISTS public.route_navigation_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  from_route TEXT NOT NULL,
  to_route TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  dwell_time_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.route_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_navigation_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policies for route_analytics_events
CREATE POLICY "Users can view own analytics"
ON public.route_analytics_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert analytics"
ON public.route_analytics_events
FOR INSERT
TO service_role
WITH CHECK (true);

-- RLS policies for route_navigation_patterns
CREATE POLICY "Users can view own navigation patterns"
ON public.route_navigation_patterns
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert navigation patterns"
ON public.route_navigation_patterns
FOR INSERT
TO service_role
WITH CHECK (true);

-- Indexes for query performance
CREATE INDEX idx_analytics_events_user_session ON public.route_analytics_events(user_id, session_id);
CREATE INDEX idx_analytics_events_route ON public.route_analytics_events(route_name, created_at DESC);
CREATE INDEX idx_analytics_events_created ON public.route_analytics_events(created_at DESC);
CREATE INDEX idx_nav_patterns_user ON public.route_navigation_patterns(user_id, timestamp DESC);
CREATE INDEX idx_nav_patterns_routes ON public.route_navigation_patterns(from_route, to_route);

-- Function to update profile view stats (for aggregated metrics)
CREATE OR REPLACE FUNCTION public.update_profile_view_stats(
  p_user_id UUID,
  p_view_count INTEGER,
  p_total_duration_ms INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This is a placeholder for aggregated stats
  -- In production, you might update a user_analytics_summary table
  INSERT INTO route_analytics_events (
    user_id,
    session_id,
    route_name,
    entered_at,
    duration_ms,
    event_type,
    metadata
  ) VALUES (
    p_user_id,
    'aggregation',
    '/profile/_summary',
    now(),
    p_total_duration_ms,
    'summary',
    jsonb_build_object('view_count', p_view_count, 'total_duration_ms', p_total_duration_ms)
  );
END;
$$;