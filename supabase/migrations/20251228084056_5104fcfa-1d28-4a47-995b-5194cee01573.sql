-- Update organizations insert policy to require organizer role
DROP POLICY IF EXISTS "Users can insert their own organizations" ON public.organizations;

CREATE POLICY "Organizers can insert their own organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  AND has_role(auth.uid(), 'organizer')
);