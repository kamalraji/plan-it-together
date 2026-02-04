-- Add delegation columns to workspace_checklists
ALTER TABLE public.workspace_checklists 
ADD COLUMN IF NOT EXISTS delegated_from_workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS delegated_by UUID,
ADD COLUMN IF NOT EXISTS delegated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delegation_status TEXT DEFAULT 'pending' CHECK (delegation_status IN ('pending', 'in_progress', 'completed', 'overdue'));

-- Create index for faster delegation queries
CREATE INDEX IF NOT EXISTS idx_workspace_checklists_delegated_from 
ON public.workspace_checklists(delegated_from_workspace_id) 
WHERE delegated_from_workspace_id IS NOT NULL;

-- Create index for due date queries
CREATE INDEX IF NOT EXISTS idx_workspace_checklists_due_date 
ON public.workspace_checklists(due_date) 
WHERE due_date IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.workspace_checklists.delegated_from_workspace_id IS 'Source workspace that delegated this checklist';
COMMENT ON COLUMN public.workspace_checklists.delegated_by IS 'User ID who delegated the checklist';
COMMENT ON COLUMN public.workspace_checklists.delegated_at IS 'Timestamp when the checklist was delegated';
COMMENT ON COLUMN public.workspace_checklists.due_date IS 'Due date for completing the delegated checklist';
COMMENT ON COLUMN public.workspace_checklists.delegation_status IS 'Status of the delegated checklist: pending, in_progress, completed, overdue';