-- Allow authenticated users to insert their own registrations
CREATE POLICY "Users create own registrations" 
ON public.registrations
FOR INSERT
WITH CHECK (user_id = auth.uid());