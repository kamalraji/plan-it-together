-- =====================================================
-- Phase 6: Zone Gamification (points, badges, leaderboard)
-- Phase 7: Zone Notifications
-- =====================================================

-- Zone Points Activities Table
CREATE TABLE IF NOT EXISTS public.zone_point_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'checkin', 'poll_vote', 'icebreaker_answer', 'session_rating', 
    'session_attendance', 'material_download', 'badge_earned', 'streak_bonus'
  )),
  points INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Zone Leaderboard Aggregate (cached for performance)
CREATE TABLE IF NOT EXISTS public.zone_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  badges_earned INTEGER NOT NULL DEFAULT 0,
  activity_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Zone Badges Table
CREATE TABLE IF NOT EXISTS public.zone_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'award',
  category TEXT NOT NULL DEFAULT 'engagement' CHECK (category IN (
    'engagement', 'learning', 'networking', 'contribution', 'achievement'
  )),
  points_threshold INTEGER,
  activity_threshold INTEGER,
  activity_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Earned Badges
CREATE TABLE IF NOT EXISTS public.zone_user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.zone_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id, badge_id)
);

-- Zone Notification Preferences (event-specific)
CREATE TABLE IF NOT EXISTS public.zone_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  announcements_enabled BOOLEAN NOT NULL DEFAULT true,
  session_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  poll_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  badge_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  leaderboard_updates_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Zone Notifications Queue (for in-app/push)
CREATE TABLE IF NOT EXISTS public.zone_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'announcement', 'session_start', 'session_reminder', 'poll_live',
    'badge_earned', 'leaderboard_rank_up', 'streak_milestone', 'icebreaker_new'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  push_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_zone_point_activities_user_event 
  ON public.zone_point_activities(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_zone_point_activities_created 
  ON public.zone_point_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zone_leaderboard_event_rank 
  ON public.zone_leaderboard(event_id, rank ASC);
CREATE INDEX IF NOT EXISTS idx_zone_leaderboard_event_points 
  ON public.zone_leaderboard(event_id, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_zone_user_badges_user_event 
  ON public.zone_user_badges(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_zone_notifications_user_event 
  ON public.zone_notifications(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_zone_notifications_unread 
  ON public.zone_notifications(user_id, read) WHERE read = false;

-- Enable RLS
ALTER TABLE public.zone_point_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for zone_point_activities
CREATE POLICY "Users can view own point activities"
  ON public.zone_point_activities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts point activities"
  ON public.zone_point_activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for zone_leaderboard (public view within event)
CREATE POLICY "Anyone can view event leaderboard"
  ON public.zone_leaderboard FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System manages leaderboard"
  ON public.zone_leaderboard FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for zone_badges (public read)
CREATE POLICY "Anyone can view badges"
  ON public.zone_badges FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for zone_user_badges
CREATE POLICY "Users can view own badges"
  ON public.zone_user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all badges for event"
  ON public.zone_user_badges FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for zone_notification_preferences
CREATE POLICY "Users manage own notification preferences"
  ON public.zone_notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for zone_notifications
CREATE POLICY "Users manage own zone notifications"
  ON public.zone_notifications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to award points and update leaderboard
CREATE OR REPLACE FUNCTION public.award_zone_points(
  p_user_id UUID,
  p_event_id UUID,
  p_activity_type TEXT,
  p_points INTEGER,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_points INTEGER;
BEGIN
  -- Insert point activity
  INSERT INTO zone_point_activities (user_id, event_id, activity_type, points, metadata)
  VALUES (p_user_id, p_event_id, p_activity_type, p_points, p_metadata);
  
  -- Upsert leaderboard entry
  INSERT INTO zone_leaderboard (user_id, event_id, total_points, activity_count, last_activity_at)
  VALUES (p_user_id, p_event_id, p_points, 1, now())
  ON CONFLICT (event_id, user_id)
  DO UPDATE SET
    total_points = zone_leaderboard.total_points + p_points,
    activity_count = zone_leaderboard.activity_count + 1,
    last_activity_at = now(),
    updated_at = now();
  
  -- Get new total
  SELECT total_points INTO v_total_points
  FROM zone_leaderboard
  WHERE user_id = p_user_id AND event_id = p_event_id;
  
  RETURN v_total_points;
END;
$$;

-- Function to recalculate event leaderboard ranks
CREATE OR REPLACE FUNCTION public.recalculate_zone_ranks(p_event_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE zone_leaderboard
  SET rank = subq.new_rank
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC) as new_rank
    FROM zone_leaderboard
    WHERE event_id = p_event_id
  ) subq
  WHERE zone_leaderboard.user_id = subq.user_id
    AND zone_leaderboard.event_id = p_event_id;
END;
$$;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION public.check_zone_badges(
  p_user_id UUID,
  p_event_id UUID
)
RETURNS SETOF zone_badges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge zone_badges;
  v_total_points INTEGER;
  v_activity_count INTEGER;
BEGIN
  -- Get user stats
  SELECT total_points, activity_count INTO v_total_points, v_activity_count
  FROM zone_leaderboard
  WHERE user_id = p_user_id AND event_id = p_event_id;
  
  -- Check each badge
  FOR v_badge IN 
    SELECT b.* FROM zone_badges b
    WHERE b.id NOT IN (
      SELECT badge_id FROM zone_user_badges 
      WHERE user_id = p_user_id AND event_id = p_event_id
    )
  LOOP
    -- Check if badge should be awarded
    IF (v_badge.points_threshold IS NOT NULL AND v_total_points >= v_badge.points_threshold)
       OR (v_badge.activity_threshold IS NOT NULL AND v_activity_count >= v_badge.activity_threshold) THEN
      -- Award badge
      INSERT INTO zone_user_badges (user_id, event_id, badge_id)
      VALUES (p_user_id, p_event_id, v_badge.id)
      ON CONFLICT DO NOTHING;
      
      -- Update badge count
      UPDATE zone_leaderboard
      SET badges_earned = badges_earned + 1
      WHERE user_id = p_user_id AND event_id = p_event_id;
      
      RETURN NEXT v_badge;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Insert default badges
INSERT INTO public.zone_badges (name, description, icon, category, points_threshold, activity_threshold, activity_type) VALUES
  ('Early Bird', 'Checked in within the first hour', 'sunrise', 'engagement', NULL, 1, 'checkin'),
  ('Poll Master', 'Voted on 5 polls', 'bar-chart', 'engagement', NULL, 5, 'poll_vote'),
  ('Feedback Champion', 'Rated 3 sessions', 'star', 'contribution', NULL, 3, 'session_rating'),
  ('Ice Breaker', 'Answered 3 icebreakers', 'message-circle', 'networking', NULL, 3, 'icebreaker_answer'),
  ('Knowledge Seeker', 'Downloaded 5 materials', 'download', 'learning', NULL, 5, 'material_download'),
  ('Rising Star', 'Earned 100 points', 'trending-up', 'achievement', 100, NULL, NULL),
  ('Superstar', 'Earned 500 points', 'zap', 'achievement', 500, NULL, NULL),
  ('Legend', 'Earned 1000 points', 'crown', 'achievement', 1000, NULL, NULL)
ON CONFLICT DO NOTHING;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_zone_notification_prefs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_zone_notification_prefs ON public.zone_notification_preferences;
CREATE TRIGGER trigger_update_zone_notification_prefs
  BEFORE UPDATE ON public.zone_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_zone_notification_prefs_timestamp();