-- Allow authenticated users to bootstrap exactly one 'participant' role for themselves
ALTER POLICY "Users can insert if they are an admin"
ON public.user_roles
WITH CHECK (
  -- Existing behavior: admins can insert any role
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- New bootstrap path: any authenticated user can insert exactly one 'participant' role for themselves
  (
    auth.uid() = user_id
    AND role = 'participant'::app_role
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'participant'::app_role
    )
  )
);
