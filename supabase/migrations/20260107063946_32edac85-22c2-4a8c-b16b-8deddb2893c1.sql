-- ============================================
-- Security Hardening Migration
-- Fix critical RLS policy issues
-- ============================================

-- Part 1: Create secure function for public organization data (hides email/phone)
CREATE OR REPLACE FUNCTION public.get_public_organization(_slug text)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  description text,
  logo_url text,
  banner_url text,
  primary_color text,
  secondary_color text,
  website text,
  category text,
  city text,
  state text,
  country text,
  verification_status text,
  seo_title text,
  seo_description text,
  seo_image_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    o.id, o.name, o.slug, o.description, o.logo_url, o.banner_url,
    o.primary_color, o.secondary_color, o.website, o.category,
    o.city, o.state, o.country, o.verification_status,
    o.seo_title, o.seo_description, o.seo_image_url
  FROM public.organizations o
  WHERE o.slug = _slug;
$$;

-- Part 2: Create secure function for public profile (minimal data)
CREATE OR REPLACE FUNCTION public.get_public_profile_basic(_user_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  organization text,
  bio text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT up.id, up.full_name, up.avatar_url, up.organization, up.bio
  FROM public.user_profiles up
  WHERE up.id = _user_id AND up.portfolio_is_public = TRUE;
$$;

-- Part 3: Restrict workspace_budgets to managers/leads only
-- First drop the existing policy if it exists
DROP POLICY IF EXISTS "Workspace members can view budget" ON workspace_budgets;
DROP POLICY IF EXISTS "Team members can view workspace budgets" ON workspace_budgets;

-- Create new restricted policy for viewing budgets
CREATE POLICY "Workspace managers can view budget" ON workspace_budgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_budgets.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD', 'COORDINATOR')
    )
    OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_budgets.workspace_id
      AND w.organizer_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
  );

-- Part 4: Restrict workspace_speakers access (contact info protection)
DROP POLICY IF EXISTS "Team members can manage speakers" ON workspace_speakers;
DROP POLICY IF EXISTS "Users can view speakers for their workspaces" ON workspace_speakers;
DROP POLICY IF EXISTS "Workspace members can view speakers" ON workspace_speakers;
DROP POLICY IF EXISTS "Workspace members can manage speakers" ON workspace_speakers;

-- Only leads and above can see full speaker contact info
CREATE POLICY "Workspace leads can view speakers" ON workspace_speakers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_speakers.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD')
    )
    OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_speakers.workspace_id
      AND w.organizer_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Workspace managers can manage speakers" ON workspace_speakers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_speakers.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER')
    )
    OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_speakers.workspace_id
      AND w.organizer_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
  );

-- Part 5: Restrict catering_vendors access (contact info protection)
DROP POLICY IF EXISTS "Team members can view catering vendors" ON catering_vendors;
DROP POLICY IF EXISTS "Team members can manage catering vendors" ON catering_vendors;
DROP POLICY IF EXISTS "Workspace members can view catering vendors" ON catering_vendors;
DROP POLICY IF EXISTS "Workspace members can manage catering vendors" ON catering_vendors;

CREATE POLICY "Workspace leads can view catering vendors" ON catering_vendors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = catering_vendors.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD')
    )
    OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = catering_vendors.workspace_id
      AND w.organizer_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Workspace managers can manage catering vendors" ON catering_vendors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = catering_vendors.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER')
    )
    OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = catering_vendors.workspace_id
      AND w.organizer_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin')
  );