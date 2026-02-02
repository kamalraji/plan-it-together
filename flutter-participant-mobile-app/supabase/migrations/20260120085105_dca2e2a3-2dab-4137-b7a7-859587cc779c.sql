-- Fix overly permissive RLS policy for security_activity_logs
-- The INSERT policy was using WITH CHECK (true) which is too permissive

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service can insert security logs" ON public.security_activity_logs;

-- Create a more restrictive policy that still allows the edge function (service role) to insert
-- Since edge functions use service role key, they bypass RLS anyway
-- For authenticated users, they can only insert logs for themselves
CREATE POLICY "Users can insert their own security logs" 
  ON public.security_activity_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Note: Edge functions with service role key bypass RLS, so they can still insert for any user
-- This policy prevents authenticated users from inserting logs for other users