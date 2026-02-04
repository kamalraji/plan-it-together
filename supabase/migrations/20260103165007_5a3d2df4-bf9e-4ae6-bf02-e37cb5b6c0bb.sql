-- Create workspace_settings table to persist notification and permission settings
CREATE TABLE public.workspace_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Notification settings
  notify_task_updates BOOLEAN NOT NULL DEFAULT true,
  notify_new_members BOOLEAN NOT NULL DEFAULT true,
  notify_messages BOOLEAN NOT NULL DEFAULT true,
  notify_weekly_digest BOOLEAN NOT NULL DEFAULT false,
  
  -- Permission settings
  allow_member_invites BOOLEAN NOT NULL DEFAULT true,
  allow_task_creation BOOLEAN NOT NULL DEFAULT true,
  public_visibility BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(workspace_id)
);

-- Enable RLS
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Organizers can manage workspace settings"
ON public.workspace_settings
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'organizer'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'organizer'::app_role)
);

CREATE POLICY "Workspace members can view settings"
ON public.workspace_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_settings.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
  )
);

-- Trigger for updated_at
CREATE TRIGGER set_workspace_settings_updated_at
BEFORE UPDATE ON public.workspace_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_workspaces_updated_at();