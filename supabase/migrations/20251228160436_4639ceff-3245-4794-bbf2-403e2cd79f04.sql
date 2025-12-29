-- Allow organizers to create personal events without an organization_id
CREATE POLICY "Organizers create personal events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'organizer'::app_role)
  AND organization_id IS NULL
);