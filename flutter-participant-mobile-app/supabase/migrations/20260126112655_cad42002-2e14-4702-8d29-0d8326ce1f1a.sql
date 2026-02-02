-- Phase 3: Core Performance Indexes and Rate Limiting

-- Q&A indexes
CREATE INDEX IF NOT EXISTS idx_session_questions_session_status 
  ON session_questions(session_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_questions_event ON session_questions(event_id, status);
CREATE INDEX IF NOT EXISTS idx_session_question_upvotes_question ON session_question_upvotes(question_id);

-- Bookmark indexes
CREATE INDEX IF NOT EXISTS idx_session_bookmarks_user ON session_bookmarks(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_session_bookmarks_session ON session_bookmarks(session_id);

-- Challenge indexes
CREATE INDEX IF NOT EXISTS idx_zone_challenges_event_active ON zone_challenges(event_id, is_active);
CREATE INDEX IF NOT EXISTS idx_zone_challenge_completions_user ON zone_challenge_completions(user_id);

-- Activity Feed indexes
CREATE INDEX IF NOT EXISTS idx_zone_activity_feed_event ON zone_activity_feed(event_id, created_at DESC);

-- Existing tables optimization
CREATE INDEX IF NOT EXISTS idx_event_sessions_event_status ON event_sessions(event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_polls_event_active ON event_polls(event_id, is_active);
CREATE INDEX IF NOT EXISTS idx_zone_leaderboard_event ON zone_leaderboard(event_id, total_points DESC);

-- Rate limit log table
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_log_lookup ON rate_limit_log(user_id, action, created_at DESC);
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_limit_insert" ON rate_limit_log;
CREATE POLICY "rate_limit_insert" ON rate_limit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Rate limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id UUID, p_action TEXT, p_max INTEGER DEFAULT 10, p_window INTEGER DEFAULT 60)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM rate_limit_log 
  WHERE user_id = p_user_id AND action = p_action AND created_at > now() - (p_window || ' seconds')::INTERVAL;
  IF v_count >= p_max THEN RETURN FALSE; END IF;
  INSERT INTO rate_limit_log (user_id, action) VALUES (p_user_id, p_action);
  RETURN TRUE;
END;
$$;

-- Question rate limit trigger (5 per 5 min)
CREATE OR REPLACE FUNCTION public.enforce_question_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT check_rate_limit(NEW.user_id, 'question', 5, 300) THEN
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_question_rate_limit ON session_questions;
CREATE TRIGGER tr_question_rate_limit BEFORE INSERT ON session_questions FOR EACH ROW EXECUTE FUNCTION enforce_question_rate_limit();

-- Upvote rate limit trigger (30 per min)
CREATE OR REPLACE FUNCTION public.enforce_upvote_rate_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT check_rate_limit(NEW.user_id, 'upvote', 30, 60) THEN
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_upvote_rate_limit ON session_question_upvotes;
CREATE TRIGGER tr_upvote_rate_limit BEFORE INSERT ON session_question_upvotes FOR EACH ROW EXECUTE FUNCTION enforce_upvote_rate_limit();