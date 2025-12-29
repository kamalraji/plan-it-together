-- Ensure organizer role in user_roles when a user has an ACTIVE org membership with elevated role

-- 1) Backfill organizer role for existing memberships
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT m.user_id, 'organizer'::app_role
FROM public.organization_memberships m
WHERE m.status = 'ACTIVE'::organization_membership_status
  AND m.role IN ('OWNER'::organization_membership_role, 'ADMIN'::organization_membership_role, 'ORGANIZER'::organization_membership_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Trigger function to keep roles in sync going forward
CREATE OR REPLACE FUNCTION public.sync_organizer_role_from_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When membership becomes ACTIVE with elevated role, ensure organizer app_role exists
  IF NEW.status = 'ACTIVE'::organization_membership_status
     AND NEW.role IN ('OWNER'::organization_membership_role, 'ADMIN'::organization_membership_role, 'ORGANIZER'::organization_membership_role)
  THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'organizer'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Attach trigger to organization_memberships
DROP TRIGGER IF EXISTS trg_sync_organizer_role_from_membership ON public.organization_memberships;

CREATE TRIGGER trg_sync_organizer_role_from_membership
AFTER INSERT OR UPDATE ON public.organization_memberships
FOR EACH ROW
EXECUTE FUNCTION public.sync_organizer_role_from_membership();