-- ============================================
-- SECURITY HARDENING MIGRATION
-- ============================================

-- 1. Fix SECURITY DEFINER function without explicit search_path
CREATE OR REPLACE FUNCTION public.auto_join_participant_channels()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_user_name TEXT;
BEGIN
  IF NEW.status = 'CONFIRMED' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'CONFIRMED') THEN
    SELECT full_name INTO v_user_name 
    FROM public.user_profiles 
    WHERE id = NEW.user_id;
    
    INSERT INTO public.channel_members (channel_id, user_id, user_name)
    SELECT wc.id, NEW.user_id, v_user_name
    FROM public.workspace_channels wc
    JOIN public.workspaces w ON wc.workspace_id = w.id
    WHERE w.event_id = NEW.event_id
      AND wc.auto_join_on_registration = true
      AND wc.is_participant_channel = true
    ON CONFLICT (channel_id, user_id) DO NOTHING;
    
    INSERT INTO public.participant_channels (registration_id, channel_id, user_id, event_id, permissions)
    SELECT NEW.id, wc.id, NEW.user_id, NEW.event_id, wc.participant_permissions
    FROM public.workspace_channels wc
    JOIN public.workspaces w ON wc.workspace_id = w.id
    WHERE w.event_id = NEW.event_id
      AND wc.auto_join_on_registration = true
      AND wc.is_participant_channel = true
    ON CONFLICT (registration_id, channel_id) DO NOTHING;
  END IF;
  
  IF NEW.status IN ('CANCELLED', 'WAITLISTED') AND OLD.status = 'CONFIRMED' THEN
    UPDATE public.participant_channels
    SET is_active = false, left_at = NOW(), updated_at = NOW()
    WHERE registration_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Fix overly permissive RLS policies (WITH CHECK (true))

DROP POLICY IF EXISTS "Only service role can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.admin_audit_logs FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.role_change_audit;
CREATE POLICY "Authenticated users can insert role audit logs"
  ON public.role_change_audit FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Service role can insert analytics" ON public.route_analytics_events;
CREATE POLICY "Authenticated users can insert analytics"
  ON public.route_analytics_events FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Service role can insert navigation patterns" ON public.route_navigation_patterns;
CREATE POLICY "Authenticated users can insert navigation patterns"
  ON public.route_navigation_patterns FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- 3. Create safe view for events - hide contact info from anonymous users
DROP VIEW IF EXISTS public.events_public_safe;
CREATE OR REPLACE VIEW public.events_public_safe AS
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

-- 4. Restrict channel_templates to authenticated users
DROP POLICY IF EXISTS "Channel templates are publicly readable" ON public.channel_templates;
CREATE POLICY "Authenticated users can view channel templates"
  ON public.channel_templates FOR SELECT TO authenticated
  USING (true);

-- 5. Restrict reserved_usernames to authenticated users
DROP POLICY IF EXISTS "Reserved usernames are publicly readable" ON public.reserved_usernames;
CREATE POLICY "Authenticated users can view reserved usernames"
  ON public.reserved_usernames FOR SELECT TO authenticated
  USING (true);