-- Create function to get due session reminders
-- Returns bookmarks where the reminder time has passed but session hasn't started
CREATE OR REPLACE FUNCTION public.get_due_session_reminders()
RETURNS TABLE (
  bookmark_id UUID,
  user_id UUID,
  session_id UUID,
  event_id UUID,
  session_title TEXT,
  session_start_time TIMESTAMPTZ,
  reminder_minutes_before INT,
  room TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sb.id as bookmark_id,
    sb.user_id,
    sb.session_id,
    sb.event_id,
    es.title as session_title,
    es.start_time as session_start_time,
    sb.reminder_minutes_before,
    es.room
  FROM session_bookmarks sb
  JOIN event_sessions es ON es.id = sb.session_id
  WHERE sb.reminder_sent = false
    AND sb.reminder_minutes_before IS NOT NULL
    AND es.start_time - (sb.reminder_minutes_before || ' minutes')::interval <= NOW()
    AND es.start_time > NOW()
  ORDER BY es.start_time ASC;
END;
$$;

-- Grant execute to service role for cron job
GRANT EXECUTE ON FUNCTION public.get_due_session_reminders() TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_due_session_reminders() IS 
'Returns session bookmarks that are due for reminder notifications. Used by send-session-reminders edge function.';