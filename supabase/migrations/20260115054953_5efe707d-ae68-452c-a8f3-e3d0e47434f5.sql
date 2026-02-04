-- Add columns to workspace_checklists for shared checklist support
ALTER TABLE public.workspace_checklists 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Create index for efficient querying of shared checklists by event
CREATE INDEX IF NOT EXISTS idx_workspace_checklists_shared_event 
ON public.workspace_checklists(event_id, is_shared) 
WHERE is_shared = true;

-- Update RLS policy to allow reading shared checklists across workspaces in the same event
CREATE POLICY "Users can view shared checklists for their event workspaces"
ON public.workspace_checklists
FOR SELECT
USING (
  is_shared = true 
  AND event_id IN (
    SELECT DISTINCT w.event_id 
    FROM workspaces w
    INNER JOIN workspace_team_members wtm ON wtm.workspace_id = w.id
    WHERE wtm.user_id = auth.uid()
  )
);