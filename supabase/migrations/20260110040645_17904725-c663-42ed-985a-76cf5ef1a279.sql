-- Create promo_codes table for discounts
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER, -- NULL means unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  min_quantity INTEGER DEFAULT 1, -- Minimum tickets required
  max_quantity INTEGER, -- Maximum tickets this code can apply to
  applicable_tier_ids UUID[], -- NULL means all tiers
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, code)
);

-- Create registration_attendees table for group purchases
CREATE TABLE public.registration_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  ticket_tier_id UUID REFERENCES public.ticket_tiers(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  custom_fields JSONB DEFAULT '{}',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns to registrations for group purchases
ALTER TABLE public.registrations 
ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1,
ADD COLUMN promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,
ADD COLUMN subtotal DECIMAL(10,2),
ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN total_amount DECIMAL(10,2);

-- Enable RLS on new tables
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_attendees ENABLE ROW LEVEL SECURITY;

-- Promo codes: Event owners can manage
CREATE POLICY "Event owners can manage promo codes"
ON public.promo_codes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = promo_codes.event_id
    AND e.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = promo_codes.event_id
    AND e.owner_id = auth.uid()
  )
);

-- Promo codes: Public can read active codes for validation
CREATE POLICY "Public can read active promo codes"
ON public.promo_codes
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = promo_codes.event_id
    AND e.status = 'PUBLISHED'
  )
);

-- Registration attendees: Users can manage their own
CREATE POLICY "Users can manage own registration attendees"
ON public.registration_attendees
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.registrations r
    WHERE r.id = registration_attendees.registration_id
    AND r.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.registrations r
    WHERE r.id = registration_attendees.registration_id
    AND r.user_id = auth.uid()
  )
);

-- Event owners can view attendees for their events
CREATE POLICY "Event owners can view attendees"
ON public.registration_attendees
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.registrations r
    JOIN public.events e ON e.id = r.event_id
    WHERE r.id = registration_attendees.registration_id
    AND e.owner_id = auth.uid()
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registration_attendees_updated_at
BEFORE UPDATE ON public.registration_attendees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_promo_codes_event_id ON public.promo_codes(event_id);
CREATE INDEX idx_promo_codes_code ON public.promo_codes(event_id, code);
CREATE INDEX idx_registration_attendees_registration_id ON public.registration_attendees(registration_id);