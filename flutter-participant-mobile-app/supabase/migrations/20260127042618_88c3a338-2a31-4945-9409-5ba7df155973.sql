-- Create trigger function for check-in activity
CREATE OR REPLACE FUNCTION create_checkin_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  -- Get user name
  SELECT full_name INTO v_user_name
  FROM user_profiles
  WHERE id = NEW.user_id;

  -- Insert activity event
  INSERT INTO activity_feed_events (
    event_id,
    activity_type,
    user_id,
    target_id,
    title,
    description,
    metadata,
    is_highlighted
  ) VALUES (
    NEW.event_id,
    'check_in',
    NEW.user_id,
    NEW.id,
    'checked in to the event',
    NULL,
    jsonb_build_object('check_in_method', NEW.check_in_method),
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for attendance_records
DROP TRIGGER IF EXISTS on_attendance_create_activity ON attendance_records;
CREATE TRIGGER on_attendance_create_activity
  AFTER INSERT ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION create_checkin_activity();

-- Create trigger function for poll vote activity
CREATE OR REPLACE FUNCTION create_poll_vote_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_poll_question TEXT;
  v_event_id UUID;
BEGIN
  -- Get poll details
  SELECT question, event_id INTO v_poll_question, v_event_id
  FROM event_polls
  WHERE id = NEW.poll_id;

  -- Insert activity event
  INSERT INTO activity_feed_events (
    event_id,
    activity_type,
    user_id,
    target_id,
    title,
    description,
    metadata,
    is_highlighted
  ) VALUES (
    v_event_id,
    'poll_vote',
    NEW.user_id,
    NEW.poll_id,
    'voted on a poll',
    v_poll_question,
    jsonb_build_object('poll_id', NEW.poll_id, 'option_id', NEW.option_id),
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for event_poll_votes
DROP TRIGGER IF EXISTS on_poll_vote_create_activity ON event_poll_votes;
CREATE TRIGGER on_poll_vote_create_activity
  AFTER INSERT ON event_poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION create_poll_vote_activity();

-- Create trigger function for icebreaker response activity
CREATE OR REPLACE FUNCTION create_icebreaker_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id UUID;
  v_question TEXT;
BEGIN
  -- Get prompt details
  SELECT event_id, question INTO v_event_id, v_question
  FROM icebreaker_prompts
  WHERE id = NEW.prompt_id;

  -- Insert activity event (only for non-anonymous responses)
  IF NOT NEW.is_anonymous THEN
    INSERT INTO activity_feed_events (
      event_id,
      activity_type,
      user_id,
      target_id,
      title,
      description,
      metadata,
      is_highlighted
    ) VALUES (
      v_event_id,
      'icebreaker_response',
      NEW.user_id,
      NEW.id,
      'answered an icebreaker',
      v_question,
      jsonb_build_object('prompt_id', NEW.prompt_id),
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for icebreaker_responses
DROP TRIGGER IF EXISTS on_icebreaker_create_activity ON icebreaker_responses;
CREATE TRIGGER on_icebreaker_create_activity
  AFTER INSERT ON icebreaker_responses
  FOR EACH ROW
  EXECUTE FUNCTION create_icebreaker_activity();

-- Insert sample activity events for testing real-time
INSERT INTO activity_feed_events (event_id, activity_type, user_id, title, description, is_highlighted)
SELECT 
  e.id,
  'announcement',
  NULL,
  'Activity feed is now live!',
  'Watch real-time updates as attendees interact with the event.',
  true
FROM events e
WHERE e.status = 'PUBLISHED' AND e.end_date >= CURRENT_DATE
LIMIT 3;