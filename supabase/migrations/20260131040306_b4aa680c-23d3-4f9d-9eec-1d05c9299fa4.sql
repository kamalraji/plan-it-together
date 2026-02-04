-- ============================================================
-- Fix: Scope registrations RLS to event ownership
-- 
-- Problem: "Organizers view registrations" policy allows ANY organizer
-- to see ALL registrations across the platform.
-- 
-- Fix: Organizers can only view registrations for events they own
-- or events belonging to their organizations.
-- ============================================================

-- Drop the overly permissive organizer policy
DROP POLICY IF EXISTS "Organizers view registrations" ON public.registrations;

-- Create properly scoped policy for viewing registrations
CREATE POLICY "Users and organizers view registrations"
ON public.registrations
FOR SELECT
TO authenticated
USING (
  -- User's own registrations (participants can see their own)
  user_id = auth.uid()
  -- OR admin access (full platform visibility)
  OR public.has_role(auth.uid(), 'admin'::app_role)
  -- OR organizer for this specific event (via ownership or org membership)
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = registrations.event_id
    AND (
      -- Event owner
      e.owner_id = auth.uid()
      -- OR member of the event's organization
      OR EXISTS (
        SELECT 1 FROM public.organization_memberships om
        WHERE om.organization_id = e.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'ACTIVE'
      )
    )
  )
);