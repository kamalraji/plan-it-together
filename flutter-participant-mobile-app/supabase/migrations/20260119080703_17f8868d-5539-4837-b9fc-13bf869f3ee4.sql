-- Competition Presence Tracking
CREATE TABLE public.competition_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_online BOOLEAN DEFAULT true,
  last_seen TIMESTAMPTZ DEFAULT now(),
  current_question_id UUID REFERENCES public.competition_questions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Competition Badges
CREATE TABLE public.competition_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  rarity TEXT DEFAULT 'RARE',
  points_value INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Earned Competition Badges
CREATE TABLE public.user_competition_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.competition_badges(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, badge_id, event_id)
);

-- Add team_id to competition_scores for team mode
ALTER TABLE public.competition_scores 
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.hackathon_teams(id) ON DELETE SET NULL;

-- Team Competition Scores
CREATE TABLE public.competition_team_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  total_score INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  total_answers INT DEFAULT 0,
  member_count INT DEFAULT 0,
  average_score NUMERIC(10,2) DEFAULT 0,
  best_streak INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, team_id)
);

-- Seed Competition Badges
INSERT INTO public.competition_badges (name, description, icon, badge_type, rarity, points_value) VALUES
  ('Champion', 'Achieved 1st place in a competition', '🏆', 'first_place', 'LEGENDARY', 500),
  ('Silver Medalist', 'Achieved 2nd place in a competition', '🥈', 'second_place', 'EPIC', 300),
  ('Bronze Medalist', 'Achieved 3rd place in a competition', '🥉', 'third_place', 'EPIC', 200),
  ('Perfect Score', 'Answered all questions correctly', '💯', 'perfect_score', 'LEGENDARY', 400),
  ('Speed Demon', 'Fastest correct answer in a round', '⚡', 'speed_demon', 'RARE', 100),
  ('Streak Master', '10+ correct answers in a row', '🔥', 'streak_master', 'EPIC', 250),
  ('Quick Draw', 'Answered correctly within 3 seconds', '🎯', 'quick_draw', 'RARE', 75),
  ('Consistent', '5+ correct answers in a row', '📈', 'streak_5', 'COMMON', 50),
  ('Perfectionist', 'No wrong answers in a round', '✨', 'round_perfect', 'RARE', 150),
  ('Team Player', 'Contributed to team victory', '🤝', 'team_player', 'RARE', 100);

-- Enable RLS
ALTER TABLE public.competition_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_competition_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_team_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competition_presence
CREATE POLICY "Users can view presence for events they attend"
  ON public.competition_presence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      WHERE r.event_id = competition_presence.event_id
      AND r.user_id = auth.uid()
      AND r.status = 'CONFIRMED'
    )
  );

CREATE POLICY "Users can manage their own presence"
  ON public.competition_presence FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for competition_badges (viewable by all)
CREATE POLICY "Badges are viewable by everyone"
  ON public.competition_badges FOR SELECT
  USING (true);

-- RLS Policies for user_competition_badges
CREATE POLICY "Users can view their own badges"
  ON public.user_competition_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view badges of event participants"
  ON public.user_competition_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      WHERE r.event_id = user_competition_badges.event_id
      AND r.user_id = auth.uid()
      AND r.status = 'CONFIRMED'
    )
  );

-- RLS Policies for competition_team_scores
CREATE POLICY "Team scores viewable by event attendees"
  ON public.competition_team_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations r
      WHERE r.event_id = competition_team_scores.event_id
      AND r.user_id = auth.uid()
      AND r.status = 'CONFIRMED'
    )
  );

-- Function to update team scores after individual score change
CREATE OR REPLACE FUNCTION public.update_competition_team_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.team_id IS NOT NULL THEN
    INSERT INTO public.competition_team_scores (event_id, team_id, total_score, correct_answers, total_answers, member_count, average_score, best_streak, last_updated)
    SELECT 
      NEW.event_id,
      NEW.team_id,
      COALESCE(SUM(cs.total_score), 0),
      COALESCE(SUM(cs.correct_answers), 0),
      COALESCE(SUM(cs.total_answers), 0),
      COUNT(DISTINCT cs.user_id),
      CASE WHEN COUNT(DISTINCT cs.user_id) > 0 
        THEN ROUND(COALESCE(SUM(cs.total_score), 0)::NUMERIC / COUNT(DISTINCT cs.user_id), 2)
        ELSE 0 
      END,
      COALESCE(MAX(cs.best_streak), 0),
      now()
    FROM public.competition_scores cs
    WHERE cs.team_id = NEW.team_id AND cs.event_id = NEW.event_id
    GROUP BY cs.team_id
    ON CONFLICT (event_id, team_id) DO UPDATE SET
      total_score = EXCLUDED.total_score,
      correct_answers = EXCLUDED.correct_answers,
      total_answers = EXCLUDED.total_answers,
      member_count = EXCLUDED.member_count,
      average_score = EXCLUDED.average_score,
      best_streak = EXCLUDED.best_streak,
      last_updated = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update team scores
CREATE TRIGGER update_team_score_trigger
  AFTER INSERT OR UPDATE ON public.competition_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_competition_team_score();

-- Function to check and award badges
CREATE OR REPLACE FUNCTION public.check_competition_badges()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id UUID;
  v_badge_id UUID;
BEGIN
  -- Get event_id
  SELECT r.event_id INTO v_event_id
  FROM public.competition_rounds r
  JOIN public.competition_questions q ON q.round_id = r.id
  WHERE q.id = NEW.question_id;

  -- Check for Streak Master (10+ streak)
  IF NEW.is_correct THEN
    SELECT cs.current_streak INTO NEW.points_earned
    FROM public.competition_scores cs
    WHERE cs.event_id = v_event_id AND cs.user_id = NEW.user_id;
    
    -- Award Streak Master badge
    IF EXISTS (
      SELECT 1 FROM public.competition_scores cs
      WHERE cs.event_id = v_event_id 
      AND cs.user_id = NEW.user_id 
      AND cs.current_streak >= 10
    ) THEN
      SELECT id INTO v_badge_id FROM public.competition_badges WHERE badge_type = 'streak_master';
      IF v_badge_id IS NOT NULL THEN
        INSERT INTO public.user_competition_badges (user_id, badge_id, event_id, metadata)
        VALUES (NEW.user_id, v_badge_id, v_event_id, jsonb_build_object('streak', 10))
        ON CONFLICT (user_id, badge_id, event_id) DO NOTHING;
      END IF;
    END IF;

    -- Award 5 streak badge
    IF EXISTS (
      SELECT 1 FROM public.competition_scores cs
      WHERE cs.event_id = v_event_id 
      AND cs.user_id = NEW.user_id 
      AND cs.current_streak >= 5
    ) THEN
      SELECT id INTO v_badge_id FROM public.competition_badges WHERE badge_type = 'streak_5';
      IF v_badge_id IS NOT NULL THEN
        INSERT INTO public.user_competition_badges (user_id, badge_id, event_id, metadata)
        VALUES (NEW.user_id, v_badge_id, v_event_id, jsonb_build_object('streak', 5))
        ON CONFLICT (user_id, badge_id, event_id) DO NOTHING;
      END IF;
    END IF;

    -- Award Quick Draw (< 3 seconds)
    IF NEW.response_time_ms IS NOT NULL AND NEW.response_time_ms < 3000 THEN
      SELECT id INTO v_badge_id FROM public.competition_badges WHERE badge_type = 'quick_draw';
      IF v_badge_id IS NOT NULL THEN
        INSERT INTO public.user_competition_badges (user_id, badge_id, event_id, metadata)
        VALUES (NEW.user_id, v_badge_id, v_event_id, jsonb_build_object('response_time_ms', NEW.response_time_ms))
        ON CONFLICT (user_id, badge_id, event_id) DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to check badges after response
CREATE TRIGGER check_badges_trigger
  AFTER INSERT ON public.competition_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.check_competition_badges();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_competition_presence_event ON public.competition_presence(event_id);
CREATE INDEX IF NOT EXISTS idx_competition_presence_online ON public.competition_presence(event_id, is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_user_competition_badges_user ON public.user_competition_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_competition_badges_event ON public.user_competition_badges(event_id);
CREATE INDEX IF NOT EXISTS idx_competition_team_scores_event ON public.competition_team_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_competition_scores_team ON public.competition_scores(team_id) WHERE team_id IS NOT NULL;