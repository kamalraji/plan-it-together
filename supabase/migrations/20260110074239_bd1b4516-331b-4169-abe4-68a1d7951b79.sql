-- Fix the INSERT policy to only allow service role (not regular users)
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.workspace_audit_logs;

-- Create a more restrictive policy that only allows authenticated users who are workspace owners
-- In practice, inserts will happen via service role in edge functions which bypasses RLS
CREATE POLICY "Workspace owners can insert audit logs"
ON public.workspace_audit_logs
FOR INSERT
WITH CHECK (
  public.is_workspace_owner(workspace_id, auth.uid())
);