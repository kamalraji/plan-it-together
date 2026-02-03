-- Drop ALL existing policies on certificates table
DROP POLICY IF EXISTS "Delete certificates" ON public.certificates;
DROP POLICY IF EXISTS "Insert certificates" ON public.certificates;
DROP POLICY IF EXISTS "Update certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users view own certificates" ON public.certificates;
DROP POLICY IF EXISTS "View certificates" ON public.certificates;

-- Clean up orphaned recipient_ids that don't exist in user_profiles
DELETE FROM public.certificates 
WHERE recipient_id::uuid NOT IN (SELECT id FROM public.user_profiles);

-- Alter recipient_id to UUID type for proper FK
ALTER TABLE public.certificates
ALTER COLUMN recipient_id TYPE uuid USING recipient_id::uuid;

-- Add the foreign key constraint
ALTER TABLE public.certificates
ADD CONSTRAINT certificates_recipient_id_fkey
FOREIGN KEY (recipient_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Ensure RLS is enabled on certificates table
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own certificates
CREATE POLICY "Users can view their own certificates"
ON public.certificates
FOR SELECT
USING (recipient_id = auth.uid());

-- RLS Policy: Workspace team members can view all workspace certificates
CREATE POLICY "Workspace team can view workspace certificates"
ON public.certificates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = certificates.workspace_id
    AND wtm.user_id = auth.uid()
  )
);

-- RLS Policy: Use existing has_certificate_permission function for insert
-- Function signature: has_certificate_permission(_workspace_id uuid, _permission text, _user_id uuid)
CREATE POLICY "Certificate generators can create certificates"
ON public.certificates
FOR INSERT
WITH CHECK (
  public.has_certificate_permission(workspace_id, 'generate', auth.uid())
);

-- RLS Policy: Use existing has_certificate_permission function for update (distribute)
CREATE POLICY "Certificate distributors can update certificates"
ON public.certificates
FOR UPDATE
USING (
  public.has_certificate_permission(workspace_id, 'distribute', auth.uid())
);

-- RLS Policy: Only workspace owners/admins can delete certificates
CREATE POLICY "Workspace admins can delete certificates"
ON public.certificates
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = certificates.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.role IN ('owner', 'admin')
  )
);