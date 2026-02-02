-- =============================================
-- PHASE 2: PERFORMANCE OPTIMIZATION - ADDITIVE INDEXES
-- Fixes sequential scans on user_roles and workspace_team_members
-- Safe for multi-app architecture - additive only
-- =============================================

-- 2.1 Create efficient role lookup index for user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
  ON public.user_roles(user_id, role);

-- 2.2 Add composite index for workspace access checks
CREATE INDEX IF NOT EXISTS idx_workspace_team_workspace_user 
  ON public.workspace_team_members(workspace_id, user_id);

-- 2.3 Optimize has_role function with STABLE hint for query planner
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

-- 2.4 Optimize has_workspace_access function
CREATE OR REPLACE FUNCTION public.has_workspace_access(p_workspace_id UUID) 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_team_members 
    WHERE workspace_id = p_workspace_id 
      AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;