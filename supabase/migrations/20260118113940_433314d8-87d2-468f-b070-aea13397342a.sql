-- Create workspace_issues table for real-time issue tracking
CREATE TABLE public.workspace_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  
  -- Issue details
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  
  -- Classification
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT DEFAULT 'general' CHECK (category IN ('equipment', 'network', 'power', 'av', 'software', 'general')),
  
  -- Status tracking
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  
  -- Assignment
  reporter_id UUID,
  reporter_name TEXT,
  assignee_id UUID,
  assignee_name TEXT,
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by_id UUID,
  resolved_by_name TEXT,
  resolution_notes TEXT,
  
  -- Escalation
  escalated_to_incident BOOLEAN DEFAULT false,
  incident_id UUID REFERENCES public.workspace_incidents(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_workspace_issues_workspace ON public.workspace_issues(workspace_id);
CREATE INDEX idx_workspace_issues_status ON public.workspace_issues(status);
CREATE INDEX idx_workspace_issues_priority ON public.workspace_issues(priority);
CREATE INDEX idx_workspace_issues_category ON public.workspace_issues(category);
CREATE INDEX idx_workspace_issues_assignee ON public.workspace_issues(assignee_id);

-- Trigger for updated_at
CREATE TRIGGER set_workspace_issues_updated_at
  BEFORE UPDATE ON public.workspace_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.workspace_issues ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workspace team can view issues"
  ON public.workspace_issues
  FOR SELECT
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can create issues"
  ON public.workspace_issues
  FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can update issues"
  ON public.workspace_issues
  FOR UPDATE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace managers can delete issues"
  ON public.workspace_issues
  FOR DELETE
  USING (public.has_workspace_management_access(workspace_id, auth.uid()));