-- Create table for UTM-attributed event page views
CREATE TABLE public.event_page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT, -- Hashed for privacy
  session_id TEXT, -- Anonymous session tracking
  section_viewed TEXT, -- Track which sections were viewed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying by event and time
CREATE INDEX idx_event_page_views_event_id ON public.event_page_views(event_id);
CREATE INDEX idx_event_page_views_created_at ON public.event_page_views(created_at DESC);
CREATE INDEX idx_event_page_views_utm ON public.event_page_views(event_id, utm_source, utm_medium, utm_campaign);

-- Enable RLS
ALTER TABLE public.event_page_views ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for tracking (public event pages)
CREATE POLICY "Anyone can insert page views"
ON public.event_page_views
FOR INSERT
WITH CHECK (true);

-- Only event owners/org admins can view analytics
CREATE POLICY "Event owners can view page views"
ON public.event_page_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_page_views.event_id
    AND (
      e.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.organization_memberships m
        WHERE m.organization_id = e.organization_id
        AND m.user_id = auth.uid()
        AND m.status = 'ACTIVE'
        AND m.role IN ('OWNER', 'ADMIN', 'ORGANIZER')
      )
    )
  )
);