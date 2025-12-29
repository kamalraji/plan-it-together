-- Add role_scope column to workspace_tasks for role-based sub workspaces
ALTER TABLE public.workspace_tasks
ADD COLUMN IF NOT EXISTS role_scope text;

-- Optionally, you might later constrain this to known workspace roles using a CHECK or enum,
-- but we keep it flexible for now to align with the existing text-based role columns.
