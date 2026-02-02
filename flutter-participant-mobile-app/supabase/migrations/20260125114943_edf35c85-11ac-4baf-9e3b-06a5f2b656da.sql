-- =============================================
-- PHASE 1B: RLS POLICY HARDENING (Schema-Corrected)
-- Industrial Security Best Practices
-- =============================================

-- 1. Create helper function to check if user is event organizer
CREATE OR REPLACE FUNCTION public.is_event_organizer(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
PARALLEL SAFE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events e
    LEFT JOIN organizations o ON e.organization_id = o.id
    WHERE e.id = _event_id
    AND (e.owner_id = _user_id OR o.owner_id = _user_id)
  );
$$;

-- 2. Create secure view for public event data (hides sensitive organizer info)
CREATE OR REPLACE VIEW public.events_public AS
SELECT 
  e.id,
  e.organization_id,
  e.name,
  e.slug,
  e.description,
  e.mode,
  e.category,
  e.start_date,
  e.end_date,
  e.capacity,
  e.status,
  e.visibility,
  e.branding,
  e.canvas_state,
  e.landing_page_slug,
  e.landing_page_data,
  e.created_at,
  e.updated_at,
  -- Include organization public info only (excludes email, phone, gov_registration_id, owner_id)
  jsonb_build_object(
    'id', o.id,
    'name', o.name,
    'slug', o.slug,
    'description', o.description,
    'logo_url', o.logo_url,
    'banner_url', o.banner_url,
    'website', o.website,
    'category', o.category,
    'city', o.city,
    'state', o.state,
    'country', o.country,
    'primary_color', o.primary_color,
    'secondary_color', o.secondary_color
  ) AS organization
FROM events e
LEFT JOIN organizations o ON e.organization_id = o.id
WHERE e.status IN ('PUBLISHED', 'ONGOING', 'COMPLETED')
AND e.visibility = 'PUBLIC';

-- Grant access to the view
GRANT SELECT ON public.events_public TO anon, authenticated;

-- 3. Create helper function to mask anonymous post authors
CREATE OR REPLACE FUNCTION public.get_spark_post_author_id(_post_id uuid, _requester_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN sp.is_anonymous AND sp.author_id != _requester_id 
           AND NOT public.has_role(_requester_id, 'admin')
      THEN NULL
      ELSE sp.author_id
    END
  FROM spark_posts sp
  WHERE sp.id = _post_id;
$$;

-- 4. Create secure view for spark posts with author masking
-- Uses actual spark_posts columns: event_id, author_name, author_avatar, type, title, content, etc.
CREATE OR REPLACE VIEW public.spark_posts_public AS
SELECT 
  sp.id,
  sp.event_id,
  sp.type,
  sp.title,
  sp.content,
  sp.tags,
  sp.spark_count,
  sp.comment_count,
  sp.share_count,
  sp.is_anonymous,
  sp.status,
  sp.created_at,
  sp.expires_at,
  sp.image_url,
  sp.gif_url,
  sp.poll_id,
  sp.link_url,
  -- Mask author info for anonymous posts
  CASE WHEN sp.is_anonymous THEN NULL ELSE sp.author_id END AS author_id,
  CASE WHEN sp.is_anonymous THEN 'Anonymous' ELSE sp.author_name END AS author_name,
  CASE WHEN sp.is_anonymous THEN NULL ELSE sp.author_avatar END AS author_avatar
FROM spark_posts sp
WHERE sp.status != 'DELETED';

-- Grant access to the view
GRANT SELECT ON public.spark_posts_public TO anon, authenticated;

-- 5. Add RLS policy for spark_posts to allow authors to see their own anonymous posts
DROP POLICY IF EXISTS "spark_posts_author_sees_own_anonymous" ON spark_posts;
CREATE POLICY "spark_posts_author_sees_own_anonymous" ON spark_posts
FOR SELECT
TO authenticated
USING (
  author_id = auth.uid()
  OR is_anonymous IS NOT TRUE
  OR public.has_role(auth.uid(), 'admin')
);

-- 6. Create index for the is_anonymous column for performance
CREATE INDEX IF NOT EXISTS idx_spark_posts_is_anonymous 
ON spark_posts(is_anonymous) 
WHERE is_anonymous = true;

-- 7. Add documentation comments
COMMENT ON VIEW public.events_public IS 
'Secure public view of events. Excludes sensitive organizer contact info (email, phone, gov_registration_id).';

COMMENT ON VIEW public.spark_posts_public IS 
'Secure public view of spark posts. Masks author identity for anonymous posts.';

COMMENT ON FUNCTION public.is_event_organizer IS 
'Security helper: checks if user is owner of event or its organization.';

COMMENT ON FUNCTION public.get_spark_post_author_id IS 
'Security helper: returns author_id only if post is non-anonymous or requester is author/admin.';