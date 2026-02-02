-- Phase 2: Session Rating & Feedback System

-- Session Feedback table
CREATE TABLE IF NOT EXISTS public.event_session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  content_rating INTEGER CHECK (content_rating BETWEEN 1 AND 5),
  speaker_rating INTEGER CHECK (speaker_rating BETWEEN 1 AND 5),
  feedback_text TEXT CHECK (char_length(feedback_text) <= 1000),
  would_recommend BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Session rating aggregates (for performance)
CREATE TABLE IF NOT EXISTS public.event_session_ratings_aggregate (
  session_id UUID PRIMARY KEY REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  average_rating NUMERIC(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  rating_distribution JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_feedback_session ON public.event_session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_user ON public.event_session_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_event ON public.event_session_feedback(event_id);

-- Enable RLS
ALTER TABLE public.event_session_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_session_ratings_aggregate ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_session_feedback

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON public.event_session_feedback
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Team members can view all feedback for their events
CREATE POLICY "Team can view event feedback" ON public.event_session_feedback
FOR SELECT TO authenticated
USING (
  public.can_manage_zone_content(event_id)
);

-- Users can submit feedback (one per session)
CREATE POLICY "Users can submit feedback" ON public.event_session_feedback
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback" ON public.event_session_feedback
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ratings aggregate (public read)
CREATE POLICY "Anyone can view rating aggregates" ON public.event_session_ratings_aggregate
FOR SELECT TO authenticated
USING (true);

-- Only system can update aggregates (via trigger)
CREATE POLICY "System updates aggregates" ON public.event_session_ratings_aggregate
FOR ALL TO authenticated
USING (false)
WITH CHECK (false);

-- Trigger function to update aggregates when feedback is added/updated
CREATE OR REPLACE FUNCTION public.update_session_rating_aggregate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg NUMERIC(3,2);
  v_total INTEGER;
  v_distribution JSONB;
BEGIN
  -- Calculate new aggregates
  SELECT 
    COALESCE(ROUND(AVG(overall_rating)::numeric, 2), 0),
    COUNT(*),
    jsonb_build_object(
      '1', COUNT(*) FILTER (WHERE overall_rating = 1),
      '2', COUNT(*) FILTER (WHERE overall_rating = 2),
      '3', COUNT(*) FILTER (WHERE overall_rating = 3),
      '4', COUNT(*) FILTER (WHERE overall_rating = 4),
      '5', COUNT(*) FILTER (WHERE overall_rating = 5)
    )
  INTO v_avg, v_total, v_distribution
  FROM event_session_feedback
  WHERE session_id = COALESCE(NEW.session_id, OLD.session_id);

  -- Upsert aggregate record
  INSERT INTO event_session_ratings_aggregate (session_id, average_rating, total_ratings, rating_distribution, updated_at)
  VALUES (COALESCE(NEW.session_id, OLD.session_id), v_avg, v_total, v_distribution, now())
  ON CONFLICT (session_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_ratings = EXCLUDED.total_ratings,
    rating_distribution = EXCLUDED.rating_distribution,
    updated_at = EXCLUDED.updated_at;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for aggregate updates
DROP TRIGGER IF EXISTS trigger_update_rating_aggregate_insert ON public.event_session_feedback;
CREATE TRIGGER trigger_update_rating_aggregate_insert
  AFTER INSERT ON public.event_session_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_session_rating_aggregate();

DROP TRIGGER IF EXISTS trigger_update_rating_aggregate_update ON public.event_session_feedback;
CREATE TRIGGER trigger_update_rating_aggregate_update
  AFTER UPDATE ON public.event_session_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_session_rating_aggregate();

DROP TRIGGER IF EXISTS trigger_update_rating_aggregate_delete ON public.event_session_feedback;
CREATE TRIGGER trigger_update_rating_aggregate_delete
  AFTER DELETE ON public.event_session_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_session_rating_aggregate();

-- Grant execute permissions
GRANT SELECT, INSERT, UPDATE ON public.event_session_feedback TO authenticated;
GRANT SELECT ON public.event_session_ratings_aggregate TO authenticated;