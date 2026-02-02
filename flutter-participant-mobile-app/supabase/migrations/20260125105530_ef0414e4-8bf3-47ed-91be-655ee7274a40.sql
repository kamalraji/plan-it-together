-- Phase 2.1: Create efficient role lookup index (additive - safe for multi-app)
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
  ON public.user_roles(user_id, role);

-- Phase 2.2: Add composite index for workspace access checks (additive - safe)
CREATE INDEX IF NOT EXISTS idx_workspace_team_workspace_user 
  ON public.workspace_team_members(workspace_id, user_id);

-- Optimize has_role function - keeping original parameter names
CREATE OR REPLACE FUNCTION public.has_role(
  _user_id UUID, 
  _role app_role
) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
      AND role = _role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Optimize has_workspace_access function
CREATE OR REPLACE FUNCTION public.has_workspace_access(p_workspace_id UUID) 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_team_members 
    WHERE workspace_id = p_workspace_id 
      AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Phase 3.1: Create RPC for server-side follower analytics (additive - safe)
CREATE OR REPLACE FUNCTION public.get_high_follow_count_users(
  min_following INTEGER DEFAULT 100,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE(user_id UUID, following_count BIGINT) AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    f.follower_id,
    COUNT(*) as cnt
  FROM public.followers f
  WHERE f.status = 'ACCEPTED'
  GROUP BY f.follower_id
  HAVING COUNT(*) > min_following
  ORDER BY cnt DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_high_follow_count_users TO authenticated;