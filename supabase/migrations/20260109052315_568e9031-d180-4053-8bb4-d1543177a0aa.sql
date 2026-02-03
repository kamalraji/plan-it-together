-- Fix the overly permissive RLS policy by splitting into specific operations
DROP POLICY IF EXISTS "Workspace members can manage integrations" ON public.workspace_integrations;

-- Specific policies for each operation
CREATE POLICY "Workspace members can insert integrations"
  ON public.workspace_integrations
  FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update integrations"
  ON public.workspace_integrations
  FOR UPDATE
  USING (public.has_workspace_access(workspace_id))
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete integrations"
  ON public.workspace_integrations
  FOR DELETE
  USING (public.has_workspace_access(workspace_id));