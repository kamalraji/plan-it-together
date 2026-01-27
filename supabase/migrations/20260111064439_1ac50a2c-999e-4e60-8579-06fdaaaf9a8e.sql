-- Create a security definer function to get catering vendors with field-level access control
-- Only workspace owners, managers, and leads can see contact information (email, phone, contact_name)
-- Regular members see non-sensitive vendor info only

CREATE OR REPLACE FUNCTION public.get_catering_vendors_secure(_workspace_id uuid)
RETURNS TABLE (
  id uuid,
  workspace_id uuid,
  name text,
  vendor_type text,
  contact_name text,
  phone text,
  email text,
  address text,
  rating numeric,
  status text,
  contract_value numeric,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _is_privileged boolean := false;
BEGIN
  -- Check if user is workspace owner, manager, lead, or admin
  SELECT TRUE INTO _is_privileged
  FROM (
    -- Check if workspace organizer
    SELECT 1 FROM workspaces w
    WHERE w.id = _workspace_id AND w.organizer_id = _user_id
    UNION ALL
    -- Check if privileged team member
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = _workspace_id
      AND wtm.user_id = _user_id
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD')
    UNION ALL
    -- Check if admin
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = 'admin'
  ) checks
  LIMIT 1;

  -- Return vendors with or without contact info based on privilege
  IF _is_privileged THEN
    -- Privileged users see all fields
    RETURN QUERY
    SELECT 
      cv.id,
      cv.workspace_id,
      cv.name,
      cv.vendor_type,
      cv.contact_name,
      cv.phone,
      cv.email,
      cv.address,
      cv.rating,
      cv.status,
      cv.contract_value,
      cv.notes,
      cv.created_at,
      cv.updated_at
    FROM catering_vendors cv
    WHERE cv.workspace_id = _workspace_id
    ORDER BY cv.status ASC;
  ELSE
    -- Regular members see masked contact info
    RETURN QUERY
    SELECT 
      cv.id,
      cv.workspace_id,
      cv.name,
      cv.vendor_type,
      NULL::text AS contact_name,  -- Hidden
      NULL::text AS phone,          -- Hidden  
      NULL::text AS email,          -- Hidden
      cv.address,
      cv.rating,
      cv.status,
      cv.contract_value,
      cv.notes,
      cv.created_at,
      cv.updated_at
    FROM catering_vendors cv
    WHERE cv.workspace_id = _workspace_id
      AND EXISTS (
        SELECT 1 FROM workspace_team_members wtm
        WHERE wtm.workspace_id = _workspace_id
          AND wtm.user_id = _user_id
          AND wtm.status = 'ACTIVE'
      )
    ORDER BY cv.status ASC;
  END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_catering_vendors_secure(uuid) TO authenticated;

-- Drop the overly permissive SELECT policy for regular members
DROP POLICY IF EXISTS "Workspace members can view vendors" ON catering_vendors;