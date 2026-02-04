-- Drop view first since it depends on the function
DROP VIEW IF EXISTS public.workspace_members_with_levels;

-- Recreate function with search_path set
CREATE OR REPLACE FUNCTION public.get_workspace_access_level(role_name text)
RETURNS public.workspace_access_level
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT CASE
    WHEN role_name = 'WORKSPACE_OWNER' THEN 'OWNER'::public.workspace_access_level
    WHEN role_name IN (
      'OPERATIONS_MANAGER', 'GROWTH_MANAGER', 'CONTENT_MANAGER',
      'TECH_FINANCE_MANAGER', 'VOLUNTEERS_MANAGER'
    ) THEN 'MANAGER'::public.workspace_access_level
    WHEN role_name IN (
      'EVENT_LEAD', 'REGISTRATION_LEAD', 'CATERING_LEAD', 'LOGISTICS_LEAD',
      'FACILITY_LEAD', 'TECHNICAL_LEAD', 'IT_LEAD', 'VOLUNTEERS_LEAD',
      'SOCIAL_MEDIA_LEAD', 'MARKETING_LEAD', 'CONTENT_LEAD', 'MEDIA_LEAD',
      'SPONSORSHIP_LEAD', 'PARTNERSHIPS_LEAD', 'FINANCE_LEAD', 'BUDGET_LEAD'
    ) THEN 'LEAD'::public.workspace_access_level
    ELSE 'COORDINATOR'::public.workspace_access_level
  END
$$;

-- Recreate view (regular view, not security definer - relies on underlying RLS)
CREATE VIEW public.workspace_members_with_levels AS
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

GRANT SELECT ON public.workspace_members_with_levels TO authenticated;

COMMENT ON FUNCTION public.get_workspace_access_level IS 'Maps a workspace role name to its corresponding access level';
COMMENT ON VIEW public.workspace_members_with_levels IS 'Workspace team members with computed access levels (respects RLS on underlying tables)';