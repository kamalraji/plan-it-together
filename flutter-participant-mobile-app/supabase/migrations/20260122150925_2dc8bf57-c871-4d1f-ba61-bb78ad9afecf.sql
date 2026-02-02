-- Create encrypted media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('encrypted-media', 'encrypted-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for encrypted-media bucket
-- Users can upload to their own folder
CREATE POLICY "Users can upload encrypted media to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'encrypted-media' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Users can read encrypted media in chats they're part of
CREATE POLICY "Users can read encrypted media they have access to"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'encrypted-media'
);

-- Users can delete their own encrypted media
CREATE POLICY "Users can delete own encrypted media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'encrypted-media'
  AND auth.uid()::text = (storage.foldername(name))[2]
);