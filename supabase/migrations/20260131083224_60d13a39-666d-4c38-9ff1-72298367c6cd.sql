-- Phase 1: Create missing tables for industrial-standard workspace features

-- ========================================
-- 1. volunteer_time_logs table
-- For tracking volunteer check-ins and timesheet approvals
-- ========================================
CREATE TABLE public.volunteer_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  volunteer_id UUID NOT NULL,
  shift_id UUID REFERENCES public.workspace_tasks(id) ON DELETE SET NULL,
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  hours_logged DECIMAL(5,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for common queries
CREATE INDEX idx_volunteer_time_logs_workspace ON public.volunteer_time_logs(workspace_id);
CREATE INDEX idx_volunteer_time_logs_volunteer ON public.volunteer_time_logs(volunteer_id);
CREATE INDEX idx_volunteer_time_logs_status ON public.volunteer_time_logs(status);
CREATE INDEX idx_volunteer_time_logs_event ON public.volunteer_time_logs(event_id);

-- Enable RLS
ALTER TABLE public.volunteer_time_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for volunteer_time_logs
CREATE POLICY "Users can view their own time logs"
ON public.volunteer_time_logs FOR SELECT
USING (volunteer_id = auth.uid());

CREATE POLICY "Workspace members can view time logs"
ON public.volunteer_time_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members
    WHERE workspace_id = volunteer_time_logs.workspace_id
    AND user_id = auth.uid()
    AND status = 'ACTIVE'
  )
);

CREATE POLICY "Users can create their own time logs"
ON public.volunteer_time_logs FOR INSERT
WITH CHECK (volunteer_id = auth.uid());

CREATE POLICY "Managers can update time logs"
ON public.volunteer_time_logs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members
    WHERE workspace_id = volunteer_time_logs.workspace_id
    AND user_id = auth.uid()
    AND role IN ('MANAGER', 'LEAD', 'OWNER', 'ADMIN')
    AND status = 'ACTIVE'
  )
);

-- Trigger for auto-calculating hours
CREATE OR REPLACE FUNCTION public.calculate_volunteer_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
    NEW.hours_logged := ROUND(EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600, 2);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER calculate_hours_on_checkout
BEFORE INSERT OR UPDATE ON public.volunteer_time_logs
FOR EACH ROW
EXECUTE FUNCTION public.calculate_volunteer_hours();

-- ========================================
-- 2. escalation_rules table
-- For configurable escalation workflows
-- ========================================
CREATE TABLE public.escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('task', 'approval', 'issue', 'ticket')),
  trigger_after_hours INTEGER NOT NULL DEFAULT 24,
  escalate_to TEXT NOT NULL DEFAULT 'parent_workspace' CHECK (escalate_to IN ('parent_workspace', 'department', 'root')),
  notify_roles TEXT[] DEFAULT ARRAY['MANAGER'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for common queries
CREATE INDEX idx_escalation_rules_workspace ON public.escalation_rules(workspace_id);
CREATE INDEX idx_escalation_rules_active ON public.escalation_rules(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for escalation_rules
CREATE POLICY "Workspace members can view escalation rules"
ON public.escalation_rules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members
    WHERE workspace_id = escalation_rules.workspace_id
    AND user_id = auth.uid()
    AND status = 'ACTIVE'
  )
);

CREATE POLICY "Managers can manage escalation rules"
ON public.escalation_rules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members
    WHERE workspace_id = escalation_rules.workspace_id
    AND user_id = auth.uid()
    AND role IN ('MANAGER', 'LEAD', 'OWNER', 'ADMIN')
    AND status = 'ACTIVE'
  )
);

-- ========================================
-- 3. workspace_template_ratings table
-- For rating and reviewing workspace templates
-- ========================================
CREATE TABLE public.workspace_template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.workspace_custom_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, user_id)
);

-- Index for common queries
CREATE INDEX idx_template_ratings_template ON public.workspace_template_ratings(template_id);
CREATE INDEX idx_template_ratings_user ON public.workspace_template_ratings(user_id);

-- Enable RLS
ALTER TABLE public.workspace_template_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_template_ratings
CREATE POLICY "Anyone can view template ratings"
ON public.workspace_template_ratings FOR SELECT
USING (true);

CREATE POLICY "Users can rate templates"
ON public.workspace_template_ratings FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own ratings"
ON public.workspace_template_ratings FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own ratings"
ON public.workspace_template_ratings FOR DELETE
USING (user_id = auth.uid());

-- ========================================
-- 4. volunteer_training_progress table
-- For tracking volunteer training completions
-- ========================================
CREATE TABLE public.volunteer_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL,
  module_id UUID NOT NULL,
  module_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  completed_at TIMESTAMPTZ,
  score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, volunteer_id, module_id)
);

-- Index for common queries
CREATE INDEX idx_volunteer_training_workspace ON public.volunteer_training_progress(workspace_id);
CREATE INDEX idx_volunteer_training_volunteer ON public.volunteer_training_progress(volunteer_id);
CREATE INDEX idx_volunteer_training_status ON public.volunteer_training_progress(status);

-- Enable RLS
ALTER TABLE public.volunteer_training_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own training progress"
ON public.volunteer_training_progress FOR SELECT
USING (volunteer_id = auth.uid());

CREATE POLICY "Workspace members can view training progress"
ON public.volunteer_training_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members
    WHERE workspace_id = volunteer_training_progress.workspace_id
    AND user_id = auth.uid()
    AND status = 'ACTIVE'
  )
);

CREATE POLICY "Users can update their own training progress"
ON public.volunteer_training_progress FOR INSERT
WITH CHECK (volunteer_id = auth.uid());

CREATE POLICY "Users can modify their own training progress"
ON public.volunteer_training_progress FOR UPDATE
USING (volunteer_id = auth.uid());

-- ========================================
-- 5. volunteer_recognitions table
-- For tracking volunteer awards and recognition
-- ========================================
CREATE TABLE public.volunteer_recognitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL,
  recognition_type TEXT NOT NULL CHECK (recognition_type IN ('award', 'badge', 'shoutout', 'milestone')),
  title TEXT NOT NULL,
  description TEXT,
  awarded_by UUID,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for common queries
CREATE INDEX idx_volunteer_recognitions_workspace ON public.volunteer_recognitions(workspace_id);
CREATE INDEX idx_volunteer_recognitions_volunteer ON public.volunteer_recognitions(volunteer_id);
CREATE INDEX idx_volunteer_recognitions_type ON public.volunteer_recognitions(recognition_type);

-- Enable RLS
ALTER TABLE public.volunteer_recognitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own recognitions"
ON public.volunteer_recognitions FOR SELECT
USING (volunteer_id = auth.uid());

CREATE POLICY "Workspace members can view recognitions"
ON public.volunteer_recognitions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members
    WHERE workspace_id = volunteer_recognitions.workspace_id
    AND user_id = auth.uid()
    AND status = 'ACTIVE'
  )
);

CREATE POLICY "Managers can create recognitions"
ON public.volunteer_recognitions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members
    WHERE workspace_id = volunteer_recognitions.workspace_id
    AND user_id = auth.uid()
    AND role IN ('MANAGER', 'LEAD', 'OWNER', 'ADMIN')
    AND status = 'ACTIVE'
  )
);

-- ========================================
-- 6. volunteer_applications table
-- For tracking volunteer recruitment applications
-- ========================================
CREATE TABLE public.volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  applicant_id UUID,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  role_applied TEXT NOT NULL,
  experience TEXT,
  availability JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'waitlisted')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for common queries
CREATE INDEX idx_volunteer_applications_workspace ON public.volunteer_applications(workspace_id);
CREATE INDEX idx_volunteer_applications_status ON public.volunteer_applications(status);
CREATE INDEX idx_volunteer_applications_email ON public.volunteer_applications(applicant_email);

-- Enable RLS
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workspace members can view applications"
ON public.volunteer_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members
    WHERE workspace_id = volunteer_applications.workspace_id
    AND user_id = auth.uid()
    AND status = 'ACTIVE'
  )
);

CREATE POLICY "Anyone can submit applications"
ON public.volunteer_applications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Managers can update applications"
ON public.volunteer_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members
    WHERE workspace_id = volunteer_applications.workspace_id
    AND user_id = auth.uid()
    AND role IN ('MANAGER', 'LEAD', 'OWNER', 'ADMIN')
    AND status = 'ACTIVE'
  )
);