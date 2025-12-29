-- Make admin policy on events permissive so admins bypass org membership
DROP POLICY IF EXISTS "Admins manage all events" ON public.events;

CREATE POLICY "Admins manage all events"
ON public.events
AS PERMISSIVE
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));