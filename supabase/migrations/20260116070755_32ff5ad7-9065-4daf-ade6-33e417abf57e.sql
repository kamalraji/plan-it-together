-- Table: workspace_automation_rules
CREATE TABLE IF NOT EXISTS workspace_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}',
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}',
  conditions JSONB DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: automation_execution_logs
CREATE TABLE IF NOT EXISTS automation_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES workspace_automation_rules(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES workspace_tasks(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  action_taken TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Indexes for automation tables
CREATE INDEX IF NOT EXISTS idx_automation_rules_workspace ON workspace_automation_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON workspace_automation_rules(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule ON automation_execution_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_task ON automation_execution_logs(task_id);

-- Enable RLS
ALTER TABLE workspace_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_execution_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation rules
CREATE POLICY "Workspace members can view automation rules"
ON workspace_automation_rules FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wm
    WHERE wm.workspace_id = workspace_automation_rules.workspace_id
    AND wm.user_id = auth.uid()
  )
);

CREATE POLICY "Workspace admins can manage automation rules"
ON workspace_automation_rules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wm
    WHERE wm.workspace_id = workspace_automation_rules.workspace_id
    AND wm.user_id = auth.uid()
    AND wm.role IN ('EVENT_COORDINATOR', 'EXECUTIVE_DIRECTOR')
  )
);

CREATE POLICY "Workspace members can view execution logs"
ON automation_execution_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_automation_rules war
    JOIN workspace_team_members wm ON wm.workspace_id = war.workspace_id
    WHERE war.id = automation_execution_logs.rule_id
    AND wm.user_id = auth.uid()
  )
);

-- Add timer columns to workspace_time_entries
ALTER TABLE workspace_time_entries 
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_running BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_billable BOOLEAN NOT NULL DEFAULT false;

-- Index for finding active timers
CREATE INDEX IF NOT EXISTS idx_time_entries_running ON workspace_time_entries(user_id, is_running) 
WHERE is_running = true;

-- Trigger to update updated_at on automation rules
DROP TRIGGER IF EXISTS update_automation_rules_updated_at ON workspace_automation_rules;
CREATE TRIGGER update_automation_rules_updated_at
BEFORE UPDATE ON workspace_automation_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();