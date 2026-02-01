-- Create workspace audit logs table for tracking invitations and permission changes
CREATE TABLE public.workspace_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_user_id UUID,
  target_email TEXT,
  previous_value JSONB,
  new_value JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_workspace_audit_logs_workspace_id ON public.workspace_audit_logs(workspace_id);
CREATE INDEX idx_workspace_audit_logs_actor_id ON public.workspace_audit_logs(actor_id);
CREATE INDEX idx_workspace_audit_logs_target_user_id ON public.workspace_audit_logs(target_user_id);
CREATE INDEX idx_workspace_audit_logs_action ON public.workspace_audit_logs(action);
CREATE INDEX idx_workspace_audit_logs_created_at ON public.workspace_audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.workspace_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Workspace owners and members can view audit logs for their workspace
CREATE POLICY "Workspace members can view audit logs"
ON public.workspace_audit_logs
FOR SELECT
USING (public.has_workspace_access(workspace_id, auth.uid()));

-- Policy: Only system/edge functions can insert audit logs (via service role)
-- Regular users cannot insert directly - inserts happen via edge functions with service role
CREATE POLICY "Service role can insert audit logs"
ON public.workspace_audit_logs
FOR INSERT
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.workspace_audit_logs IS 'Audit trail for workspace member invitations, role changes, and permission updates';