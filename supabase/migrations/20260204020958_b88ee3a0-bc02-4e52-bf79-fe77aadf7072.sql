-- Fix SECURITY DEFINER view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.events_public_safe;

CREATE OR REPLACE VIEW public.events_public_safe 
WITH (security_invoker = true)
AS
SELECT 
  id, name, slug, description, mode,
  start_date, end_date, timezone, capacity,
  status, visibility, category,
  registration_deadline, registration_type, is_free, allow_waitlist,
  min_age, max_age, language, event_website,
  organization_id, created_at, updated_at,
  CASE WHEN (select auth.uid()) IS NOT NULL THEN contact_email ELSE NULL END as contact_email,
  CASE WHEN (select auth.uid()) IS NOT NULL THEN contact_phone ELSE NULL END as contact_phone
FROM public.events
WHERE visibility = 'PUBLIC' AND status IN ('PUBLISHED', 'ONGOING');