-- Ensure organizer role syncing is idempotent and does not raise duplicate key errors

-- 1. Recreate sync_organizer_role_from_membership with ON CONFLICT DO NOTHING
CREATE OR REPLACE FUNCTION public.sync_organizer_role_from_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When membership becomes ACTIVE with elevated role, ensure organizer app_role exists
  IF NEW.status = 'ACTIVE'::organization_membership_status
     AND NEW.role IN (
       'OWNER'::organization_membership_role,
       'ADMIN'::organization_membership_role,
       'ORGANIZER'::organization_membership_role
     )
  THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'organizer'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING; -- idempotent insert to avoid 23505
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Ensure a single trigger exists on organization_memberships using this function
DROP TRIGGER IF EXISTS sync_organizer_role_from_membership_tr
ON public.organization_memberships;

CREATE TRIGGER sync_organizer_role_from_membership_tr
AFTER INSERT OR UPDATE ON public.organization_memberships
FOR EACH ROW
EXECUTE FUNCTION public.sync_organizer_role_from_membership();
