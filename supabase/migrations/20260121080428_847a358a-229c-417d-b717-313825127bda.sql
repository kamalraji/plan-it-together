-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload event images
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');

-- Allow public read access to event images
CREATE POLICY "Public read access to event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- Allow owners to update their uploads
CREATE POLICY "Users can update own event images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow owners to delete their uploads
CREATE POLICY "Users can delete own event images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);