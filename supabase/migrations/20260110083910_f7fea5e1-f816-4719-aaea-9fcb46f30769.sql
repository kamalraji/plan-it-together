-- Drop the overly permissive policy that allows anyone to view ALL events
DROP POLICY IF EXISTS "Public can view events" ON public.events;

-- The existing "Events are viewable - basic access control" policy is correct:
-- - PUBLIC + PUBLISHED events: visible to everyone
-- - Owner's events: visible to owner (authenticated)
-- - Org events: visible to org members (authenticated)
-- However, it uses roles={public} which includes anon users checking auth.uid()

-- Let's create properly separated policies for anonymous and authenticated users

-- First, drop the existing combined policy
DROP POLICY IF EXISTS "Events are viewable - basic access control" ON public.events;

-- 1. Anonymous users can ONLY see PUBLIC + PUBLISHED events
CREATE POLICY "Anon view published public events"
ON public.events
FOR SELECT
TO anon
USING (
  visibility = 'PUBLIC'::event_visibility 
  AND status = 'PUBLISHED'::event_status
);

-- 2. Authenticated users can see:
--    - PUBLIC + PUBLISHED events (same as anon)
--    - Their own events (any status)
--    - Events from orgs they belong to
CREATE POLICY "Authenticated view events"
ON public.events
FOR SELECT
TO authenticated
USING (
  -- Public published events
  (visibility = 'PUBLIC'::event_visibility AND status = 'PUBLISHED'::event_status)
  -- OR owner's own events
  OR owner_id = auth.uid()
  -- OR org member events
  OR organization_id IN (
    SELECT om.organization_id
    FROM organization_memberships om
    WHERE om.user_id = auth.uid()
    AND om.status = 'ACTIVE'::organization_membership_status
  )
);

-- Create a security definer function for public event lookups by slug
-- This ensures anonymous users get only safe, published event data
CREATE OR REPLACE FUNCTION public.get_public_event_by_slug(_org_slug text, _event_slug text)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  mode event_mode,
  category event_category,
  capacity int,
  branding jsonb,
  landing_page_data jsonb,
  landing_page_slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.id, e.name, e.slug, e.description,
    e.start_date, e.end_date, e.mode, e.category, e.capacity,
    e.branding, e.landing_page_data, e.landing_page_slug
  FROM public.events e
  JOIN public.organizations o ON o.id = e.organization_id
  WHERE o.slug = _org_slug
    AND e.slug = _event_slug
    AND e.visibility = 'PUBLIC'::event_visibility
    AND e.status = 'PUBLISHED'::event_status;
$$;