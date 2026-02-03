-- Add workspace_id to certificates table
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to certificate_criteria table  
ALTER TABLE public.certificate_criteria
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificates_workspace_id ON public.certificates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_certificate_criteria_workspace_id ON public.certificate_criteria(workspace_id);

-- Backfill workspace_id from event_id by matching workspaces.event_id
UPDATE public.certificates c
SET workspace_id = w.id
FROM public.workspaces w
WHERE c.event_id = w.event_id
  AND w.workspace_type = 'ROOT'
  AND c.workspace_id IS NULL;

UPDATE public.certificate_criteria cc
SET workspace_id = w.id
FROM public.workspaces w
WHERE cc.event_id = w.event_id
  AND w.workspace_type = 'ROOT'
  AND cc.workspace_id IS NULL;

-- Create helper security function for workspace management access
CREATE OR REPLACE FUNCTION public.has_workspace_management_access(
  _workspace_id UUID,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_workspace_owner(_workspace_id, _user_id) OR
    EXISTS (
      SELECT 1 FROM workspace_team_members
      WHERE workspace_id = _workspace_id
        AND user_id = _user_id
        AND status = 'ACTIVE'
        AND role IN (
          'WORKSPACE_OWNER',
          'OPERATIONS_MANAGER',
          'GROWTH_MANAGER',
          'CONTENT_MANAGER',
          'TECH_FINANCE_MANAGER',
          'VOLUNTEERS_MANAGER',
          'EVENT_COORDINATOR'
        )
    );
$$;

-- Drop old RLS policies if they exist
DROP POLICY IF EXISTS "Organizers manage certificates" ON public.certificates;
DROP POLICY IF EXISTS "Organizers manage certificate criteria" ON public.certificate_criteria;
DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Event owners can manage certificates" ON public.certificates;
DROP POLICY IF EXISTS "Event owners can manage certificate criteria" ON public.certificate_criteria;

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_criteria ENABLE ROW LEVEL SECURITY;

-- Certificates: Recipients and workspace members can view
CREATE POLICY "View certificates"
  ON public.certificates FOR SELECT
  USING (
    recipient_id = auth.uid() OR 
    public.has_workspace_access(workspace_id)
  );

-- Certificates: Workspace managers can insert
CREATE POLICY "Insert certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (public.has_workspace_management_access(workspace_id));

-- Certificates: Workspace managers can update
CREATE POLICY "Update certificates"
  ON public.certificates FOR UPDATE
  USING (public.has_workspace_management_access(workspace_id))
  WITH CHECK (public.has_workspace_management_access(workspace_id));

-- Certificates: Workspace managers can delete
CREATE POLICY "Delete certificates"
  ON public.certificates FOR DELETE
  USING (public.has_workspace_management_access(workspace_id));

-- Certificate Criteria: Workspace members can view
CREATE POLICY "View certificate criteria"
  ON public.certificate_criteria FOR SELECT
  USING (public.has_workspace_access(workspace_id));

-- Certificate Criteria: Workspace managers can insert
CREATE POLICY "Insert certificate criteria"
  ON public.certificate_criteria FOR INSERT
  WITH CHECK (public.has_workspace_management_access(workspace_id));

-- Certificate Criteria: Workspace managers can update
CREATE POLICY "Update certificate criteria"
  ON public.certificate_criteria FOR UPDATE
  USING (public.has_workspace_management_access(workspace_id))
  WITH CHECK (public.has_workspace_management_access(workspace_id));

-- Certificate Criteria: Workspace managers can delete
CREATE POLICY "Delete certificate criteria"
  ON public.certificate_criteria FOR DELETE
  USING (public.has_workspace_management_access(workspace_id));