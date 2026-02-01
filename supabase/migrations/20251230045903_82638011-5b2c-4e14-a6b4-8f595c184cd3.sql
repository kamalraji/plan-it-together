-- Update RLS so both OWNER and ADMIN org members can update organizations

-- Drop the old owner-only update policy
DROP POLICY IF EXISTS "Owners can update their organizations" ON public.organizations;

-- Create a new policy that leverages is_org_admin_for_org, which already
-- treats OWNER and ADMIN members (with ACTIVE status) as admins.
CREATE POLICY "Org admins can update organizations"
ON public.organizations
FOR UPDATE
USING (is_org_admin_for_org(id, auth.uid()))
WITH CHECK (is_org_admin_for_org(id, auth.uid()));