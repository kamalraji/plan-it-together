-- Fix SECURITY DEFINER view warnings by using SECURITY INVOKER (default)
-- The views already use WHERE clauses to filter public data, no need for SECURITY DEFINER

-- Recreate events_public with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.events_public;
CREATE VIEW public.events_public 
WITH (security_invoker = true)
AS
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

GRANT SELECT ON public.events_public TO anon, authenticated;

-- Recreate spark_posts_public with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.spark_posts_public;
CREATE VIEW public.spark_posts_public 
WITH (security_invoker = true)
AS
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
  CASE WHEN sp.is_anonymous THEN NULL ELSE sp.author_id END AS author_id,
  CASE WHEN sp.is_anonymous THEN 'Anonymous' ELSE sp.author_name END AS author_name,
  CASE WHEN sp.is_anonymous THEN NULL ELSE sp.author_avatar END AS author_avatar
FROM spark_posts sp
WHERE sp.status != 'DELETED';

GRANT SELECT ON public.spark_posts_public TO anon, authenticated;

-- Re-add comments
COMMENT ON VIEW public.events_public IS 
'Secure public view of events. Excludes sensitive organizer contact info.';

COMMENT ON VIEW public.spark_posts_public IS 
'Secure public view of spark posts. Masks author identity for anonymous posts.';