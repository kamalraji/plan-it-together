-- Phase 1: Security Hardening - Helper functions with correct enum values
-- =============================================================

-- 1. Create dedicated extensions schema (if not exists)
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Grant usage to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- 3. Drop existing functions first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS public.is_event_organizer(UUID, UUID);
DROP FUNCTION IF EXISTS public.can_view_registration(UUID, UUID);
DROP FUNCTION IF EXISTS public.owns_event_draft(UUID, UUID);

-- 4. Add defensive helper function for event organizer check
-- Uses organization_memberships table with correct enum values: OWNER, ADMIN, ORGANIZER, VIEWER
CREATE OR REPLACE FUNCTION public.is_event_organizer(
  _event_id UUID,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events e
    JOIN organization_memberships om ON e.organization_id = om.organization_id
    WHERE e.id = _event_id
    AND om.user_id = _user_id
    AND om.role IN ('OWNER', 'ADMIN', 'ORGANIZER')
  );
$$;

-- 5. Add helper function for registration access
CREATE OR REPLACE FUNCTION public.can_view_registration(
  _registration_id UUID,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User owns the registration
    SELECT 1 FROM registrations r
    WHERE r.id = _registration_id
    AND r.user_id = _user_id
  )
  OR EXISTS (
    -- User is an organizer of the event
    SELECT 1 FROM registrations r
    JOIN events e ON r.event_id = e.id
    JOIN organization_memberships om ON e.organization_id = om.organization_id
    WHERE r.id = _registration_id
    AND om.user_id = _user_id
    AND om.role IN ('OWNER', 'ADMIN', 'ORGANIZER')
  );
$$;

-- 6. Add helper function for draft access (user-scoped)
CREATE OR REPLACE FUNCTION public.owns_event_draft(
  _draft_id UUID,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_drafts
    WHERE id = _draft_id
    AND user_id = _user_id
  );
$$;

-- 7. Create indexes for improved performance (if not exist)
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_drafts_user_id ON event_drafts(user_id);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_event_organizer TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_event_draft TO authenticated;