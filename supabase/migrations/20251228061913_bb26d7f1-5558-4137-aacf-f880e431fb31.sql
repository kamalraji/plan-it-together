-- Fix infinite recursion in RLS policies for organization_memberships

-- 1) Helper function to check if current user is OWNER/ADMIN for an org
CREATE OR REPLACE FUNCTION public.is_org_admin_for_org(
  _organization_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships m
    WHERE m.organization_id = _organization_id
      AND m.user_id = _user_id
      AND m.status = 'ACTIVE'::organization_membership_status
      AND m.role IN ('OWNER'::organization_membership_role, 'ADMIN'::organization_membership_role)
  );
$$;

-- 2) Replace policies that previously referenced organization_memberships directly
DROP POLICY IF EXISTS "Org admins view org memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Org admins manage memberships" ON public.organization_memberships;

CREATE POLICY "Org admins view org memberships"
ON public.organization_memberships
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (public.is_org_admin_for_org(organization_id, auth.uid()));

CREATE POLICY "Org admins manage memberships"
ON public.organization_memberships
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (public.is_org_admin_for_org(organization_id, auth.uid()))
WITH CHECK (public.is_org_admin_for_org(organization_id, auth.uid()));