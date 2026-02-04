-- Fix search path for the reorder_waitlist_positions function
CREATE OR REPLACE FUNCTION public.reorder_waitlist_positions(
  p_event_id UUID,
  p_entry_id UUID,
  p_new_position INTEGER
) RETURNS VOID AS $$
DECLARE
  v_old_position INTEGER;
BEGIN
  -- Get current position
  SELECT position INTO v_old_position
  FROM public.event_waitlist
  WHERE id = p_entry_id AND status = 'waiting';
  
  IF v_old_position IS NULL THEN
    RAISE EXCEPTION 'Entry not found';
  END IF;
  
  -- Shift other entries
  IF p_new_position < v_old_position THEN
    UPDATE public.event_waitlist
    SET position = position + 1, updated_at = NOW()
    WHERE event_id = p_event_id
      AND status = 'waiting'
      AND position >= p_new_position
      AND position < v_old_position;
  ELSE
    UPDATE public.event_waitlist
    SET position = position - 1, updated_at = NOW()
    WHERE event_id = p_event_id
      AND status = 'waiting'
      AND position > v_old_position
      AND position <= p_new_position;
  END IF;
  
  -- Update the moved entry
  UPDATE public.event_waitlist
  SET position = p_new_position, updated_at = NOW()
  WHERE id = p_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;