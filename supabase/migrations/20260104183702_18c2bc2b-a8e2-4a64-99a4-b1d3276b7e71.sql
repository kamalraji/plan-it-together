-- Workspace Budgets table
CREATE TABLE public.workspace_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  allocated NUMERIC(12,2) NOT NULL DEFAULT 0,
  used NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  fiscal_year TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, fiscal_year)
);

-- Workspace Budget Categories
CREATE TABLE public.workspace_budget_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.workspace_budgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  allocated NUMERIC(12,2) NOT NULL DEFAULT 0,
  used NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workspace Resources table
CREATE TABLE public.workspace_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('equipment', 'personnel', 'venue', 'digital')),
  quantity INTEGER NOT NULL DEFAULT 1,
  available INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'in_use', 'depleted')),
  assigned_to_workspace_id UUID REFERENCES public.workspaces(id),
  assigned_to_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workspace Milestones table
CREATE TABLE public.workspace_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workspace Goals (OKRs) table
CREATE TABLE public.workspace_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC(12,2),
  current_value NUMERIC(12,2) DEFAULT 0,
  unit TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'behind', 'achieved')),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workspace Checklists table (templates for committees)
CREATE TABLE public.workspace_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  committee_type TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workspace Budget Requests table (for approval workflow)
CREATE TABLE public.workspace_budget_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requesting_workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  target_workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  requested_amount NUMERIC(12,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID NOT NULL,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workspace Team Assignments (for workload tracking)
CREATE TABLE public.workspace_team_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.workspace_tasks(id) ON DELETE CASCADE,
  hours_allocated NUMERIC(5,2) DEFAULT 0,
  hours_logged NUMERIC(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.workspace_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_budget_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_team_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_budgets
CREATE POLICY "Users can view budgets for workspaces they belong to"
  ON public.workspace_budgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_budgets.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_budgets.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Workspace organizers can manage budgets"
  ON public.workspace_budgets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_budgets.workspace_id
      AND w.organizer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_budgets.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.role IN ('ADMIN', 'MANAGER')
      AND wtm.status = 'ACTIVE'
    )
  );

-- RLS Policies for workspace_budget_categories
CREATE POLICY "Users can view budget categories for their workspaces"
  ON public.workspace_budget_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_budgets wb
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = wb.workspace_id
      WHERE wb.id = workspace_budget_categories.budget_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
  );

CREATE POLICY "Managers can manage budget categories"
  ON public.workspace_budget_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_budgets wb
      JOIN public.workspaces w ON w.id = wb.workspace_id
      WHERE wb.id = workspace_budget_categories.budget_id
      AND w.organizer_id = auth.uid()
    )
  );

-- RLS Policies for workspace_resources
CREATE POLICY "Users can view resources for their workspaces"
  ON public.workspace_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_resources.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_resources.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage resources"
  ON public.workspace_resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_resources.workspace_id
      AND w.organizer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_resources.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.role IN ('ADMIN', 'MANAGER')
      AND wtm.status = 'ACTIVE'
    )
  );

-- RLS Policies for workspace_milestones
CREATE POLICY "Users can view milestones for their workspaces"
  ON public.workspace_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_milestones.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_milestones.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team members can manage milestones"
  ON public.workspace_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_milestones.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_milestones.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

-- RLS Policies for workspace_goals
CREATE POLICY "Users can view goals for their workspaces"
  ON public.workspace_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_goals.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_goals.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team members can manage goals"
  ON public.workspace_goals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_goals.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_goals.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

-- RLS Policies for workspace_checklists
CREATE POLICY "Users can view checklists for their workspaces"
  ON public.workspace_checklists FOR SELECT
  USING (
    is_template = true
    OR EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_checklists.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_checklists.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team members can manage checklists"
  ON public.workspace_checklists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_checklists.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_checklists.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

-- RLS Policies for workspace_budget_requests
CREATE POLICY "Users can view budget requests for their workspaces"
  ON public.workspace_budget_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE (wtm.workspace_id = workspace_budget_requests.requesting_workspace_id
             OR wtm.workspace_id = workspace_budget_requests.target_workspace_id)
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE (w.id = workspace_budget_requests.requesting_workspace_id
             OR w.id = workspace_budget_requests.target_workspace_id)
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create budget requests"
  ON public.workspace_budget_requests FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_budget_requests.requesting_workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
  );

CREATE POLICY "Target workspace managers can update budget requests"
  ON public.workspace_budget_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_budget_requests.target_workspace_id
      AND w.organizer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_budget_requests.target_workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.role IN ('ADMIN', 'MANAGER')
      AND wtm.status = 'ACTIVE'
    )
  );

-- RLS Policies for workspace_team_assignments
CREATE POLICY "Users can view assignments for their workspaces"
  ON public.workspace_team_assignments FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_team_assignments.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
  );

CREATE POLICY "Managers can manage assignments"
  ON public.workspace_team_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_team_assignments.workspace_id
      AND w.organizer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_team_assignments.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.role IN ('ADMIN', 'MANAGER')
      AND wtm.status = 'ACTIVE'
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_workspace_budgets_updated_at
  BEFORE UPDATE ON public.workspace_budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_resources_updated_at
  BEFORE UPDATE ON public.workspace_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_milestones_updated_at
  BEFORE UPDATE ON public.workspace_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_goals_updated_at
  BEFORE UPDATE ON public.workspace_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_checklists_updated_at
  BEFORE UPDATE ON public.workspace_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_budget_requests_updated_at
  BEFORE UPDATE ON public.workspace_budget_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_team_assignments_updated_at
  BEFORE UPDATE ON public.workspace_team_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_workspace_budgets_workspace ON public.workspace_budgets(workspace_id);
CREATE INDEX idx_workspace_resources_workspace ON public.workspace_resources(workspace_id);
CREATE INDEX idx_workspace_resources_type ON public.workspace_resources(type);
CREATE INDEX idx_workspace_milestones_workspace ON public.workspace_milestones(workspace_id);
CREATE INDEX idx_workspace_milestones_status ON public.workspace_milestones(status);
CREATE INDEX idx_workspace_goals_workspace ON public.workspace_goals(workspace_id);
CREATE INDEX idx_workspace_checklists_workspace ON public.workspace_checklists(workspace_id);
CREATE INDEX idx_workspace_budget_requests_requesting ON public.workspace_budget_requests(requesting_workspace_id);
CREATE INDEX idx_workspace_budget_requests_target ON public.workspace_budget_requests(target_workspace_id);
CREATE INDEX idx_workspace_budget_requests_status ON public.workspace_budget_requests(status);
CREATE INDEX idx_workspace_team_assignments_workspace ON public.workspace_team_assignments(workspace_id);
CREATE INDEX idx_workspace_team_assignments_user ON public.workspace_team_assignments(user_id);