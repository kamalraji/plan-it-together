-- =====================================================
-- Zone Phase 2: Session Bookmarks + Zone Challenges
-- =====================================================

-- =====================================================
-- 2.1 Session Bookmarks Table
-- =====================================================

CREATE TABLE public.session_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES event_sessions(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_minutes_before INTEGER DEFAULT 15, -- null = no reminder
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Enable RLS
ALTER TABLE public.session_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.session_bookmarks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks"
ON public.session_bookmarks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
ON public.session_bookmarks FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
ON public.session_bookmarks FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Indexes for session_bookmarks
CREATE INDEX idx_session_bookmarks_user ON public.session_bookmarks(user_id);
CREATE INDEX idx_session_bookmarks_session ON public.session_bookmarks(session_id);
CREATE INDEX idx_session_bookmarks_event ON public.session_bookmarks(event_id);
CREATE INDEX idx_session_bookmarks_reminder ON public.session_bookmarks(reminder_sent, reminder_minutes_before)
  WHERE reminder_sent = false AND reminder_minutes_before IS NOT NULL;

-- =====================================================
-- 2.3 Zone Challenges Tables
-- =====================================================

CREATE TABLE public.zone_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  description TEXT CHECK (char_length(description) <= 1000),
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('checkin', 'qr_scan', 'quiz', 'photo', 'social', 'session', 'booth')),
  points_reward INTEGER NOT NULL DEFAULT 10 CHECK (points_reward > 0 AND points_reward <= 1000),
  target_data JSONB DEFAULT '{}', -- e.g., {"location_id": "xxx"} or {"hashtag": "#event2024"}
  max_completions INTEGER, -- null = unlimited
  current_completions INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  icon TEXT DEFAULT '🎯',
  badge_id UUID REFERENCES zone_badges(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.zone_challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES zone_challenges(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proof_data JSONB, -- e.g., photo URL, QR data
  points_awarded INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Enable RLS
ALTER TABLE public.zone_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_challenge_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for zone_challenges
CREATE POLICY "Anyone can view active challenges"
ON public.zone_challenges FOR SELECT
TO authenticated
USING (
  is_active = true AND 
  (starts_at IS NULL OR starts_at <= now()) AND
  (ends_at IS NULL OR ends_at >= now())
);

CREATE POLICY "Organizers can manage challenges"
ON public.zone_challenges FOR ALL
TO authenticated
USING (
  public.can_manage_zone_content(event_id)
)
WITH CHECK (
  public.can_manage_zone_content(event_id)
);

-- RLS Policies for zone_challenge_completions
CREATE POLICY "Users can view their own completions"
ON public.zone_challenge_completions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can complete challenges"
ON public.zone_challenge_completions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM zone_challenges c
    WHERE c.id = challenge_id
    AND c.is_active = true
    AND (c.starts_at IS NULL OR c.starts_at <= now())
    AND (c.ends_at IS NULL OR c.ends_at >= now())
    AND (c.max_completions IS NULL OR c.current_completions < c.max_completions)
  )
);

-- Indexes for zone_challenges
CREATE INDEX idx_zone_challenges_event ON public.zone_challenges(event_id);
CREATE INDEX idx_zone_challenges_active ON public.zone_challenges(event_id, is_active, starts_at, ends_at);
CREATE INDEX idx_zone_challenge_completions_user ON public.zone_challenge_completions(user_id);
CREATE INDEX idx_zone_challenge_completions_challenge ON public.zone_challenge_completions(challenge_id);

-- Trigger to increment current_completions
CREATE OR REPLACE FUNCTION public.increment_challenge_completions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE zone_challenges 
  SET current_completions = current_completions + 1
  WHERE id = NEW.challenge_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_challenge_completion
  AFTER INSERT ON zone_challenge_completions
  FOR EACH ROW
  EXECUTE FUNCTION increment_challenge_completions();

-- Trigger to update updated_at
CREATE TRIGGER update_zone_challenges_updated_at
  BEFORE UPDATE ON public.zone_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2.4 Zone Activity Feed Table
-- =====================================================

CREATE TABLE public.zone_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('checkin', 'poll_result', 'leaderboard_change', 'badge_earned', 'session_live', 'announcement', 'challenge_complete')),
  title TEXT NOT NULL,
  description TEXT,
  actor_id UUID REFERENCES auth.users(id),
  actor_name TEXT,
  actor_avatar TEXT,
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.zone_activity_feed ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view public activities"
ON public.zone_activity_feed FOR SELECT
TO authenticated
USING (is_public = true);

CREATE POLICY "Organizers can create activities"
ON public.zone_activity_feed FOR INSERT
TO authenticated
WITH CHECK (
  public.can_manage_zone_content(event_id)
);

-- Index for activity feed
CREATE INDEX idx_zone_activity_feed_event ON public.zone_activity_feed(event_id, created_at DESC);
CREATE INDEX idx_zone_activity_feed_type ON public.zone_activity_feed(event_id, activity_type, created_at DESC);