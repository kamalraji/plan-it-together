-- Fix RLS policies on public.events to allow intended access

-- 1) Drop existing policies on events
DROP POLICY IF EXISTS "Admins manage all events" ON public.events;
DROP POLICY IF EXISTS "Org members manage org events" ON public.events;
DROP POLICY IF EXISTS "Organizers create personal events" ON public.events;
DROP POLICY IF EXISTS "Public can view events" ON public.events;

-- 2) Recreate policies as PERMISSIVE (default) with clear roles

-- Admins can do anything on events
CREATE POLICY "Admins manage all events"
ON public.events
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Organization members with elevated roles can manage events for their org
CREATE POLICY "Org members manage org events"
ON public.events
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_memberships m
    WHERE m.organization_id = events.organization_id
      AND m.user_id = auth.uid()
      AND m.status = 'ACTIVE'::organization_membership_status
      AND m.role = ANY (ARRAY['OWNER'::organization_membership_role, 'ADMIN'::organization_membership_role, 'ORGANIZER'::organization_membership_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_memberships m
    WHERE m.organization_id = events.organization_id
      AND m.user_id = auth.uid()
      AND m.status = 'ACTIVE'::organization_membership_status
      AND m.role = ANY (ARRAY['OWNER'::organization_membership_role, 'ADMIN'::organization_membership_role, 'ORGANIZER'::organization_membership_role])
  )
);

-- Organizers can create personal events without an organization_id
CREATE POLICY "Organizers create personal events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'organizer'::app_role)
  AND organization_id IS NULL
);

-- Anyone (including anonymous) can view events
CREATE POLICY "Public can view events"
ON public.events
FOR SELECT
TO public
USING (true);