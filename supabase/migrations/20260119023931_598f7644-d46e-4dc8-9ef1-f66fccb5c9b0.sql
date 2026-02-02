-- Add view_count column to workspace_content_items for blog article analytics
ALTER TABLE public.workspace_content_items
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add index for faster filtering by type
CREATE INDEX IF NOT EXISTS idx_workspace_content_items_type 
ON public.workspace_content_items(workspace_id, type);

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_workspace_content_items_status 
ON public.workspace_content_items(workspace_id, status);