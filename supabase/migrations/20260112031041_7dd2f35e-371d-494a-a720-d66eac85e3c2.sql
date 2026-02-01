-- Fix workspace_audit_logs_ip_exposure: Restrict audit log access to owners/managers only
-- This prevents regular members from seeing IP addresses and user agent data

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Workspace members can view audit logs" ON workspace_audit_logs;

-- Create restricted policy for owners and managers only
CREATE POLICY "Workspace owners and managers view audit logs"
ON workspace_audit_logs FOR SELECT
USING (
  -- Workspace organizer (owner)
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_audit_logs.workspace_id
    AND w.organizer_id = auth.uid()
  )
  OR
  -- Privileged team members (OWNER, ADMIN, MANAGER roles)
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_audit_logs.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.role IN ('OWNER', 'ADMIN', 'MANAGER')
    AND wtm.status = 'ACTIVE'
  )
  OR
  -- System admins
  public.has_role(auth.uid(), 'admin')
);