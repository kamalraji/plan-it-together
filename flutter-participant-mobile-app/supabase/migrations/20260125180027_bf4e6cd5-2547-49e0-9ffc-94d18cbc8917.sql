-- =============================================
-- YouTube Live Streaming Tables
-- Phase 1: Database schema for live stream feature
-- =============================================

-- Table: event_live_streams
CREATE TABLE public.event_live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'YOUTUBE',
  video_id TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  stream_status TEXT NOT NULL DEFAULT 'scheduled',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  viewer_count INTEGER DEFAULT 0,
  chat_enabled BOOLEAN DEFAULT true,
  is_recording_available BOOLEAN DEFAULT false,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_platform CHECK (platform IN ('YOUTUBE', 'VIMEO', 'CUSTOM')),
  CONSTRAINT valid_stream_status CHECK (stream_status IN ('scheduled', 'live', 'ended', 'error'))
);

-- Performance indexes
CREATE INDEX idx_live_streams_session ON event_live_streams(session_id);
CREATE INDEX idx_live_streams_event ON event_live_streams(event_id);
CREATE INDEX idx_live_streams_status ON event_live_streams(stream_status);
CREATE INDEX idx_live_streams_event_status ON event_live_streams(event_id, stream_status);

-- Enable RLS
ALTER TABLE event_live_streams ENABLE ROW LEVEL SECURITY;

-- Policy: Checked-in attendees can view streams
CREATE POLICY "Checked-in attendees can view streams"
ON event_live_streams FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM event_checkins ec
    WHERE ec.event_id = event_live_streams.event_id
    AND ec.user_id = auth.uid()
    AND ec.checkout_time IS NULL
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Policy: Organizers can manage streams (simplified using owner_id and workspace access)
CREATE POLICY "Organizers can manage streams"
ON event_live_streams FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_live_streams.event_id
    AND e.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.event_id = event_live_streams.event_id
    AND public.has_workspace_access(w.id::uuid, auth.uid()::uuid)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_live_streams.event_id
    AND e.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.event_id = event_live_streams.event_id
    AND public.has_workspace_access(w.id::uuid, auth.uid()::uuid)
  )
);

-- Table: stream_viewer_sessions
CREATE TABLE public.stream_viewer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES event_live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  watch_duration_seconds INTEGER DEFAULT 0,
  quality_preference TEXT DEFAULT 'auto',
  device_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(stream_id, user_id)
);

-- Performance indexes
CREATE INDEX idx_viewer_sessions_stream ON stream_viewer_sessions(stream_id);
CREATE INDEX idx_viewer_sessions_user ON stream_viewer_sessions(user_id);
CREATE INDEX idx_viewer_sessions_active ON stream_viewer_sessions(stream_id, last_seen_at);

-- Enable RLS
ALTER TABLE stream_viewer_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own viewer sessions
CREATE POLICY "Users can manage own viewer sessions"
ON stream_viewer_sessions FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Organizers can view all viewer sessions for analytics
CREATE POLICY "Organizers can view stream analytics"
ON stream_viewer_sessions FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM event_live_streams els
    JOIN events e ON e.id = els.event_id
    WHERE els.id = stream_viewer_sessions.stream_id
    AND e.owner_id = auth.uid()
  )
);

-- Trigger: Update updated_at on event_live_streams
CREATE TRIGGER update_live_streams_updated_at
BEFORE UPDATE ON event_live_streams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function: Get active viewer count for a stream
CREATE OR REPLACE FUNCTION public.get_stream_viewer_count(p_stream_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM stream_viewer_sessions
  WHERE stream_id = p_stream_id
  AND last_seen_at > now() - INTERVAL '2 minutes';
$$;

-- Function: Update viewer heartbeat (upsert pattern)
CREATE OR REPLACE FUNCTION public.update_stream_viewer_heartbeat(
  p_stream_id UUID,
  p_quality TEXT DEFAULT 'auto',
  p_device_type TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing_started_at TIMESTAMPTZ;
  v_duration INTEGER;
BEGIN
  -- Get existing session start time
  SELECT started_at INTO v_existing_started_at
  FROM stream_viewer_sessions
  WHERE stream_id = p_stream_id AND user_id = v_user_id;
  
  IF v_existing_started_at IS NOT NULL THEN
    -- Calculate duration since session start
    v_duration := EXTRACT(EPOCH FROM (now() - v_existing_started_at))::INTEGER;
    
    -- Update existing session
    UPDATE stream_viewer_sessions
    SET last_seen_at = now(),
        watch_duration_seconds = v_duration,
        quality_preference = COALESCE(p_quality, quality_preference),
        device_type = COALESCE(p_device_type, device_type)
    WHERE stream_id = p_stream_id AND user_id = v_user_id;
  ELSE
    -- Insert new session
    INSERT INTO stream_viewer_sessions (stream_id, user_id, quality_preference, device_type)
    VALUES (p_stream_id, v_user_id, p_quality, p_device_type);
  END IF;
  
  -- Update viewer count on stream (denormalized for performance)
  UPDATE event_live_streams
  SET viewer_count = (SELECT get_stream_viewer_count(p_stream_id))
  WHERE id = p_stream_id;
END;
$$;