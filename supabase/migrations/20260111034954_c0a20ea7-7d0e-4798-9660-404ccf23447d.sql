-- Create workspace_judges table for managing judges per workspace
CREATE TABLE public.workspace_judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id),
  judge_name TEXT NOT NULL,
  judge_email TEXT,
  expertise TEXT,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'invited',
  availability JSONB,
  assigned_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  notes TEXT,
  invited_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create workspace_rubrics table for scoring criteria
CREATE TABLE public.workspace_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'overall',
  criteria JSONB NOT NULL DEFAULT '[]',
  max_total_score INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create workspace_submissions table for projects to be judged
CREATE TABLE public.workspace_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id),
  team_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  demo_url TEXT,
  repo_url TEXT,
  presentation_url TEXT,
  table_number TEXT,
  track TEXT,
  submitted_by UUID,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create workspace_judge_assignments table for linking judges to submissions
CREATE TABLE public.workspace_judge_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES public.workspace_judges(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.workspace_submissions(id) ON DELETE CASCADE,
  rubric_id UUID REFERENCES public.workspace_rubrics(id),
  status TEXT DEFAULT 'assigned',
  priority INTEGER DEFAULT 0,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(judge_id, submission_id)
);

-- Create workspace_scores table for storing judge scores
CREATE TABLE public.workspace_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.workspace_judge_assignments(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES public.workspace_judges(id),
  submission_id UUID NOT NULL REFERENCES public.workspace_submissions(id),
  rubric_id UUID REFERENCES public.workspace_rubrics(id),
  scores JSONB NOT NULL DEFAULT '{}',
  total_score DECIMAL(10,2),
  weighted_score DECIMAL(10,2),
  comments TEXT,
  private_notes TEXT,
  is_finalist_vote BOOLEAN DEFAULT false,
  scored_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(judge_id, submission_id, rubric_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.workspace_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_judge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workspace_judges
CREATE POLICY "Workspace members can view judges"
  ON public.workspace_judges FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can manage judges"
  ON public.workspace_judges FOR ALL
  USING (public.has_workspace_access(workspace_id));

-- Create RLS policies for workspace_rubrics
CREATE POLICY "Workspace members can view rubrics"
  ON public.workspace_rubrics FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can manage rubrics"
  ON public.workspace_rubrics FOR ALL
  USING (public.has_workspace_access(workspace_id));

-- Create RLS policies for workspace_submissions
CREATE POLICY "Workspace members can view submissions"
  ON public.workspace_submissions FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can manage submissions"
  ON public.workspace_submissions FOR ALL
  USING (public.has_workspace_access(workspace_id));

-- Create RLS policies for workspace_judge_assignments
CREATE POLICY "Workspace members can view assignments"
  ON public.workspace_judge_assignments FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can manage assignments"
  ON public.workspace_judge_assignments FOR ALL
  USING (public.has_workspace_access(workspace_id));

-- Create RLS policies for workspace_scores
CREATE POLICY "Workspace members can view scores"
  ON public.workspace_scores FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can manage scores"
  ON public.workspace_scores FOR ALL
  USING (public.has_workspace_access(workspace_id));

-- Create indexes for performance
CREATE INDEX idx_workspace_judges_workspace ON public.workspace_judges(workspace_id);
CREATE INDEX idx_workspace_rubrics_workspace ON public.workspace_rubrics(workspace_id);
CREATE INDEX idx_workspace_submissions_workspace ON public.workspace_submissions(workspace_id);
CREATE INDEX idx_workspace_judge_assignments_workspace ON public.workspace_judge_assignments(workspace_id);
CREATE INDEX idx_workspace_judge_assignments_judge ON public.workspace_judge_assignments(judge_id);
CREATE INDEX idx_workspace_judge_assignments_submission ON public.workspace_judge_assignments(submission_id);
CREATE INDEX idx_workspace_scores_workspace ON public.workspace_scores(workspace_id);
CREATE INDEX idx_workspace_scores_submission ON public.workspace_scores(submission_id);

-- Create updated_at triggers
CREATE TRIGGER set_workspace_judges_updated_at
  BEFORE UPDATE ON public.workspace_judges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_workspace_rubrics_updated_at
  BEFORE UPDATE ON public.workspace_rubrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_workspace_submissions_updated_at
  BEFORE UPDATE ON public.workspace_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_workspace_scores_updated_at
  BEFORE UPDATE ON public.workspace_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();