-- Drop existing overly permissive policies on registration_attendees
DROP POLICY IF EXISTS "Event owners can view attendees" ON public.registration_attendees;
DROP POLICY IF EXISTS "Users can manage own registration attendees" ON public.registration_attendees;

-- Create properly scoped policies for registration_attendees

-- 1. Registration owners can manage their own attendees (CRUD)
CREATE POLICY "Registration owners manage attendees"
ON public.registration_attendees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.id = registration_attendees.registration_id
    AND r.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.id = registration_attendees.registration_id
    AND r.user_id = auth.uid()
  )
);

-- 2. Event owners can view attendees for their events (read-only)
CREATE POLICY "Event owners view attendees"
ON public.registration_attendees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM registrations r
    JOIN events e ON e.id = r.event_id
    WHERE r.id = registration_attendees.registration_id
    AND e.owner_id = auth.uid()
  )
);

-- 3. Workspace team members with elevated roles can view attendees for events in their workspace
CREATE POLICY "Workspace leads view attendees"
ON public.registration_attendees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM registrations r
    JOIN events e ON e.id = r.event_id
    JOIN workspaces w ON w.event_id = e.id
    JOIN workspace_team_members wtm ON wtm.workspace_id = w.id
    WHERE r.id = registration_attendees.registration_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
    AND wtm.role IN ('OWNER', 'ADMIN', 'MANAGER', 'LEAD')
  )
);

-- 4. Platform admins can view all attendees
CREATE POLICY "Admins view all attendees"
ON public.registration_attendees
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);