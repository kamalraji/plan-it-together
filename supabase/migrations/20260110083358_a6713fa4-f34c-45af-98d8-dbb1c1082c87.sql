-- Drop overly permissive policies on user_profiles
DROP POLICY IF EXISTS "Staff read profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users manage own profile select" ON public.user_profiles;

-- Create properly scoped RLS policies for user_profiles

-- 1. Users can always view and manage their own profile
CREATE POLICY "Users view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 2. Public portfolios are viewable by anyone (when portfolio_is_public = true)
-- This allows the portfolio feature to work for public profiles
CREATE POLICY "Public portfolios viewable by all"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (portfolio_is_public = true);

-- 3. Event owners can view profiles of users registered for their events
CREATE POLICY "Event owners view registrant profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM registrations r
    JOIN events e ON e.id = r.event_id
    WHERE r.user_id = user_profiles.id
    AND e.owner_id = auth.uid()
  )
);

-- 4. Workspace team leads can view profiles of users in their event's registrations
CREATE POLICY "Workspace leads view event registrant profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM registrations r
    JOIN events e ON e.id = r.event_id
    JOIN workspaces w ON w.event_id = e.id
    JOIN workspace_team_members wtm ON wtm.workspace_id = w.id
    WHERE r.user_id = user_profiles.id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
    AND wtm.role IN ('OWNER', 'ADMIN', 'MANAGER', 'LEAD')
  )
);

-- 5. Organization members can view profiles of other members in their organization
CREATE POLICY "Org members view fellow member profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_memberships om1
    JOIN organization_memberships om2 ON om1.organization_id = om2.organization_id
    WHERE om2.user_id = user_profiles.id
    AND om1.user_id = auth.uid()
    AND om1.status = 'ACTIVE'
    AND om2.status = 'ACTIVE'
  )
);

-- 6. Platform admins can view all profiles
CREATE POLICY "Admins view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Note: Anonymous users should use get_public_profile_basic() or get_public_portfolio() 
-- security definer functions which already exist and return only safe fields