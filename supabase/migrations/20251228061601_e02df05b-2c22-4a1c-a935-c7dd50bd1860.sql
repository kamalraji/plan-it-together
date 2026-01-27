-- Fix organization_memberships join permission issues
-- 1) Ensure user_id is always set to the authenticated user via trigger
CREATE OR REPLACE FUNCTION public.set_organization_membership_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Force membership to belong to the current authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to create organization membership';
  END IF;

  NEW.user_id := auth.uid();

  -- Default status to PENDING if not provided
  IF NEW.status IS NULL THEN
    NEW.status := 'PENDING'::organization_membership_status;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists to avoid duplicates
DROP TRIGGER IF EXISTS set_organization_membership_user_trigger ON public.organization_memberships;

-- Create trigger to run before insert
CREATE TRIGGER set_organization_membership_user_trigger
BEFORE INSERT ON public.organization_memberships
FOR EACH ROW
EXECUTE FUNCTION public.set_organization_membership_user();

-- 2) Simplify and harden RLS policies for organization_memberships
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so we can recreate them cleanly
DROP POLICY IF EXISTS "Users request org membership" ON public.organization_memberships;
DROP POLICY IF EXISTS "Users view their memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Org admins view org memberships" ON public.organization_memberships;
DROP POLICY IF EXISTS "Org admins manage memberships" ON public.organization_memberships;

-- Allow any authenticated user to request membership; the trigger enforces correct user_id
CREATE POLICY "Users request org membership"
ON public.organization_memberships
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can see their own memberships
CREATE POLICY "Users view their memberships"
ON public.organization_memberships
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Org owners/admins can view all memberships for their org
CREATE POLICY "Org admins view org memberships"
ON public.organization_memberships
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_memberships m2
    WHERE m2.organization_id = organization_memberships.organization_id
      AND m2.user_id = auth.uid()
      AND m2.status = 'ACTIVE'::organization_membership_status
      AND m2.role IN ('OWNER'::organization_membership_role, 'ADMIN'::organization_membership_role)
  )
);

-- Org owners/admins can update memberships in their org
CREATE POLICY "Org admins manage memberships"
ON public.organization_memberships
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_memberships m2
    WHERE m2.organization_id = organization_memberships.organization_id
      AND m2.user_id = auth.uid()
      AND m2.status = 'ACTIVE'::organization_membership_status
      AND m2.role IN ('OWNER'::organization_membership_role, 'ADMIN'::organization_membership_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_memberships m2
    WHERE m2.organization_id = organization_memberships.organization_id
      AND m2.user_id = auth.uid()
      AND m2.status = 'ACTIVE'::organization_membership_status
      AND m2.role IN ('OWNER'::organization_membership_role, 'ADMIN'::organization_membership_role)
  )
);