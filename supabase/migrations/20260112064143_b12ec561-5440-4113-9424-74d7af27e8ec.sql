-- Add columns to track cross-workspace task assignments
ALTER TABLE workspace_tasks 
ADD COLUMN IF NOT EXISTS source_workspace_id uuid REFERENCES workspaces(id),
ADD COLUMN IF NOT EXISTS assigned_by uuid;

-- source_workspace_id: The workspace where the task was originally created (for cross-workspace tasks)
-- assigned_by: The user who assigned/created the task

-- Create index for efficient querying of cross-workspace tasks
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_source_workspace 
ON workspace_tasks(source_workspace_id) WHERE source_workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workspace_tasks_assigned_by 
ON workspace_tasks(assigned_by) WHERE assigned_by IS NOT NULL;

-- Add index on assigned_to for better query performance
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_assigned_to 
ON workspace_tasks(assigned_to) WHERE assigned_to IS NOT NULL;