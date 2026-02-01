-- Task Approval Policies - Configurable approval rules per workspace
CREATE TABLE public.task_approval_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- Matching criteria (which tasks need approval)
  applies_to_categories TEXT[],
  applies_to_priorities TEXT[],
  applies_to_role_scopes TEXT[],
  min_estimated_hours NUMERIC,
  is_default BOOLEAN DEFAULT false,
  -- Approval chain configuration (JSONB array of approval levels)
  approval_chain JSONB NOT NULL DEFAULT '[]',
  require_all_levels BOOLEAN DEFAULT true,
  allow_self_approval BOOLEAN DEFAULT false,
  auto_approve_after_hours INTEGER,
  is_enabled BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task Approval Requests - Individual approval requests for tasks
CREATE TABLE public.task_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.workspace_tasks(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES public.task_approval_policies(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_level INTEGER NOT NULL DEFAULT 1,
  overall_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (overall_status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED')),
  completed_at TIMESTAMPTZ,
  final_decision_by UUID,
  final_decision_notes TEXT,
  original_status TEXT NOT NULL,
  target_status TEXT NOT NULL DEFAULT 'COMPLETED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task Approval Decisions - Individual approver decisions within a request
CREATE TABLE public.task_approval_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.task_approval_requests(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL,
  approver_role TEXT NOT NULL,
  level INTEGER NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED', 'DELEGATED')),
  notes TEXT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delegated_to UUID,
  delegated_reason TEXT
);

-- Add approval-related columns to workspace_tasks
ALTER TABLE public.workspace_tasks
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_policy_id UUID REFERENCES public.task_approval_policies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'NONE' CHECK (approval_status IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED'));

-- Create indexes for performance
CREATE INDEX idx_task_approval_policies_workspace ON public.task_approval_policies(workspace_id);
CREATE INDEX idx_task_approval_policies_enabled ON public.task_approval_policies(workspace_id, is_enabled);
CREATE INDEX idx_task_approval_requests_task ON public.task_approval_requests(task_id);
CREATE INDEX idx_task_approval_requests_status ON public.task_approval_requests(overall_status);
CREATE INDEX idx_task_approval_requests_requested_by ON public.task_approval_requests(requested_by);
CREATE INDEX idx_task_approval_decisions_request ON public.task_approval_decisions(request_id);
CREATE INDEX idx_task_approval_decisions_approver ON public.task_approval_decisions(approver_id);
CREATE INDEX idx_workspace_tasks_approval ON public.workspace_tasks(approval_status) WHERE approval_status != 'NONE';

-- Enable RLS
ALTER TABLE public.task_approval_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_approval_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_approval_policies
CREATE POLICY "Users can view approval policies in their workspaces"
ON public.task_approval_policies FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace owners and managers can create approval policies"
ON public.task_approval_policies FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace owners and managers can update approval policies"
ON public.task_approval_policies FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace owners and managers can delete approval policies"
ON public.task_approval_policies FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- RLS Policies for task_approval_requests
CREATE POLICY "Users can view approval requests in their workspaces"
ON public.task_approval_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_tasks t
    WHERE t.id = task_id AND public.has_workspace_access(t.workspace_id)
  )
);

CREATE POLICY "Users can create approval requests for tasks they have access to"
ON public.task_approval_requests FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_tasks t
    WHERE t.id = task_id AND public.has_workspace_access(t.workspace_id)
  )
);

CREATE POLICY "Users can update approval requests they have access to"
ON public.task_approval_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_tasks t
    WHERE t.id = task_id AND public.has_workspace_access(t.workspace_id)
  )
);

-- RLS Policies for task_approval_decisions
CREATE POLICY "Users can view approval decisions for requests they can see"
ON public.task_approval_decisions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.task_approval_requests r
    JOIN public.workspace_tasks t ON t.id = r.task_id
    WHERE r.id = request_id AND public.has_workspace_access(t.workspace_id)
  )
);

CREATE POLICY "Users can create approval decisions"
ON public.task_approval_decisions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.task_approval_requests r
    JOIN public.workspace_tasks t ON t.id = r.task_id
    WHERE r.id = request_id AND public.has_workspace_access(t.workspace_id)
  )
);

-- Function to update updated_at on task_approval_policies
CREATE TRIGGER update_task_approval_policies_updated_at
BEFORE UPDATE ON public.task_approval_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update updated_at on task_approval_requests
CREATE TRIGGER update_task_approval_requests_updated_at
BEFORE UPDATE ON public.task_approval_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();