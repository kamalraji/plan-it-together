-- =============================================
-- ZONE FEATURE DATABASE TABLES
-- =============================================

-- 1. EVENT CHECK-INS (Real-time Zone presence)
CREATE TABLE public.event_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  checkin_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checkout_time TIMESTAMPTZ,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id, checkin_date)
);

-- Indexes for event_checkins
CREATE INDEX idx_event_checkins_event ON public.event_checkins(event_id);
CREATE INDEX idx_event_checkins_user ON public.event_checkins(user_id);
CREATE INDEX idx_event_checkins_active ON public.event_checkins(event_id) 
  WHERE checkout_time IS NULL;

-- 2. EVENT POLLS
CREATE TABLE public.event_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_polls_event ON public.event_polls(event_id);
CREATE INDEX idx_event_polls_active ON public.event_polls(event_id, is_active) 
  WHERE is_active = TRUE;

-- 3. EVENT POLL OPTIONS
CREATE TABLE public.event_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.event_polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_poll_options_poll ON public.event_poll_options(poll_id);

-- 4. EVENT POLL VOTES
CREATE TABLE public.event_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.event_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.event_poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

CREATE INDEX idx_event_poll_votes_poll ON public.event_poll_votes(poll_id);
CREATE INDEX idx_event_poll_votes_user ON public.event_poll_votes(user_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Increment poll vote count
CREATE OR REPLACE FUNCTION public.increment_poll_vote(p_option_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.event_poll_options 
  SET vote_count = vote_count + 1 
  WHERE id = p_option_id;
END;
$$;

-- Decrement poll vote (for changing vote)
CREATE OR REPLACE FUNCTION public.decrement_poll_vote(p_option_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.event_poll_options 
  SET vote_count = GREATEST(vote_count - 1, 0)
  WHERE id = p_option_id;
END;
$$;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- event_checkins RLS
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view check-ins for registered events"
ON public.event_checkins FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM registrations r 
    WHERE r.event_id = event_checkins.event_id 
    AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own check-ins"
ON public.event_checkins FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own check-ins"
ON public.event_checkins FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own check-ins"
ON public.event_checkins FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- event_polls RLS
ALTER TABLE public.event_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event attendees can view polls"
ON public.event_polls FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM registrations r 
    WHERE r.event_id = event_polls.event_id 
    AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can manage polls"
ON public.event_polls FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    JOIN workspace_team_members wtm ON wtm.workspace_id = w.id
    WHERE w.event_id = event_polls.event_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
  )
);

-- event_poll_options RLS
ALTER TABLE public.event_poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view poll options"
ON public.event_poll_options FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "Poll creators can manage options"
ON public.event_poll_options FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM event_polls p 
    WHERE p.id = event_poll_options.poll_id 
    AND p.created_by = auth.uid()
  )
);

-- event_poll_votes RLS
ALTER TABLE public.event_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own votes"
ON public.event_poll_votes FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own votes"
ON public.event_poll_votes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());