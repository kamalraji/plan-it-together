-- Create ticket_tiers table for multiple ticket types per event
CREATE TABLE public.ticket_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  quantity INTEGER, -- NULL means unlimited
  sold_count INTEGER NOT NULL DEFAULT 0,
  sale_start TIMESTAMPTZ,
  sale_end TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add ticket_tier_id to registrations
ALTER TABLE public.registrations 
ADD COLUMN ticket_tier_id UUID REFERENCES public.ticket_tiers(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;

-- Policy: Event owners can manage their ticket tiers
CREATE POLICY "Event owners can manage ticket tiers"
ON public.ticket_tiers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = ticket_tiers.event_id
    AND e.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = ticket_tiers.event_id
    AND e.owner_id = auth.uid()
  )
);

-- Policy: Anyone can read active tiers for published events
CREATE POLICY "Public can read active tiers"
ON public.ticket_tiers
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = ticket_tiers.event_id
    AND e.status = 'PUBLISHED'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_ticket_tiers_updated_at
BEFORE UPDATE ON public.ticket_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_ticket_tiers_event_id ON public.ticket_tiers(event_id);
CREATE INDEX idx_ticket_tiers_active ON public.ticket_tiers(event_id, is_active) WHERE is_active = true;