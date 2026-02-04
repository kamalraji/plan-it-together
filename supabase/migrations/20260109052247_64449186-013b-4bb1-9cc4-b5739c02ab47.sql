-- Workspace integrations table for storing webhook configurations
CREATE TABLE public.workspace_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('slack', 'discord', 'teams', 'webhook')),
  name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notification_types TEXT[] DEFAULT ARRAY['broadcast', 'task_assignment', 'deadline_reminder'],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies - workspace members can view integrations
CREATE POLICY "Workspace members can view integrations"
  ON public.workspace_integrations
  FOR SELECT
  USING (public.has_workspace_access(workspace_id));

-- Workspace owners/members can manage integrations
CREATE POLICY "Workspace members can manage integrations"
  ON public.workspace_integrations
  FOR ALL
  USING (public.has_workspace_access(workspace_id))
  WITH CHECK (public.has_workspace_access(workspace_id));

-- Updated at trigger
CREATE TRIGGER set_workspace_integrations_updated_at
  BEFORE UPDATE ON public.workspace_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for quick lookups
CREATE INDEX idx_workspace_integrations_workspace_id ON public.workspace_integrations(workspace_id);
CREATE INDEX idx_workspace_integrations_active ON public.workspace_integrations(workspace_id, is_active) WHERE is_active = true;