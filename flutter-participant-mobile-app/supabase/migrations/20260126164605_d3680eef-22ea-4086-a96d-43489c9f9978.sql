-- Fix function search_path for security
-- Update all new functions to set search_path = public

-- Fix calculate_decay_weight
CREATE OR REPLACE FUNCTION calculate_decay_weight(
  created_at TIMESTAMPTZ,
  half_life_days INT
) RETURNS FLOAT AS $$
BEGIN
  RETURN EXP(-0.693 * EXTRACT(EPOCH FROM (now() - created_at)) / (half_life_days * 86400));
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Fix get_interaction_score
CREATE OR REPLACE FUNCTION get_interaction_score(
  p_user_id UUID,
  p_target_user_id UUID,
  p_context TEXT DEFAULT 'pulse'
) RETURNS FLOAT AS $$
DECLARE
  total_score FLOAT := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE p_context 
      WHEN 'zone' THEN w.zone_weight 
      ELSE w.pulse_weight 
    END * public.calculate_decay_weight(e.created_at, w.decay_half_life_days)
  ), 0)
  INTO total_score
  FROM public.user_interaction_events e
  JOIN public.ml_signal_weights w ON w.signal_name = e.event_type
  WHERE e.user_id = p_user_id 
    AND e.target_user_id = p_target_user_id
    AND w.is_active = true;
    
  RETURN total_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix log_follow_interaction
CREATE OR REPLACE FUNCTION log_follow_interaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_interaction_events (user_id, target_user_id, event_type)
  VALUES (NEW.follower_id, NEW.following_id, 'follow');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix log_unfollow_interaction
CREATE OR REPLACE FUNCTION log_unfollow_interaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_interaction_events (user_id, target_user_id, event_type)
  VALUES (OLD.follower_id, OLD.following_id, 'unfollow');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_engagement_timestamp
CREATE OR REPLACE FUNCTION update_engagement_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;