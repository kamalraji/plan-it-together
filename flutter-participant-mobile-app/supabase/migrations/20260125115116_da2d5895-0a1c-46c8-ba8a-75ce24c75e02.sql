-- =============================================
-- PHASE 2: DATABASE QUERY OPTIMIZATION (Final)
-- Industrial Performance Best Practices
-- =============================================

-- 1. Optimize has_role() function with PARALLEL SAFE
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean 
LANGUAGE sql 
STABLE 
PARALLEL SAFE
SECURITY DEFINER 
SET search_path = public 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 2. Add composite indexes for high-traffic query patterns

-- Events: most common public query pattern
CREATE INDEX IF NOT EXISTS idx_events_status_visibility_start 
ON events(status, visibility, start_date DESC);

-- Events: partial index for published events only
CREATE INDEX IF NOT EXISTS idx_events_published 
ON events(start_date DESC) 
WHERE status = 'PUBLISHED' AND visibility = 'PUBLIC';

-- Notifications: unread by user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, created_at DESC)
WHERE read = false;

-- Registrations: event + confirmed status
CREATE INDEX IF NOT EXISTS idx_registrations_event_confirmed 
ON registrations(event_id, status)
WHERE status = 'CONFIRMED';

-- User roles: optimize RLS policy checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON user_roles(user_id, role);

-- Workspace team members: optimize membership checks
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_workspace 
ON workspace_team_members(user_id, workspace_id);

-- Covering index for frequent event list queries
CREATE INDEX IF NOT EXISTS idx_events_org_status 
ON events(organization_id, status, start_date DESC);

-- Optimize spark_posts queries
CREATE INDEX IF NOT EXISTS idx_spark_posts_event_created 
ON spark_posts(event_id, created_at DESC)
WHERE status != 'DELETED';

-- Index for follower lookups (correct column: following_id)
CREATE INDEX IF NOT EXISTS idx_followers_following_status 
ON followers(following_id, status)
WHERE status = 'ACCEPTED';

-- Documentation
COMMENT ON INDEX idx_events_status_visibility_start IS 
'Composite index for public event listing queries.';

COMMENT ON INDEX idx_user_roles_user_role IS 
'Composite index for has_role() function. Reduces RLS policy check overhead.';