-- Add parent_task_id to link child tasks to their parent task
ALTER TABLE workspace_tasks 
ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES workspace_tasks(id) ON DELETE SET NULL;

-- Create index for parent task lookups
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_parent_task 
ON workspace_tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- Function to sync status from child task to siblings and notify parent
CREATE OR REPLACE FUNCTION sync_linked_task_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a child task status changes, sync to all sibling linked tasks
  IF NEW.parent_task_id IS NOT NULL AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Update all sibling tasks (same parent) to have the same status
    UPDATE workspace_tasks
    SET status = NEW.status,
        updated_at = NOW()
    WHERE parent_task_id = NEW.parent_task_id
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for status sync on child tasks
DROP TRIGGER IF EXISTS trigger_sync_linked_task_status ON workspace_tasks;
CREATE TRIGGER trigger_sync_linked_task_status
  AFTER UPDATE OF status ON workspace_tasks
  FOR EACH ROW
  WHEN (NEW.parent_task_id IS NOT NULL)
  EXECUTE FUNCTION sync_linked_task_status();

-- Function to propagate status from parent to all children
CREATE OR REPLACE FUNCTION propagate_parent_task_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a parent task (one that has children) status changes, sync to all children
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE workspace_tasks
    SET status = NEW.status,
        updated_at = NOW()
    WHERE parent_task_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for status propagation from parent to children
DROP TRIGGER IF EXISTS trigger_propagate_parent_task_status ON workspace_tasks;
CREATE TRIGGER trigger_propagate_parent_task_status
  AFTER UPDATE OF status ON workspace_tasks
  FOR EACH ROW
  WHEN (NEW.parent_task_id IS NULL)
  EXECUTE FUNCTION propagate_parent_task_status();