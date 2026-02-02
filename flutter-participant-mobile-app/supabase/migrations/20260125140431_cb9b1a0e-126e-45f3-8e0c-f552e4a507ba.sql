-- Fix spark_posts RLS: Require authentication to view posts (prevents public scraping of author identities)
DROP POLICY IF EXISTS "Users can view all spark posts" ON public.spark_posts;

CREATE POLICY "Authenticated users can view spark posts"
ON public.spark_posts
FOR SELECT
TO authenticated
USING (true);

-- Add comment explaining the security rationale
COMMENT ON POLICY "Authenticated users can view spark posts" ON public.spark_posts IS 
'Restricts post visibility to authenticated users only. Prevents public scraping of author_id/user data. Updated 2026-01-25 for security hardening.';