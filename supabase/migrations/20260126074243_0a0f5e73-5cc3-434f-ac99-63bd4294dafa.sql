-- Create enum for workspace access levels
CREATE TYPE public.workspace_access_level AS ENUM ('OWNER', 'MANAGER', 'LEAD', 'COORDINATOR');

-- Function to get access level from a workspace role
CREATE OR REPLACE FUNCTION public.get_workspace_access_level(role_name text)
RETURNS public.workspace_access_level
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE
    -- Level 1: Owner
    WHEN role_name = 'WORKSPACE_OWNER' THEN 'OWNER'::public.workspace_access_level
    
    -- Level 2: Managers
    WHEN role_name IN (
      'OPERATIONS_MANAGER',
      'GROWTH_MANAGER', 
      'CONTENT_MANAGER',
      'TECH_FINANCE_MANAGER',
      'VOLUNTEERS_MANAGER'
    ) THEN 'MANAGER'::public.workspace_access_level
    
    -- Level 3: Leads
    WHEN role_name IN (
      'EVENT_LEAD',
      'REGISTRATION_LEAD',
      'CATERING_LEAD',
      'LOGISTICS_LEAD',
      'FACILITY_LEAD',
      'TECHNICAL_LEAD',
      'IT_LEAD',
      'VOLUNTEERS_LEAD',
      'SOCIAL_MEDIA_LEAD',
      'MARKETING_LEAD',
      'CONTENT_LEAD',
      'MEDIA_LEAD',
      'SPONSORSHIP_LEAD',
      'PARTNERSHIPS_LEAD',
      'FINANCE_LEAD',
      'BUDGET_LEAD'
    ) THEN 'LEAD'::public.workspace_access_level
    
    -- Level 4: Coordinators (default for all other valid roles)
    ELSE 'COORDINATOR'::public.workspace_access_level
  END
$$;

-- Security definer function to check if user has minimum access level in workspace
CREATE OR REPLACE FUNCTION public.has_workspace_access_level(
  _workspace_id uuid,
  _min_level public.workspace_access_level
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = _workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND (
        CASE _min_level
          -- Owner level: only WORKSPACE_OWNER
          WHEN 'OWNER' THEN 
            wtm.role = 'WORKSPACE_OWNER'
          
          -- Manager level: Owner + all Managers
          WHEN 'MANAGER' THEN 
            wtm.role IN (
              'WORKSPACE_OWNER',
              'OPERATIONS_MANAGER', 'GROWTH_MANAGER', 'CONTENT_MANAGER',
              'TECH_FINANCE_MANAGER', 'VOLUNTEERS_MANAGER'
            )
          
          -- Lead level: Owner + Managers + all Leads
          WHEN 'LEAD' THEN 
            wtm.role IN (
              'WORKSPACE_OWNER',
              'OPERATIONS_MANAGER', 'GROWTH_MANAGER', 'CONTENT_MANAGER',
              'TECH_FINANCE_MANAGER', 'VOLUNTEERS_MANAGER',
              'EVENT_LEAD', 'REGISTRATION_LEAD', 'CATERING_LEAD', 'LOGISTICS_LEAD',
              'FACILITY_LEAD', 'TECHNICAL_LEAD', 'IT_LEAD', 'VOLUNTEERS_LEAD',
              'SOCIAL_MEDIA_LEAD', 'MARKETING_LEAD', 'CONTENT_LEAD', 'MEDIA_LEAD',
              'SPONSORSHIP_LEAD', 'PARTNERSHIPS_LEAD', 'FINANCE_LEAD', 'BUDGET_LEAD'
            )
          
          -- Coordinator level: any active team member
          WHEN 'COORDINATOR' THEN 
            TRUE
        END
      )
  )
$$;

-- Convenience function to check workspace access with user_id parameter (for admin operations)
CREATE OR REPLACE FUNCTION public.user_has_workspace_access_level(
  _user_id uuid,
  _workspace_id uuid,
  _min_level public.workspace_access_level
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = _workspace_id
      AND wtm.user_id = _user_id
      AND wtm.status = 'ACTIVE'
      AND (
        CASE _min_level
          WHEN 'OWNER' THEN 
            wtm.role = 'WORKSPACE_OWNER'
          WHEN 'MANAGER' THEN 
            wtm.role IN (
              'WORKSPACE_OWNER',
              'OPERATIONS_MANAGER', 'GROWTH_MANAGER', 'CONTENT_MANAGER',
              'TECH_FINANCE_MANAGER', 'VOLUNTEERS_MANAGER'
            )
          WHEN 'LEAD' THEN 
            wtm.role IN (
              'WORKSPACE_OWNER',
              'OPERATIONS_MANAGER', 'GROWTH_MANAGER', 'CONTENT_MANAGER',
              'TECH_FINANCE_MANAGER', 'VOLUNTEERS_MANAGER',
              'EVENT_LEAD', 'REGISTRATION_LEAD', 'CATERING_LEAD', 'LOGISTICS_LEAD',
              'FACILITY_LEAD', 'TECHNICAL_LEAD', 'IT_LEAD', 'VOLUNTEERS_LEAD',
              'SOCIAL_MEDIA_LEAD', 'MARKETING_LEAD', 'CONTENT_LEAD', 'MEDIA_LEAD',
              'SPONSORSHIP_LEAD', 'PARTNERSHIPS_LEAD', 'FINANCE_LEAD', 'BUDGET_LEAD'
            )
          WHEN 'COORDINATOR' THEN 
            TRUE
        END
      )
  )
$$;

-- Create a view for workspace members with their access levels
CREATE OR REPLACE VIEW public.workspace_members_with_levels AS
SELECT 
  wtm.id,
  wtm.workspace_id,
  wtm.user_id,
  wtm.role,
  wtm.status,
  wtm.joined_at,
  public.get_workspace_access_level(wtm.role) AS access_level,
  up.full_name,
  up.avatar_url
FROM public.workspace_team_members wtm
LEFT JOIN public.user_profiles up ON up.id = wtm.user_id;

-- Grant access to authenticated users
GRANT SELECT ON public.workspace_members_with_levels TO authenticated;

-- Add helpful comments
COMMENT ON TYPE public.workspace_access_level IS 'Hierarchical access levels for workspace roles: OWNER > MANAGER > LEAD > COORDINATOR';
COMMENT ON FUNCTION public.get_workspace_access_level IS 'Maps a workspace role name to its corresponding access level';
COMMENT ON FUNCTION public.has_workspace_access_level IS 'Checks if current user has minimum access level in workspace (uses auth.uid())';
COMMENT ON FUNCTION public.user_has_workspace_access_level IS 'Checks if specified user has minimum access level in workspace';
COMMENT ON VIEW public.workspace_members_with_levels IS 'Workspace team members with computed access levels for simplified queries';