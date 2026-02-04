-- Create workspace_subtasks table for child tasks
CREATE TABLE public.workspace_subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_task_id UUID NOT NULL REFERENCES public.workspace_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'COMPLETED')),
  assigned_to UUID,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workspace_task_drafts table for autosave
CREATE TABLE public.workspace_task_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- Create workspace_custom_templates table
CREATE TABLE public.workspace_custom_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  category TEXT,
  priority TEXT,
  description TEXT,
  tags TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add new columns to workspace_tasks
ALTER TABLE public.workspace_tasks 
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS attachments TEXT[];

-- Create updated_at trigger for subtasks
CREATE TRIGGER set_workspace_subtasks_updated_at
  BEFORE UPDATE ON public.workspace_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for drafts
CREATE TRIGGER set_workspace_task_drafts_updated_at
  BEFORE UPDATE ON public.workspace_task_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE public.workspace_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_task_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_custom_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for workspace_subtasks
CREATE POLICY "Users can view subtasks of tasks in their workspaces"
  ON public.workspace_subtasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_tasks wt
      WHERE wt.id = parent_task_id
      AND public.has_workspace_access(wt.workspace_id)
    )
  );

CREATE POLICY "Users can create subtasks in their workspaces"
  ON public.workspace_subtasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_tasks wt
      WHERE wt.id = parent_task_id
      AND public.has_workspace_access(wt.workspace_id)
    )
  );

CREATE POLICY "Users can update subtasks in their workspaces"
  ON public.workspace_subtasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_tasks wt
      WHERE wt.id = parent_task_id
      AND public.has_workspace_access(wt.workspace_id)
    )
  );

CREATE POLICY "Users can delete subtasks in their workspaces"
  ON public.workspace_subtasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_tasks wt
      WHERE wt.id = parent_task_id
      AND public.has_workspace_access(wt.workspace_id)
    )
  );

-- RLS policies for workspace_task_drafts
CREATE POLICY "Users can manage their own drafts"
  ON public.workspace_task_drafts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for workspace_custom_templates
CREATE POLICY "Users can view templates in their workspaces"
  ON public.workspace_custom_templates FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can create templates in their workspaces"
  ON public.workspace_custom_templates FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can update templates in their workspaces"
  ON public.workspace_custom_templates FOR UPDATE
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can delete templates they created"
  ON public.workspace_custom_templates FOR DELETE
  USING (auth.uid() = created_by);

-- Create index for faster subtask lookups
CREATE INDEX idx_workspace_subtasks_parent_task_id ON public.workspace_subtasks(parent_task_id);
CREATE INDEX idx_workspace_subtasks_status ON public.workspace_subtasks(status);
CREATE INDEX idx_workspace_task_drafts_user_workspace ON public.workspace_task_drafts(user_id, workspace_id);
CREATE INDEX idx_workspace_custom_templates_workspace ON public.workspace_custom_templates(workspace_id);