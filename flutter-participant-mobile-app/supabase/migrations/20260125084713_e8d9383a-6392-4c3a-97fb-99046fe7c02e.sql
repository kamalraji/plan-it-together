-- =============================================
-- INDUSTRIAL BEST PRACTICES MIGRATION
-- Security Fixes + Performance Optimization + Admin Workflow
-- =============================================

-- =============================================
-- PHASE 1: SECURITY FIXES
-- =============================================

-- 1.1 Fix messages table RLS - ensure proper participant access
-- First, ensure RLS is enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop potentially permissive policies
DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages via membership" ON public.messages;

-- Create stricter SELECT policy for messages
CREATE POLICY "messages_select_participants" ON public.messages
  FOR SELECT TO authenticated
  USING (
    -- Sender can always see their own messages
    sender_id = auth.uid()
    -- OR participant in DM channel (channel_id contains user ID)
    OR channel_id LIKE '%' || auth.uid()::text || '%'
    -- OR member of group
    OR (group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.chat_group_members cgm
      WHERE cgm.group_id = messages.group_id 
        AND cgm.user_id = auth.uid()
    ))
    -- OR member of workspace channel
    OR EXISTS (
      SELECT 1 FROM public.channel_members cm
      WHERE cm.channel_id::text = messages.channel_id 
        AND cm.user_id = auth.uid()
    )
  );

-- 1.3 Restrict reserved_usernames table
DROP POLICY IF EXISTS "Anyone can view reserved usernames" ON public.reserved_usernames;
DROP POLICY IF EXISTS "reserved_usernames_select_authenticated" ON public.reserved_usernames;

CREATE POLICY "reserved_usernames_select_authenticated" ON public.reserved_usernames
  FOR SELECT TO authenticated
  USING (true);

-- =============================================
-- PHASE 2: PERFORMANCE OPTIMIZATION INDEXES
-- =============================================

-- Events: status + visibility + date filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_events_status_visibility_start 
  ON public.events(status, visibility, start_date DESC);

-- Notifications: user + read status (for unread counts - hot path)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
  ON public.notifications(user_id, read, created_at DESC);

-- Followers: bidirectional lookups with status filter
CREATE INDEX IF NOT EXISTS idx_followers_following_status 
  ON public.followers(following_id, status);
CREATE INDEX IF NOT EXISTS idx_followers_follower_status 
  ON public.followers(follower_id, status);

-- Channel messages: channel + timestamp for pagination
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel_created 
  ON public.channel_messages(channel_id, created_at DESC);

-- Spark posts: feed ordering optimization
CREATE INDEX IF NOT EXISTS idx_spark_posts_created_author 
  ON public.spark_posts(created_at DESC, author_id);

-- Registrations: event + status for attendance queries
CREATE INDEX IF NOT EXISTS idx_registrations_event_status 
  ON public.registrations(event_id, status);

-- Impact profiles: online status for "who's online" features
CREATE INDEX IF NOT EXISTS idx_impact_profiles_online 
  ON public.impact_profiles(is_online) WHERE is_online = true;

-- Messages: channel + sender for RLS performance
CREATE INDEX IF NOT EXISTS idx_messages_channel_sender 
  ON public.messages(channel_id, sender_id);

-- =============================================
-- PHASE 4: ADMIN WORKFLOW FUNCTIONS
-- =============================================

-- 4.1 Approve organizer application (atomic: update status + grant role)
CREATE OR REPLACE FUNCTION public.approve_organizer_application(
  p_application_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve applications';
  END IF;
  
  -- Get user_id and validate status
  SELECT user_id INTO v_user_id
  FROM public.organizer_applications
  WHERE id = p_application_id 
    AND status IN ('submitted', 'under_review');
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Application not found or not in reviewable status';
  END IF;
  
  -- Update application status
  UPDATE public.organizer_applications
  SET 
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    admin_notes = COALESCE(p_admin_notes, admin_notes)
  WHERE id = p_application_id;
  
  -- Grant organizer role (upsert to handle existing records)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'organizer')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'organizer', updated_at = now();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4.2 Reject organizer application
CREATE OR REPLACE FUNCTION public.reject_organizer_application(
  p_application_id UUID,
  p_rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject applications';
  END IF;
  
  -- Update application status
  UPDATE public.organizer_applications
  SET 
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    rejection_reason = p_rejection_reason
  WHERE id = p_application_id 
    AND status IN ('submitted', 'under_review');
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or not in reviewable status';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4.3 Request more information
CREATE OR REPLACE FUNCTION public.request_more_info_application(
  p_application_id UUID,
  p_message TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can request more information';
  END IF;
  
  -- Update application status
  UPDATE public.organizer_applications
  SET 
    status = 'requires_more_info',
    admin_request_message = p_message
  WHERE id = p_application_id 
    AND status IN ('submitted', 'under_review');
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or not in reviewable status';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions to authenticated users (admin check is inside functions)
GRANT EXECUTE ON FUNCTION public.approve_organizer_application TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_organizer_application TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_more_info_application TO authenticated;