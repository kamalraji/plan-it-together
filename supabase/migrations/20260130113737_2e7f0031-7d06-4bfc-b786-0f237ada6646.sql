-- Create newsletter_subscribers table for email capture
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'landing', -- 'landing', 'event_page', 'footer', etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting new subscriptions (anyone can subscribe)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Create policy for service role to manage all subscribers
CREATE POLICY "Service role can manage all subscribers"
  ON public.newsletter_subscribers
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create policy for authenticated admins to view subscribers
CREATE POLICY "Admins can view newsletter subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email 
  ON public.newsletter_subscribers(email);

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_source 
  ON public.newsletter_subscribers(source);

-- Add comment
COMMENT ON TABLE public.newsletter_subscribers IS 'Newsletter email subscriptions for platform marketing';