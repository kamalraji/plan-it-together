-- Phase 1: Create server-side permission RPC for Zone management
-- This replaces the broken client-side query that tried to access events.workspace_id

CREATE OR REPLACE FUNCTION public.can_manage_zone_content(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Check if user is event owner
  IF EXISTS (
    SELECT 1 FROM events 
    WHERE id = p_event_id AND owner_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check if user is an active member of ANY workspace linked to this event
  RETURN EXISTS (
    SELECT 1 
    FROM workspaces w
    JOIN workspace_team_members wtm ON wtm.workspace_id = w.id
    WHERE w.event_id = p_event_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.can_manage_zone_content(UUID) TO authenticated;

-- Phase 2: Create RPC to fetch team members for Zone management display
CREATE OR REPLACE FUNCTION public.get_zone_team_members(p_event_id UUID)
RETURNS TABLE (
  user_id UUID,
  role TEXT,
  workspace_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  joined_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Only allow if user has zone management access
  IF NOT public.can_manage_zone_content(p_event_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    wtm.user_id,
    wtm.role,
    w.name as workspace_name,
    ip.full_name,
    ip.avatar_url,
    wtm.joined_at
  FROM workspace_team_members wtm
  JOIN workspaces w ON w.id = wtm.workspace_id
  LEFT JOIN impact_profiles ip ON ip.user_id = wtm.user_id
  WHERE w.event_id = p_event_id
    AND wtm.status = 'ACTIVE'
  ORDER BY w.name, wtm.role;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_zone_team_members(UUID) TO authenticated;