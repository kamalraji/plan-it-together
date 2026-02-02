-- =====================================================
-- ZONE Q&A SYSTEM - Industrial Grade Implementation
-- Phase 1.1: Session Questions with Moderation Flow
-- =====================================================

-- 1. Create session_questions table
CREATE TABLE public.session_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  upvote_count INTEGER NOT NULL DEFAULT 0,
  answer_text TEXT,
  answered_at TIMESTAMPTZ,
  answered_by UUID,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT session_questions_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES event_sessions(id) ON DELETE CASCADE,
  CONSTRAINT session_questions_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT session_questions_question_text_length 
    CHECK (char_length(question_text) BETWEEN 10 AND 500),
  CONSTRAINT session_questions_valid_status 
    CHECK (status IN ('pending', 'approved', 'answered', 'rejected'))
);

-- 2. Create upvotes junction table
CREATE TABLE public.session_question_upvotes (
  question_id UUID NOT NULL REFERENCES session_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, user_id)
);

-- 3. Create indexes for performance
CREATE INDEX idx_session_questions_session_status 
  ON session_questions(session_id, status, created_at DESC);
CREATE INDEX idx_session_questions_event 
  ON session_questions(event_id, status);
CREATE INDEX idx_session_questions_user 
  ON session_questions(user_id);
CREATE INDEX idx_session_question_upvotes_question 
  ON session_question_upvotes(question_id);

-- 4. Enable RLS
ALTER TABLE public.session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_question_upvotes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for session_questions

-- Users can submit questions (authenticated only)
CREATE POLICY "Users can submit questions"
ON public.session_questions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can see approved/answered questions OR their own questions
-- Organizers/team can see all for moderation via can_manage_zone_content
CREATE POLICY "Users see approved or own questions"
ON public.session_questions
FOR SELECT
TO authenticated
USING (
  status IN ('approved', 'answered') OR 
  user_id = auth.uid() OR
  public.can_manage_zone_content(event_id)
);

-- Only organizers can update questions (for moderation)
CREATE POLICY "Organizers can moderate questions"
ON public.session_questions
FOR UPDATE
TO authenticated
USING (public.can_manage_zone_content(event_id));

-- Users can delete their own pending questions
CREATE POLICY "Users can delete own pending questions"
ON public.session_questions
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() AND status = 'pending'
);

-- 6. RLS Policies for upvotes

-- Users can upvote questions
CREATE POLICY "Users can upvote questions"
ON public.session_question_upvotes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can see all upvotes
CREATE POLICY "Anyone can see upvotes"
ON public.session_question_upvotes
FOR SELECT
TO authenticated
USING (true);

-- Users can remove their own upvotes
CREATE POLICY "Users can remove own upvotes"
ON public.session_question_upvotes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 7. Trigger to update upvote count
CREATE OR REPLACE FUNCTION update_question_upvote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE session_questions 
    SET upvote_count = upvote_count + 1, updated_at = now()
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE session_questions 
    SET upvote_count = GREATEST(0, upvote_count - 1), updated_at = now()
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_question_upvote_count
AFTER INSERT OR DELETE ON session_question_upvotes
FOR EACH ROW
EXECUTE FUNCTION update_question_upvote_count();

-- 8. Trigger for updated_at
CREATE TRIGGER update_session_questions_updated_at
BEFORE UPDATE ON session_questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();