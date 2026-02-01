-- Phase 1.1: Secure Event Contact Information
-- Create security definer function to safely expose public event data without PII
CREATE OR REPLACE FUNCTION public.get_public_event_details(event_id_param UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  visibility TEXT,
  status TEXT,
  organization_id UUID,
  event_website TEXT,
  category TEXT,
  timezone TEXT,
  capacity INT,
  is_free BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT 
    e.id, e.name, e.description, e.start_date, e.end_date,
    e.visibility::TEXT, e.status::TEXT,
    e.organization_id, e.event_website, e.category,
    e.timezone, e.capacity, e.is_free
  FROM events e
  WHERE e.id = event_id_param 
    AND e.visibility = 'PUBLIC' 
    AND e.status = 'PUBLISHED';
$$;

-- Phase 1.2: Fix Anonymous Social Post Deanonymization
-- Create secure view that respects anonymity settings (using actual columns)
CREATE OR REPLACE VIEW public.spark_posts_safe AS
SELECT 
  id,
  event_id,
  type,
  title,
  content,
  tags,
  spark_count,
  comment_count,
  is_anonymous,
  status,
  created_at,
  image_url,
  CASE WHEN is_anonymous = true THEN NULL ELSE author_id END as author_id,
  CASE WHEN is_anonymous = true THEN 'Anonymous' ELSE author_name END as author_name,
  CASE WHEN is_anonymous = true THEN NULL ELSE author_avatar END as author_avatar
FROM spark_posts;

-- Grant access to the safe view
GRANT SELECT ON public.spark_posts_safe TO authenticated;

-- Phase 1.3: Add comment explaining the security measures
COMMENT ON FUNCTION public.get_public_event_details IS 'Security definer function to expose public event data without revealing contact_email or contact_phone PII';
COMMENT ON VIEW public.spark_posts_safe IS 'Secure view that masks author identity when is_anonymous is true to prevent deanonymization';