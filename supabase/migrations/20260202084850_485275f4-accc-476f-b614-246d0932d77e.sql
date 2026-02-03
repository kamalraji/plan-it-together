-- Create task_attachments table for file storage
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.workspace_tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT DEFAULT 'application/octet-stream',
  storage_path TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workspace_stakeholders table for key contacts
CREATE TABLE IF NOT EXISTS public.workspace_stakeholders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  organization TEXT,
  email TEXT,
  phone TEXT,
  category TEXT NOT NULL CHECK (category IN ('vip', 'media', 'sponsor', 'partner', 'government')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_stakeholders ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_attachments (using workspace_team_members)
CREATE POLICY "Users can view task attachments if they are workspace members"
  ON public.task_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_tasks wt
      JOIN workspace_team_members wtm ON wtm.workspace_id = wt.workspace_id
      WHERE wt.id = task_attachments.task_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload attachments if they are workspace members"
  ON public.task_attachments FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM workspace_tasks wt
      JOIN workspace_team_members wtm ON wtm.workspace_id = wt.workspace_id
      WHERE wt.id = task_attachments.task_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own attachments"
  ON public.task_attachments FOR DELETE
  USING (uploaded_by = auth.uid());

-- RLS policies for workspace_stakeholders
CREATE POLICY "Users can view stakeholders if they are workspace members"
  ON public.workspace_stakeholders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_stakeholders.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace managers can manage stakeholders"
  ON public.workspace_stakeholders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_stakeholders.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.role IN ('EVENT_ORGANIZER', 'EVENT_COORDINATOR', 'ADMIN')
    )
  );

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for task-attachments bucket
CREATE POLICY "Authenticated users can upload task attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'task-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view task attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'task-attachments');

CREATE POLICY "Users can delete their own task attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'task-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON public.task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_workspace_stakeholders_workspace_id ON public.workspace_stakeholders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_stakeholders_category ON public.workspace_stakeholders(category);
CREATE INDEX IF NOT EXISTS idx_workspace_stakeholders_priority ON public.workspace_stakeholders(priority);