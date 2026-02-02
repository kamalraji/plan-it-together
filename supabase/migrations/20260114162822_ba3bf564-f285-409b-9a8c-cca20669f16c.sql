-- Create storage bucket for pre-generated certificate background images
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificate-backgrounds', 'certificate-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for public read access
CREATE POLICY "Certificate backgrounds are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'certificate-backgrounds');

-- Create policy for authenticated users to upload (admin use)
CREATE POLICY "Authenticated users can upload certificate backgrounds"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'certificate-backgrounds' AND auth.role() = 'authenticated');