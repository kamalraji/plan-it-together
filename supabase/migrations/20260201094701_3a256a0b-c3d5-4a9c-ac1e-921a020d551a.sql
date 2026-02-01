-- Create scheduled_reports table for report scheduling
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('tasks', 'budget', 'team', 'activity', 'comprehensive')),
  format TEXT NOT NULL CHECK (format IN ('csv', 'json', 'pdf')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  include_children BOOLEAN DEFAULT false,
  recipients TEXT[] DEFAULT '{}',
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workspace_presence table for online status tracking
CREATE TABLE IF NOT EXISTS public.workspace_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_activity TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- Create escalation_history table for audit trail
CREATE TABLE IF NOT EXISTS public.escalation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('task', 'budget_request', 'approval', 'incident')),
  item_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  escalated_from UUID,
  escalated_to UUID,
  escalation_level INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  sla_status TEXT CHECK (sla_status IN ('within_sla', 'near_breach', 'breached')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add missing columns to escalation_rules table
ALTER TABLE public.escalation_rules 
  ADD COLUMN IF NOT EXISTS sla_hours INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS notification_channels TEXT[] DEFAULT ARRAY['in_app', 'email'],
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS escalation_path UUID[],
  ADD COLUMN IF NOT EXISTS auto_reassign BOOLEAN DEFAULT false;

-- Add capacity tracking to workspace_team_members
ALTER TABLE public.workspace_team_members
  ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS capacity_hours NUMERIC(5,2) DEFAULT 40,
  ADD COLUMN IF NOT EXISTS current_workload_hours NUMERIC(5,2) DEFAULT 0;

-- Add time tracking to workspace_tasks
ALTER TABLE public.workspace_tasks
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS actual_hours_logged NUMERIC(6,2) DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_workspace ON public.scheduled_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON public.scheduled_reports(next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workspace_presence_user ON public.workspace_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_presence_workspace ON public.workspace_presence(workspace_id);
CREATE INDEX IF NOT EXISTS idx_escalation_history_item ON public.escalation_history(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_escalation_history_workspace ON public.escalation_history(workspace_id);

-- Enable RLS on new tables
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_reports
CREATE POLICY "Users can view reports in their workspaces"
  ON public.scheduled_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = scheduled_reports.workspace_id
        AND wtm.user_id = auth.uid()
        AND wtm.status = 'ACTIVE'
    )
  );

CREATE POLICY "Managers can create reports"
  ON public.scheduled_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = scheduled_reports.workspace_id
        AND wtm.user_id = auth.uid()
        AND wtm.role IN ('OWNER', 'ADMIN', 'MANAGER', 'LEAD')
        AND wtm.status = 'ACTIVE'
    )
  );

CREATE POLICY "Creators can update their reports"
  ON public.scheduled_reports FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their reports"
  ON public.scheduled_reports FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for workspace_presence
CREATE POLICY "Users can view presence in their workspaces"
  ON public.workspace_presence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_presence.workspace_id
        AND wtm.user_id = auth.uid()
        AND wtm.status = 'ACTIVE'
    )
  );

CREATE POLICY "Users can update their own presence"
  ON public.workspace_presence FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can modify their own presence"
  ON public.workspace_presence FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can remove their own presence"
  ON public.workspace_presence FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for escalation_history
CREATE POLICY "Users can view escalations in their workspaces"
  ON public.escalation_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = escalation_history.workspace_id
        AND wtm.user_id = auth.uid()
        AND wtm.status = 'ACTIVE'
    )
  );

-- Only admins can create escalation history
CREATE POLICY "Admins can create escalation history"
  ON public.escalation_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = escalation_history.workspace_id
        AND wtm.user_id = auth.uid()
        AND wtm.role IN ('OWNER', 'ADMIN')
        AND wtm.status = 'ACTIVE'
    )
  );

-- Update timestamp trigger for new tables
CREATE TRIGGER update_scheduled_reports_updated_at
  BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_presence_updated_at
  BEFORE UPDATE ON public.workspace_presence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();