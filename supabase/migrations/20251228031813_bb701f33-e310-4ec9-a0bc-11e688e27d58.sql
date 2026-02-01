-- Create unique index to support ON CONFLICT in handle_new_organization_membership
CREATE UNIQUE INDEX IF NOT EXISTS organization_memberships_org_user_active_unique
ON public.organization_memberships (organization_id, user_id, status)
WHERE status IN ('PENDING', 'ACTIVE');

-- Update trigger function to use ON CONFLICT that matches the index
CREATE OR REPLACE FUNCTION public.handle_new_organization_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure the creator (owner_id) is an ACTIVE OWNER member of the new organization
  INSERT INTO public.organization_memberships (organization_id, user_id, role, status)
  VALUES (NEW.id, NEW.owner_id, 'OWNER', 'ACTIVE')
  ON CONFLICT (organization_id, user_id, status)
    WHERE status IN ('PENDING', 'ACTIVE')
  DO UPDATE
    SET role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = now();

  RETURN NEW;
END;
$function$;