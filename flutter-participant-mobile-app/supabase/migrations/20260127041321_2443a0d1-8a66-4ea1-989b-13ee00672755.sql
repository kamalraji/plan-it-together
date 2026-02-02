-- =============================================
-- Phase 1: Icebreaker, Session Feedback & Activity Feed Tables
-- Using IF NOT EXISTS for indexes
-- =============================================

-- 1. Icebreaker Prompts
CREATE TABLE IF NOT EXISTS public.icebreaker_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  prompt_type TEXT NOT NULL DEFAULT 'daily' CHECK (prompt_type IN ('daily', 'session', 'topic', 'fun')),
  active_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icebreaker_prompts_event_date ON public.icebreaker_prompts(event_id, active_date);
CREATE INDEX IF NOT EXISTS idx_icebreaker_prompts_active ON public.icebreaker_prompts(event_id, is_active) WHERE is_active = true;

ALTER TABLE public.icebreaker_prompts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can view active prompts" ON public.icebreaker_prompts FOR SELECT TO authenticated USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Event owners and admins can manage prompts" ON public.icebreaker_prompts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.owner_id = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.owner_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Icebreaker Responses
CREATE TABLE IF NOT EXISTS public.icebreaker_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.icebreaker_prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  response TEXT NOT NULL CHECK (char_length(response) <= 500),
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(prompt_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_icebreaker_responses_prompt ON public.icebreaker_responses(prompt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_icebreaker_responses_user ON public.icebreaker_responses(user_id);

ALTER TABLE public.icebreaker_responses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Users can view all responses" ON public.icebreaker_responses FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can create own responses" ON public.icebreaker_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update own responses" ON public.icebreaker_responses FOR UPDATE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can delete own responses" ON public.icebreaker_responses FOR DELETE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Icebreaker Response Likes
CREATE TABLE IF NOT EXISTS public.icebreaker_response_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.icebreaker_responses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(response_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_icebreaker_likes_response ON public.icebreaker_response_likes(response_id);
ALTER TABLE public.icebreaker_response_likes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Users can view likes" ON public.icebreaker_response_likes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can manage own likes" ON public.icebreaker_response_likes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Session Feedback
CREATE TABLE IF NOT EXISTS public.session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  content_rating INT CHECK (content_rating BETWEEN 1 AND 5),
  speaker_rating INT CHECK (speaker_rating BETWEEN 1 AND 5),
  quick_tags TEXT[],
  feedback_text TEXT CHECK (char_length(feedback_text) <= 1000),
  would_recommend BOOLEAN,
  show_to_speaker BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_session_feedback_session_v2 ON public.session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_user_v2 ON public.session_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_rating_v2 ON public.session_feedback(session_id, overall_rating);

ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Users can view own feedback" ON public.session_feedback FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can create own feedback" ON public.session_feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update own feedback" ON public.session_feedback FOR UPDATE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Activity Feed Events
CREATE TABLE IF NOT EXISTS public.activity_feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('check_in', 'check_out', 'poll_vote', 'poll_result', 'session_start', 'session_end', 'achievement', 'announcement', 'icebreaker_response', 'milestone', 'sponsor_visit')),
  user_id UUID,
  target_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_event ON public.activity_feed_events(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON public.activity_feed_events(event_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_highlighted ON public.activity_feed_events(event_id, is_highlighted) WHERE is_highlighted = true;

ALTER TABLE public.activity_feed_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Authenticated users can view activity feed" ON public.activity_feed_events FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "System and organizers can create activities" ON public.activity_feed_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.owner_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Triggers
DROP TRIGGER IF EXISTS update_icebreaker_prompts_updated_at ON public.icebreaker_prompts;
CREATE TRIGGER update_icebreaker_prompts_updated_at BEFORE UPDATE ON public.icebreaker_prompts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_session_feedback_updated_at ON public.session_feedback;
CREATE TRIGGER update_session_feedback_updated_at BEFORE UPDATE ON public.session_feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Likes count trigger
CREATE OR REPLACE FUNCTION public.update_icebreaker_likes_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.icebreaker_responses SET likes_count = likes_count + 1 WHERE id = NEW.response_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.icebreaker_responses SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.response_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_icebreaker_likes_count ON public.icebreaker_response_likes;
CREATE TRIGGER trigger_update_icebreaker_likes_count AFTER INSERT OR DELETE ON public.icebreaker_response_likes FOR EACH ROW EXECUTE FUNCTION public.update_icebreaker_likes_count();

-- 8. Check-in activity trigger
CREATE OR REPLACE FUNCTION public.create_checkin_activity() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_feed_events (event_id, activity_type, user_id, title, metadata)
  VALUES (NEW.event_id, 'check_in', NEW.user_id, 'joined the event', jsonb_build_object('registration_id', NEW.registration_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_create_checkin_activity ON public.attendance_records;
CREATE TRIGGER trigger_create_checkin_activity AFTER INSERT ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.create_checkin_activity();