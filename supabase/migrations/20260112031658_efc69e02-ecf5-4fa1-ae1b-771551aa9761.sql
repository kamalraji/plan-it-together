-- Fix workspace_social_api_credentials_weak_protection: Restrict API credentials to owners only
-- Managers should not have access to sensitive social media API credentials

-- Drop the current policy that allows managers
DROP POLICY IF EXISTS "Workspace managers can manage API credentials" ON workspace_social_api_credentials;

-- Create restricted policy for workspace owners only
CREATE POLICY "Workspace owners can manage API credentials"
ON workspace_social_api_credentials FOR ALL
TO authenticated
USING (
  -- Workspace organizer (creator/owner)
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_social_api_credentials.workspace_id
    AND w.organizer_id = auth.uid()
  )
  OR
  -- Team members with OWNER role only (not managers)
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_social_api_credentials.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
    AND wtm.role = 'OWNER'
  )
  OR
  -- System admins
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  -- Same restrictions for inserts/updates
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_social_api_credentials.workspace_id
    AND w.organizer_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_social_api_credentials.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
    AND wtm.role = 'OWNER'
  )
  OR
  public.has_role(auth.uid(), 'admin')
);