-- Phase 1: Security Hardening - RLS Policies for Sensitive Data

-- 1.1 Create security definer function for registration check
CREATE OR REPLACE FUNCTION public.is_event_registered_attendee(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM registrations
    WHERE event_id = _event_id
    AND user_id = _user_id
    AND status = 'CONFIRMED'
  )
$$;

-- 1.2 RLS Policy: Protect virtual meeting links - only registered attendees or organization members
CREATE POLICY "registered_attendees_only_event_virtual_links"
ON public.event_virtual_links
FOR SELECT
USING (
  public.is_event_registered_attendee(event_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM events e
    JOIN organization_memberships om ON om.organization_id = e.organization_id
    WHERE e.id = event_virtual_links.event_id
    AND om.user_id = auth.uid()
  )
);

-- 1.3 RLS Policy: Anonymous posts author masking function
CREATE OR REPLACE FUNCTION public.mask_anonymous_author(post_author_id uuid, is_anonymous boolean)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN is_anonymous = false THEN post_author_id
    WHEN post_author_id = auth.uid() THEN post_author_id
    ELSE NULL
  END
$$;

-- 1.4 RLS Policy: competition_badges - public read
CREATE POLICY "public_read_competition_badges"
ON public.competition_badges
FOR SELECT
USING (true);

-- 1.5 RLS Policy: consent_categories - public read
CREATE POLICY "public_read_consent_categories"
ON public.consent_categories
FOR SELECT
USING (true);

-- 1.6 Ensure RLS is enabled on critical tables
ALTER TABLE public.event_virtual_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_categories ENABLE ROW LEVEL SECURITY;