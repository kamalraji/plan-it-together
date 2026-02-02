-- Create storage bucket for pre-generated ID card background images
INSERT INTO storage.buckets (id, name, public)
VALUES ('idcard-backgrounds', 'idcard-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read backgrounds
CREATE POLICY "ID card backgrounds are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'idcard-backgrounds');

-- Allow authenticated users to upload backgrounds (admin feature)
CREATE POLICY "Authenticated users can upload ID card backgrounds"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'idcard-backgrounds' AND auth.role() = 'authenticated');