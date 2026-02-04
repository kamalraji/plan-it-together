-- Fix workspace_members_with_levels view to use security_invoker
DROP VIEW IF EXISTS public.workspace_members_with_levels;

CREATE VIEW public.workspace_members_with_levels 
WITH (security_invoker = true)
AS
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

COMMENT ON VIEW public.workspace_members_with_levels IS 'Workspace team members with computed access levels (security_invoker=true, respects RLS)';

-- Fix update_zone_notification_prefs_timestamp function search_path
CREATE OR REPLACE FUNCTION public.update_zone_notification_prefs_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;