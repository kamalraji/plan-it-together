-- =====================================================
-- Gantt Chart & Recurring Tasks Migration
-- =====================================================

-- 1. Add Gantt-specific fields to workspace_tasks
ALTER TABLE workspace_tasks 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_milestone BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS gantt_row_order INTEGER;

-- Add recurring task reference columns to workspace_tasks
ALTER TABLE workspace_tasks
ADD COLUMN IF NOT EXISTS recurring_task_id UUID,
ADD COLUMN IF NOT EXISTS occurrence_number INTEGER;

-- 2. Create recurring tasks table
CREATE TABLE IF NOT EXISTS workspace_recurring_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  category TEXT,
  role_scope TEXT,
  assigned_to UUID,
  
  -- Recurrence configuration
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'custom')),
  recurrence_config JSONB NOT NULL DEFAULT '{}',
  
  -- Template for created tasks
  template_data JSONB NOT NULL DEFAULT '{}',
  
  -- Scheduling
  next_occurrence TIMESTAMPTZ NOT NULL,
  last_created_at TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  occurrence_count INTEGER DEFAULT 0,
  max_occurrences INTEGER,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key for recurring_task_id
ALTER TABLE workspace_tasks
ADD CONSTRAINT fk_recurring_task 
FOREIGN KEY (recurring_task_id) 
REFERENCES workspace_recurring_tasks(id) 
ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_workspace 
ON workspace_recurring_tasks(workspace_id);

CREATE INDEX IF NOT EXISTS idx_recurring_tasks_next 
ON workspace_recurring_tasks(next_occurrence) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tasks_gantt_order 
ON workspace_tasks(workspace_id, gantt_row_order);

CREATE INDEX IF NOT EXISTS idx_tasks_recurring 
ON workspace_tasks(recurring_task_id) 
WHERE recurring_task_id IS NOT NULL;

-- Enable RLS
ALTER TABLE workspace_recurring_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring tasks (using workspace_team_members)
CREATE POLICY "Users can view recurring tasks in their workspaces"
ON workspace_recurring_tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_recurring_tasks.workspace_id
    AND wtm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create recurring tasks in their workspaces"
ON workspace_recurring_tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_recurring_tasks.workspace_id
    AND wtm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update recurring tasks in their workspaces"
ON workspace_recurring_tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_recurring_tasks.workspace_id
    AND wtm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete recurring tasks in their workspaces"
ON workspace_recurring_tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_recurring_tasks.workspace_id
    AND wtm.user_id = auth.uid()
  )
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_recurring_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_recurring_tasks_timestamp ON workspace_recurring_tasks;
CREATE TRIGGER update_recurring_tasks_timestamp
BEFORE UPDATE ON workspace_recurring_tasks
FOR EACH ROW
EXECUTE FUNCTION update_recurring_tasks_updated_at();