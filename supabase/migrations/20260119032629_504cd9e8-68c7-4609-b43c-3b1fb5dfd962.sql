-- Add usage_count column for tracking asset usage
ALTER TABLE public.workspace_media_assets 
ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0;

-- Add index for type filtering
CREATE INDEX IF NOT EXISTS idx_workspace_media_assets_type 
ON public.workspace_media_assets(workspace_id, type);

-- Add index for usage tracking
CREATE INDEX IF NOT EXISTS idx_workspace_media_assets_usage 
ON public.workspace_media_assets(workspace_id, usage_count DESC);

-- Create storage bucket for media assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workspace-media', 
  'workspace-media', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf', 'audio/mpeg', 'audio/wav']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for workspace media
CREATE POLICY "Workspace members can view media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'workspace-media');

CREATE POLICY "Authenticated users can upload media" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'workspace-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their uploaded media" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'workspace-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their uploaded media" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'workspace-media' 
  AND auth.role() = 'authenticated'
);