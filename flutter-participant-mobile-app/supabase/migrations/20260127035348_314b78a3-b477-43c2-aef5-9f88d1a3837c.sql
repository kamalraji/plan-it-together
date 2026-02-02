-- Fix the overly permissive INSERT policy - restrict to service role operations
DROP POLICY IF EXISTS "Service role can insert impressions" ON public.ai_match_impressions;

-- Edge functions use service_role key which bypasses RLS, so this policy
-- allows users to insert their own impressions only (if called from client)
CREATE POLICY "Users can insert own impressions"
ON public.ai_match_impressions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);