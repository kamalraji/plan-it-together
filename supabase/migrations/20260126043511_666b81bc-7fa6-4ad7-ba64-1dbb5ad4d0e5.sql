-- ============================================
-- YouTube Live Streaming RLS Policies & Schema Updates
-- ============================================

-- Add workspace_id column to event_live_streams if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_live_streams' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE public.event_live_streams 
    ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add youtube_broadcast_id column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_live_streams' AND column_name = 'youtube_broadcast_id'
  ) THEN
    ALTER TABLE public.event_live_streams 
    ADD COLUMN youtube_broadcast_id TEXT;
  END IF;
END $$;

-- Add youtube_stream_key column if not exists  
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_live_streams' AND column_name = 'youtube_stream_key'
  ) THEN
    ALTER TABLE public.event_live_streams 
    ADD COLUMN youtube_stream_key TEXT;
  END IF;
END $$;

-- Add privacy_status column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_live_streams' AND column_name = 'privacy_status'
  ) THEN
    ALTER TABLE public.event_live_streams 
    ADD COLUMN privacy_status TEXT DEFAULT 'unlisted';
  END IF;
END $$;

-- Add thumbnail_url column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_live_streams' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE public.event_live_streams 
    ADD COLUMN thumbnail_url TEXT;
  END IF;
END $$;

-- Add title column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_live_streams' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.event_live_streams 
    ADD COLUMN title TEXT;
  END IF;
END $$;

-- Add description column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_live_streams' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.event_live_streams 
    ADD COLUMN description TEXT;
  END IF;
END $$;

-- Add scheduled_start column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'event_live_streams' AND column_name = 'scheduled_start'
  ) THEN
    ALTER TABLE public.event_live_streams 
    ADD COLUMN scheduled_start TIMESTAMPTZ;
  END IF;
END $$;

-- Enable RLS on event_live_streams
ALTER TABLE public.event_live_streams ENABLE ROW LEVEL SECURITY;

-- Enable RLS on stream_viewer_sessions
ALTER TABLE public.stream_viewer_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Workspace members can view live streams" ON public.event_live_streams;
DROP POLICY IF EXISTS "Workspace managers can create live streams" ON public.event_live_streams;
DROP POLICY IF EXISTS "Workspace managers can update live streams" ON public.event_live_streams;
DROP POLICY IF EXISTS "Workspace managers can delete live streams" ON public.event_live_streams;

-- Policy: Workspace members can view live streams (using correct table name)
CREATE POLICY "Workspace members can view live streams"
ON public.event_live_streams FOR SELECT
TO authenticated
USING (
  workspace_id IS NULL 
  OR EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = event_live_streams.workspace_id
    AND wtm.user_id = auth.uid()
  )
);

-- Policy: Workspace managers can create live streams
CREATE POLICY "Workspace managers can create live streams"
ON public.event_live_streams FOR INSERT
TO authenticated
WITH CHECK (
  workspace_id IS NULL 
  OR EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = event_live_streams.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.role IN (
      'WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'TECH_FINANCE_MANAGER',
      'TECHNICAL_LEAD', 'IT_LEAD', 'MEDIA_LEAD', 'CONTENT_LEAD',
      'owner', 'admin', 'manager', 'l1_organizer', 'l2_committee_head'
    )
  )
);

-- Policy: Workspace managers can update live streams
CREATE POLICY "Workspace managers can update live streams"
ON public.event_live_streams FOR UPDATE
TO authenticated
USING (
  workspace_id IS NULL 
  OR EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = event_live_streams.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.role IN (
      'WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'TECH_FINANCE_MANAGER',
      'TECHNICAL_LEAD', 'IT_LEAD', 'MEDIA_LEAD', 'CONTENT_LEAD',
      'owner', 'admin', 'manager', 'l1_organizer', 'l2_committee_head'
    )
  )
);

-- Policy: Workspace managers can delete live streams
CREATE POLICY "Workspace managers can delete live streams"
ON public.event_live_streams FOR DELETE
TO authenticated
USING (
  workspace_id IS NULL 
  OR EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = event_live_streams.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.role IN (
      'WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'TECH_FINANCE_MANAGER',
      'TECHNICAL_LEAD', 'IT_LEAD',
      'owner', 'admin', 'manager', 'l1_organizer'
    )
  )
);

-- Stream viewer sessions policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.stream_viewer_sessions;
DROP POLICY IF EXISTS "Users can create viewer sessions" ON public.stream_viewer_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.stream_viewer_sessions;
DROP POLICY IF EXISTS "Workspace managers can view all sessions" ON public.stream_viewer_sessions;

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.stream_viewer_sessions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can create viewer sessions
CREATE POLICY "Users can create viewer sessions"
ON public.stream_viewer_sessions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update their own sessions"
ON public.stream_viewer_sessions FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Policy: Workspace managers can view all sessions for their streams
CREATE POLICY "Workspace managers can view all sessions"
ON public.stream_viewer_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.event_live_streams els
    JOIN public.workspace_team_members wtm ON wtm.workspace_id = els.workspace_id
    WHERE els.id = stream_viewer_sessions.stream_id
    AND wtm.user_id = auth.uid()
    AND wtm.role IN (
      'WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'TECH_FINANCE_MANAGER',
      'TECHNICAL_LEAD', 'IT_LEAD', 'MEDIA_LEAD',
      'owner', 'admin', 'manager', 'l1_organizer', 'l2_committee_head'
    )
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_live_streams_workspace_id 
ON public.event_live_streams(workspace_id);

CREATE INDEX IF NOT EXISTS idx_event_live_streams_stream_status 
ON public.event_live_streams(stream_status);

CREATE INDEX IF NOT EXISTS idx_stream_viewer_sessions_stream_id 
ON public.stream_viewer_sessions(stream_id);