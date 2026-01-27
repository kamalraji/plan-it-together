-- Create storage bucket for vendor documents (private - verification documents)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for vendor portfolios (public - showcase work)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-portfolios', 'vendor-portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for vendor-documents bucket (private)

-- Vendors can upload their own documents
CREATE POLICY "Vendors upload own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Vendors can view their own documents
CREATE POLICY "Vendors view own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'vendor-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Vendors can update their own documents
CREATE POLICY "Vendors update own documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'vendor-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Vendors can delete their own documents
CREATE POLICY "Vendors delete own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'vendor-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all vendor documents
CREATE POLICY "Admins view all vendor documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'vendor-documents' 
  AND public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for vendor-portfolios bucket (public read)

-- Anyone can view portfolio items
CREATE POLICY "Public view vendor portfolios"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vendor-portfolios');

-- Vendors can upload to their own portfolio folder
CREATE POLICY "Vendors upload own portfolio"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-portfolios' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Vendors can update their own portfolio items
CREATE POLICY "Vendors update own portfolio"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'vendor-portfolios' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Vendors can delete their own portfolio items
CREATE POLICY "Vendors delete own portfolio"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'vendor-portfolios' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);