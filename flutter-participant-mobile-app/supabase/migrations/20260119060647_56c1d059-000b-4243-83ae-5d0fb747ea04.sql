-- =============================================
-- HACKATHON ZONE TABLES
-- =============================================

-- Hackathon Teams Table
CREATE TABLE public.hackathon_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  project_idea TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  looking_for_roles TEXT[] DEFAULT '{}',
  is_looking_for_members BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 5,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hackathon Team Members
CREATE TABLE public.hackathon_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  skills TEXT[] DEFAULT '{}',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Mentor Slots for Hackathons
CREATE TABLE public.mentor_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL,
  mentor_name TEXT NOT NULL,
  mentor_avatar TEXT,
  expertise TEXT[] DEFAULT '{}',
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  meeting_link TEXT,
  booked_by_team_id UUID REFERENCES public.hackathon_teams(id) ON DELETE SET NULL,
  booked_at TIMESTAMPTZ,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hackathon Submissions
CREATE TABLE public.hackathon_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.hackathon_teams(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT,
  demo_url TEXT,
  repo_url TEXT,
  presentation_url TEXT,
  video_url TEXT,
  screenshots TEXT[] DEFAULT '{}',
  tech_stack TEXT[] DEFAULT '{}',
  track TEXT,
  submitted_at TIMESTAMPTZ,
  is_draft BOOLEAN DEFAULT true,
  judging_status TEXT DEFAULT 'pending' CHECK (judging_status IN ('pending', 'in_review', 'reviewed', 'finalist', 'winner')),
  score NUMERIC,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, team_id)
);

-- Submission Deadlines
CREATE TABLE public.hackathon_deadlines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  deadline_type TEXT NOT NULL CHECK (deadline_type IN ('team_formation', 'idea_submission', 'checkpoint', 'final_submission', 'judging', 'results')),
  deadline_at TIMESTAMPTZ NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hackathon_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_deadlines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hackathon_teams
CREATE POLICY "Registered users can view teams for their events"
ON public.hackathon_teams FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.event_id = hackathon_teams.event_id
    AND r.user_id = auth.uid()
    AND r.status = 'CONFIRMED'
  )
  OR EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    JOIN workspaces w ON w.id = wtm.workspace_id
    WHERE w.event_id = hackathon_teams.event_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
  )
);

CREATE POLICY "Registered users can create teams"
ON public.hackathon_teams FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.event_id = hackathon_teams.event_id
    AND r.user_id = auth.uid()
    AND r.status = 'CONFIRMED'
  )
);

CREATE POLICY "Team creator can update their team"
ON public.hackathon_teams FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Team creator can delete their team"
ON public.hackathon_teams FOR DELETE
USING (created_by = auth.uid());

-- RLS Policies for hackathon_team_members
CREATE POLICY "Users can view team members"
ON public.hackathon_team_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM hackathon_teams ht
    JOIN registrations r ON r.event_id = ht.event_id
    WHERE ht.id = hackathon_team_members.team_id
    AND r.user_id = auth.uid()
    AND r.status = 'CONFIRMED'
  )
);

CREATE POLICY "Team members can join teams"
ON public.hackathon_team_members FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave teams"
ON public.hackathon_team_members FOR DELETE
USING (user_id = auth.uid());

-- RLS Policies for mentor_slots
CREATE POLICY "Registered users can view mentor slots"
ON public.mentor_slots FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.event_id = mentor_slots.event_id
    AND r.user_id = auth.uid()
    AND r.status = 'CONFIRMED'
  )
  OR mentor_id = auth.uid()
);

CREATE POLICY "Teams can book available slots"
ON public.mentor_slots FOR UPDATE
USING (
  status = 'available'
  OR EXISTS (
    SELECT 1 FROM hackathon_team_members htm
    JOIN hackathon_teams ht ON ht.id = htm.team_id
    WHERE ht.id = mentor_slots.booked_by_team_id
    AND htm.user_id = auth.uid()
  )
);

-- RLS Policies for hackathon_submissions
CREATE POLICY "Users can view submissions for their events"
ON public.hackathon_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.event_id = hackathon_submissions.event_id
    AND r.user_id = auth.uid()
    AND r.status = 'CONFIRMED'
  )
);

CREATE POLICY "Team members can manage their submission"
ON public.hackathon_submissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM hackathon_team_members htm
    WHERE htm.team_id = hackathon_submissions.team_id
    AND htm.user_id = auth.uid()
  )
);

-- RLS Policies for hackathon_deadlines
CREATE POLICY "Anyone can view deadlines for public events"
ON public.hackathon_deadlines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = hackathon_deadlines.event_id
    AND (e.visibility = 'PUBLIC' OR EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.event_id = e.id AND r.user_id = auth.uid()
    ))
  )
);

-- Indexes for performance
CREATE INDEX idx_hackathon_teams_event ON public.hackathon_teams(event_id);
CREATE INDEX idx_hackathon_teams_looking ON public.hackathon_teams(event_id, is_looking_for_members) WHERE is_looking_for_members = true;
CREATE INDEX idx_hackathon_team_members_team ON public.hackathon_team_members(team_id);
CREATE INDEX idx_hackathon_team_members_user ON public.hackathon_team_members(user_id);
CREATE INDEX idx_mentor_slots_event ON public.mentor_slots(event_id, status);
CREATE INDEX idx_mentor_slots_available ON public.mentor_slots(event_id, slot_start) WHERE status = 'available';
CREATE INDEX idx_hackathon_submissions_event ON public.hackathon_submissions(event_id);
CREATE INDEX idx_hackathon_submissions_team ON public.hackathon_submissions(team_id);
CREATE INDEX idx_hackathon_deadlines_event ON public.hackathon_deadlines(event_id, deadline_at);

-- Triggers for updated_at
CREATE TRIGGER update_hackathon_teams_updated_at
  BEFORE UPDATE ON public.hackathon_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hackathon_submissions_updated_at
  BEFORE UPDATE ON public.hackathon_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to count team members
CREATE OR REPLACE FUNCTION public.get_team_member_count(p_team_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::INTEGER FROM hackathon_team_members WHERE team_id = p_team_id;
$$;