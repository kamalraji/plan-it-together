-- Add workspace_type and department_id columns to workspaces table
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS workspace_type TEXT,
ADD COLUMN IF NOT EXISTS department_id TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_workspaces_workspace_type ON public.workspaces(workspace_type);
CREATE INDEX IF NOT EXISTS idx_workspaces_department_id ON public.workspaces(department_id);

-- Backfill workspace_type based on depth calculation
-- Level 1: ROOT (no parent)
-- Level 2: DEPARTMENT (parent has no parent)
-- Level 3: COMMITTEE (grandparent has no parent)
-- Level 4: TEAM (great-grandparent has no parent)

-- First, set ROOT level workspaces (no parent)
UPDATE public.workspaces 
SET workspace_type = 'ROOT'
WHERE parent_workspace_id IS NULL AND workspace_type IS NULL;

-- Set DEPARTMENT level (parent is ROOT)
UPDATE public.workspaces w
SET workspace_type = 'DEPARTMENT'
WHERE parent_workspace_id IS NOT NULL 
  AND workspace_type IS NULL
  AND EXISTS (
    SELECT 1 FROM public.workspaces p 
    WHERE p.id = w.parent_workspace_id 
    AND p.parent_workspace_id IS NULL
  );

-- Set COMMITTEE level (grandparent is ROOT)
UPDATE public.workspaces w
SET workspace_type = 'COMMITTEE'
WHERE parent_workspace_id IS NOT NULL 
  AND workspace_type IS NULL
  AND EXISTS (
    SELECT 1 FROM public.workspaces p 
    JOIN public.workspaces gp ON p.parent_workspace_id = gp.id
    WHERE p.id = w.parent_workspace_id 
    AND gp.parent_workspace_id IS NULL
  );

-- Set TEAM level (anything else at depth 4)
UPDATE public.workspaces w
SET workspace_type = 'TEAM'
WHERE parent_workspace_id IS NOT NULL 
  AND workspace_type IS NULL
  AND EXISTS (
    SELECT 1 FROM public.workspaces p 
    JOIN public.workspaces gp ON p.parent_workspace_id = gp.id
    JOIN public.workspaces ggp ON gp.parent_workspace_id = ggp.id
    WHERE p.id = w.parent_workspace_id 
    AND ggp.parent_workspace_id IS NULL
  );

-- Add comment for documentation
COMMENT ON COLUMN public.workspaces.workspace_type IS 'Workspace hierarchy type: ROOT (L1), DEPARTMENT (L2), COMMITTEE (L3), TEAM (L4)';
COMMENT ON COLUMN public.workspaces.department_id IS 'Department identifier for committees and teams (e.g., operations, growth, content)';