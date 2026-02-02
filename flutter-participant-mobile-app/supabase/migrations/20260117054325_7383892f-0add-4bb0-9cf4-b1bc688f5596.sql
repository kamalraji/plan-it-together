-- Add streak tracking to impact_profiles
ALTER TABLE impact_profiles 
ADD COLUMN IF NOT EXISTS streak_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_streak_date date,
ADD COLUMN IF NOT EXISTS streak_actions_today integer DEFAULT 0;

-- Create RPC function to update streak
CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid UUID)
RETURNS void AS $$
DECLARE
  last_date date;
  today_date date := CURRENT_DATE;
BEGIN
  SELECT last_streak_date INTO last_date 
  FROM impact_profiles WHERE user_id = user_uuid;
  
  IF last_date = today_date THEN
    -- Already counted today, just increment actions
    UPDATE impact_profiles 
    SET streak_actions_today = streak_actions_today + 1
    WHERE user_id = user_uuid;
  ELSIF last_date = today_date - 1 THEN
    -- Continue streak
    UPDATE impact_profiles 
    SET streak_count = streak_count + 1,
        last_streak_date = today_date,
        streak_actions_today = 1
    WHERE user_id = user_uuid;
  ELSE
    -- Streak broken, reset
    UPDATE impact_profiles 
    SET streak_count = 1,
        last_streak_date = today_date,
        streak_actions_today = 1
    WHERE user_id = user_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;