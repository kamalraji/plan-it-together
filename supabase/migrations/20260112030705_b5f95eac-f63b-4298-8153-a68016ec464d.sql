-- Fix user_profiles_public_exposure: Create security definer functions that mask sensitive PII
-- and restrict what event owners/org members can see

-- 1. Create function for event owners to view registrant profiles (masks phone, limits fields)
CREATE OR REPLACE FUNCTION public.get_event_registrant_profile(_user_id uuid, _event_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  organization text,
  bio text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    up.id,
    up.full_name,
    up.avatar_url,
    up.organization,
    up.bio
  FROM public.user_profiles up
  WHERE up.id = _user_id
    -- Verify caller is event owner or workspace lead for this event
    AND (
      EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = _event_id AND e.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM events e
        JOIN workspaces w ON w.event_id = e.id
        JOIN workspace_team_members wtm ON wtm.workspace_id = w.id
        WHERE e.id = _event_id
          AND wtm.user_id = auth.uid()
          AND wtm.status = 'ACTIVE'
          AND wtm.role IN ('OWNER', 'ADMIN', 'MANAGER', 'LEAD')
      )
    )
    -- Verify user is actually registered for this event
    AND EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.user_id = _user_id AND r.event_id = _event_id
    );
$$;

-- 2. Create function for org members to view fellow member profiles (masks phone, limits fields)
CREATE OR REPLACE FUNCTION public.get_org_member_profile(_user_id uuid, _organization_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  organization text,
  bio text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    up.id,
    up.full_name,
    up.avatar_url,
    up.organization,
    up.bio
  FROM public.user_profiles up
  WHERE up.id = _user_id
    -- Verify caller is an active member of the same org
    AND EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = _organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'ACTIVE'
    )
    -- Verify target user is also an active member of this org
    AND EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = _organization_id
        AND om.user_id = _user_id
        AND om.status = 'ACTIVE'
    );
$$;

-- 3. Create function for batch loading event registrant profiles (for lists)
CREATE OR REPLACE FUNCTION public.get_event_registrants_profiles(_event_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  organization text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    up.id,
    up.full_name,
    up.avatar_url,
    up.organization
  FROM public.user_profiles up
  JOIN public.registrations r ON r.user_id = up.id
  WHERE r.event_id = _event_id
    -- Verify caller is event owner or workspace lead
    AND (
      EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = _event_id AND e.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM events e
        JOIN workspaces w ON w.event_id = e.id
        JOIN workspace_team_members wtm ON wtm.workspace_id = w.id
        WHERE e.id = _event_id
          AND wtm.user_id = auth.uid()
          AND wtm.status = 'ACTIVE'
          AND wtm.role IN ('OWNER', 'ADMIN', 'MANAGER', 'LEAD')
      )
    );
$$;

-- 4. Create function for org members list (masks phone, returns limited fields)
CREATE OR REPLACE FUNCTION public.get_org_members_profiles(_organization_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  organization text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    up.id,
    up.full_name,
    up.avatar_url,
    up.organization
  FROM public.user_profiles up
  JOIN public.organization_memberships om ON om.user_id = up.id
  WHERE om.organization_id = _organization_id
    AND om.status = 'ACTIVE'
    -- Verify caller is an active member of this org
    AND EXISTS (
      SELECT 1 FROM organization_memberships caller_om
      WHERE caller_om.organization_id = _organization_id
        AND caller_om.user_id = auth.uid()
        AND caller_om.status = 'ACTIVE'
    );
$$;

-- 5. Drop the overly permissive RLS policies that expose all fields
DROP POLICY IF EXISTS "Event owners view registrant profiles" ON user_profiles;
DROP POLICY IF EXISTS "Org members view fellow member profiles" ON user_profiles;
DROP POLICY IF EXISTS "Workspace leads view event registrant profiles" ON user_profiles;

-- Note: Keep these policies:
-- - "Users view own profile" (user viewing their own full profile)
-- - "Users manage own profile update" (user updating their own profile)
-- - "Admins view all profiles" (admins need full access for support)
-- The new security definer functions provide controlled access with masked PII