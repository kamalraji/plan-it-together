-- Create contact_submissions table for the contact form
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous users) to insert contact submissions
CREATE POLICY "Anyone can submit contact forms"
  ON public.contact_submissions
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view their own submissions
CREATE POLICY "Users can view their own submissions"
  ON public.contact_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add index on created_at for ordering
CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions (created_at DESC);

-- Add index on email for lookups
CREATE INDEX idx_contact_submissions_email ON public.contact_submissions (email);

-- Add comment
COMMENT ON TABLE public.contact_submissions IS 'Stores contact form submissions from the public website';