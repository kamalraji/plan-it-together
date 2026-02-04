-- Policy: Event owners can manage their event streams
CREATE POLICY "Event owners can manage their streams"
ON public.event_live_streams
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_live_streams.event_id
    AND e.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_live_streams.event_id
    AND e.owner_id = auth.uid()
  )
);

-- Create stream_viewer_sessions table for analytics
CREATE TABLE IF NOT EXISTS public.stream_viewer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.event_live_streams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_token text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  watch_duration_seconds integer DEFAULT 0,
  quality_preference text,
  device_type text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on stream_viewer_sessions
ALTER TABLE public.stream_viewer_sessions ENABLE ROW LEVEL SECURITY;

-- Index for stream analytics queries
CREATE INDEX IF NOT EXISTS idx_stream_viewer_sessions_stream_id 
ON public.stream_viewer_sessions(stream_id);

CREATE INDEX IF NOT EXISTS idx_stream_viewer_sessions_user_id 
ON public.stream_viewer_sessions(user_id) WHERE user_id IS NOT NULL;

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON public.stream_viewer_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own sessions
CREATE POLICY "Users can create own sessions"
ON public.stream_viewer_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update own sessions"
ON public.stream_viewer_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Workspace managers can view all sessions for their streams
CREATE POLICY "Workspace managers can view stream sessions"
ON public.stream_viewer_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_live_streams els
    WHERE els.id = stream_viewer_sessions.stream_id
    AND public.has_workspace_management_access(auth.uid(), els.workspace_id)
  )
);

-- Create function to update stream viewer counts
CREATE OR REPLACE FUNCTION public.update_stream_viewer_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_viewers integer;
  peak_viewers integer;
  target_stream_id uuid;
BEGIN
  -- Get the stream_id from the trigger row
  target_stream_id := COALESCE(NEW.stream_id, OLD.stream_id);
  
  -- Count active sessions (started but not ended, within last 5 minutes)
  SELECT COUNT(*) INTO current_viewers
  FROM public.stream_viewer_sessions
  WHERE stream_id = target_stream_id
  AND ended_at IS NULL
  AND started_at > now() - interval '5 minutes';

  -- Get current peak
  SELECT peak_viewer_count INTO peak_viewers
  FROM public.event_live_streams
  WHERE id = target_stream_id;

  -- Update stream with new counts
  UPDATE public.event_live_streams
  SET 
    viewer_count = current_viewers,
    peak_viewer_count = GREATEST(COALESCE(peak_viewers, 0), current_viewers),
    updated_at = now()
  WHERE id = target_stream_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to update viewer counts
DROP TRIGGER IF EXISTS trigger_update_stream_viewer_count ON public.stream_viewer_sessions;
CREATE TRIGGER trigger_update_stream_viewer_count
AFTER INSERT OR UPDATE OR DELETE ON public.stream_viewer_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_stream_viewer_count();