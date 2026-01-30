-- Phase 1: Add draft storage column for autosave/draft system
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS draft_landing_page_data jsonb;

COMMENT ON COLUMN public.events.draft_landing_page_data IS 
  'Working draft of landing page (not yet published). Autosave writes here.';

-- Phase 2: Create version history table for landing pages
CREATE TABLE IF NOT EXISTS public.landing_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  landing_page_data JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  label TEXT,
  UNIQUE(event_id, version_number)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_lpv_event ON public.landing_page_versions(event_id);

-- Enable RLS
ALTER TABLE public.landing_page_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Workspace members can view versions via workspace_team_members
CREATE POLICY "Workspace members can view landing page versions"
  ON public.landing_page_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = w.id
      WHERE w.event_id = landing_page_versions.event_id
      AND wtm.user_id = auth.uid()
    )
  );

-- RLS Policy: Workspace members can insert versions
CREATE POLICY "Workspace members can create landing page versions"
  ON public.landing_page_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = w.id
      WHERE w.event_id = landing_page_versions.event_id
      AND wtm.user_id = auth.uid()
    )
  );

-- RLS Policy: Workspace members can delete old versions (for cleanup)
CREATE POLICY "Workspace members can delete landing page versions"
  ON public.landing_page_versions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = w.id
      WHERE w.event_id = landing_page_versions.event_id
      AND wtm.user_id = auth.uid()
    )
  );