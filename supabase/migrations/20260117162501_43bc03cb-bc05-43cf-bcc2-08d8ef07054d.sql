-- Create export_history table to track attendee list exports
CREATE TABLE public.export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('csv', 'xlsx', 'pdf', 'json')),
  record_count INTEGER NOT NULL DEFAULT 0,
  filters JSONB DEFAULT '{}',
  fields TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_export_history_event_id ON public.export_history(event_id);
CREATE INDEX idx_export_history_user_id ON public.export_history(user_id);
CREATE INDEX idx_export_history_workspace_id ON public.export_history(workspace_id);
CREATE INDEX idx_export_history_created_at ON public.export_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view exports for events they have access to via workspaces
CREATE POLICY "Users can view exports for their workspace events"
ON public.export_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    JOIN public.workspaces w ON w.id = wtm.workspace_id
    WHERE w.event_id = export_history.event_id
    AND wtm.user_id = auth.uid()
  )
);

-- Policy: Users can create exports for events they have access to
CREATE POLICY "Users can create exports for their workspace events"
ON public.export_history
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    JOIN public.workspaces w ON w.id = wtm.workspace_id
    WHERE w.event_id = export_history.event_id
    AND wtm.user_id = auth.uid()
  )
);

-- Policy: Users can delete their own exports
CREATE POLICY "Users can delete their own exports"
ON public.export_history
FOR DELETE
USING (auth.uid() = user_id);