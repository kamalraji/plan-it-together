-- Competition Zone Tables for Quiz and Competition Events

-- Competition rounds table
CREATE TABLE public.competition_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  round_number INT NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  max_participants INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, round_number)
);

-- Competition questions table
CREATE TABLE public.competition_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES public.competition_rounds(id) ON DELETE CASCADE,
  question_number INT NOT NULL DEFAULT 1,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option_index INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 10,
  time_limit_seconds INT DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'closed')),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(round_id, question_number)
);

-- Competition responses table
CREATE TABLE public.competition_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.competition_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  selected_option INT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points_earned INT NOT NULL DEFAULT 0,
  response_time_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(question_id, user_id)
);

-- Competition scores table (aggregate scores per user per event)
CREATE TABLE public.competition_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  total_score INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  total_answers INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_competition_rounds_event ON public.competition_rounds(event_id);
CREATE INDEX idx_competition_rounds_status ON public.competition_rounds(status);
CREATE INDEX idx_competition_questions_round ON public.competition_questions(round_id);
CREATE INDEX idx_competition_questions_status ON public.competition_questions(status);
CREATE INDEX idx_competition_responses_question ON public.competition_responses(question_id);
CREATE INDEX idx_competition_responses_user ON public.competition_responses(user_id);
CREATE INDEX idx_competition_scores_event ON public.competition_scores(event_id);
CREATE INDEX idx_competition_scores_total ON public.competition_scores(event_id, total_score DESC);

-- Enable RLS
ALTER TABLE public.competition_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competition_rounds
CREATE POLICY "Anyone can view competition rounds"
  ON public.competition_rounds FOR SELECT
  USING (true);

CREATE POLICY "Event owners can manage rounds"
  ON public.competition_rounds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.owner_id = auth.uid()
    )
  );

-- RLS Policies for competition_questions
CREATE POLICY "Anyone can view active or closed questions"
  ON public.competition_questions FOR SELECT
  USING (status IN ('active', 'closed'));

CREATE POLICY "Event owners can manage questions"
  ON public.competition_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.competition_rounds r
      JOIN public.events e ON e.id = r.event_id
      WHERE r.id = round_id AND e.owner_id = auth.uid()
    )
  );

-- RLS Policies for competition_responses
CREATE POLICY "Users can view their own responses"
  ON public.competition_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit their own responses"
  ON public.competition_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for competition_scores
CREATE POLICY "Anyone can view competition scores"
  ON public.competition_scores FOR SELECT
  USING (true);

CREATE POLICY "System can manage scores"
  ON public.competition_scores FOR ALL
  USING (auth.uid() = user_id);

-- Function to update score after response
CREATE OR REPLACE FUNCTION public.update_competition_score()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id UUID;
  v_current_streak INT;
BEGIN
  -- Get event_id from the question's round
  SELECT r.event_id INTO v_event_id
  FROM public.competition_rounds r
  JOIN public.competition_questions q ON q.round_id = r.id
  WHERE q.id = NEW.question_id;

  -- Get current streak
  SELECT COALESCE(current_streak, 0) INTO v_current_streak
  FROM public.competition_scores
  WHERE event_id = v_event_id AND user_id = NEW.user_id;

  -- Update or insert score
  INSERT INTO public.competition_scores (event_id, user_id, total_score, correct_answers, total_answers, current_streak, best_streak, last_updated)
  VALUES (
    v_event_id,
    NEW.user_id,
    NEW.points_earned,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    now()
  )
  ON CONFLICT (event_id, user_id) DO UPDATE SET
    total_score = competition_scores.total_score + NEW.points_earned,
    correct_answers = competition_scores.correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    total_answers = competition_scores.total_answers + 1,
    current_streak = CASE WHEN NEW.is_correct THEN competition_scores.current_streak + 1 ELSE 0 END,
    best_streak = GREATEST(competition_scores.best_streak, CASE WHEN NEW.is_correct THEN competition_scores.current_streak + 1 ELSE competition_scores.best_streak END),
    last_updated = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic score updates
CREATE TRIGGER trigger_update_competition_score
  AFTER INSERT ON public.competition_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_competition_score();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_scores;