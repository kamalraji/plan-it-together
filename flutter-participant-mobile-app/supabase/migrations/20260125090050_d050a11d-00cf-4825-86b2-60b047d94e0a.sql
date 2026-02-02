-- Phase 4: Admin Workflow Functions for Organizer Applications
-- Drop existing functions first to allow return type change
DROP FUNCTION IF EXISTS public.approve_organizer_application(UUID, TEXT);
DROP FUNCTION IF EXISTS public.reject_organizer_application(UUID, TEXT);
DROP FUNCTION IF EXISTS public.request_more_info_application(UUID, TEXT);

-- Function to approve an organizer application
CREATE FUNCTION public.approve_organizer_application(
  p_application_id UUID,
  p_admin_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_application RECORD;
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_admin_id AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin role required');
  END IF;

  SELECT id, user_id, status INTO v_application
  FROM organizer_applications WHERE id = p_application_id;

  IF v_application.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Application not found');
  END IF;

  IF v_application.status NOT IN ('submitted', 'under_review') THEN
    RETURN json_build_object('success', false, 'error', 'Application cannot be approved in current state: ' || v_application.status);
  END IF;

  UPDATE organizer_applications
  SET status = 'approved', reviewed_by = v_admin_id, reviewed_at = NOW(),
      admin_notes = COALESCE(p_admin_message, admin_notes), updated_at = NOW()
  WHERE id = p_application_id;

  INSERT INTO application_status_history (application_id, previous_status, new_status, changed_by, reason, metadata)
  VALUES (p_application_id, v_application.status, 'approved', v_admin_id, p_admin_message,
          jsonb_build_object('action', 'approve', 'timestamp', NOW()));

  INSERT INTO user_roles (user_id, role) VALUES (v_application.user_id, 'organizer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN json_build_object('success', true, 'message', 'Application approved successfully',
                           'application_id', p_application_id, 'user_id', v_application.user_id);
END;
$$;

-- Function to reject an organizer application
CREATE FUNCTION public.reject_organizer_application(
  p_application_id UUID,
  p_rejection_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_application RECORD;
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_admin_id AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin role required');
  END IF;

  IF p_rejection_reason IS NULL OR LENGTH(TRIM(p_rejection_reason)) < 10 THEN
    RETURN json_build_object('success', false, 'error', 'Rejection reason must be at least 10 characters');
  END IF;

  SELECT id, user_id, status INTO v_application
  FROM organizer_applications WHERE id = p_application_id;

  IF v_application.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Application not found');
  END IF;

  IF v_application.status NOT IN ('submitted', 'under_review', 'requires_more_info') THEN
    RETURN json_build_object('success', false, 'error', 'Application cannot be rejected in current state: ' || v_application.status);
  END IF;

  UPDATE organizer_applications
  SET status = 'rejected', reviewed_by = v_admin_id, reviewed_at = NOW(),
      rejection_reason = p_rejection_reason, updated_at = NOW()
  WHERE id = p_application_id;

  INSERT INTO application_status_history (application_id, previous_status, new_status, changed_by, reason, metadata)
  VALUES (p_application_id, v_application.status, 'rejected', v_admin_id, p_rejection_reason,
          jsonb_build_object('action', 'reject', 'timestamp', NOW()));

  RETURN json_build_object('success', true, 'message', 'Application rejected', 'application_id', p_application_id);
END;
$$;

-- Function to request more information
CREATE FUNCTION public.request_more_info_application(
  p_application_id UUID,
  p_info_request TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_application RECORD;
  v_admin_id UUID := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = v_admin_id AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin role required');
  END IF;

  IF p_info_request IS NULL OR LENGTH(TRIM(p_info_request)) < 10 THEN
    RETURN json_build_object('success', false, 'error', 'Information request must be at least 10 characters');
  END IF;

  SELECT id, user_id, status INTO v_application
  FROM organizer_applications WHERE id = p_application_id;

  IF v_application.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Application not found');
  END IF;

  IF v_application.status NOT IN ('submitted', 'under_review') THEN
    RETURN json_build_object('success', false, 'error', 'Cannot request more info in current state: ' || v_application.status);
  END IF;

  UPDATE organizer_applications
  SET status = 'requires_more_info', reviewed_by = v_admin_id, admin_notes = p_info_request, updated_at = NOW()
  WHERE id = p_application_id;

  INSERT INTO application_status_history (application_id, previous_status, new_status, changed_by, reason, metadata)
  VALUES (p_application_id, v_application.status, 'requires_more_info', v_admin_id, p_info_request,
          jsonb_build_object('action', 'request_more_info', 'timestamp', NOW()));

  RETURN json_build_object('success', true, 'message', 'Information request sent', 'application_id', p_application_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_organizer_application(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_organizer_application(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_more_info_application(UUID, TEXT) TO authenticated;