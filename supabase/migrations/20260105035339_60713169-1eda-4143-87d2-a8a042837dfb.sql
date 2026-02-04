-- Add new workspace settings columns for default task priority and auto-archive
ALTER TABLE public.workspace_settings
ADD COLUMN IF NOT EXISTS default_task_priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS auto_archive_after_event BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_archive_days_after INTEGER DEFAULT 7;

-- Add comment for documentation
COMMENT ON COLUMN public.workspace_settings.default_task_priority IS 'Default priority for new tasks: low, medium, high, urgent';
COMMENT ON COLUMN public.workspace_settings.auto_archive_after_event IS 'Automatically archive workspace after linked event ends';
COMMENT ON COLUMN public.workspace_settings.auto_archive_days_after IS 'Number of days after event completion to auto-archive';