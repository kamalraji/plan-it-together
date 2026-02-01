-- Drop the overly permissive policy and replace with a more restrictive one
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;

-- Create a more specific insert policy that checks for valid email format
-- Note: This still allows public inserts but with email format validation at the application level
-- The RLS policy allows inserts but the unique constraint on email prevents duplicates
CREATE POLICY "Public can subscribe with valid email"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (
    email IS NOT NULL 
    AND length(email) > 5 
    AND email LIKE '%@%.%'
  );