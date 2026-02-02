-- Promo codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'PERCENTAGE',
  discount_value DECIMAL(10, 2) NOT NULL,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, code)
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to validate promo codes
CREATE POLICY "Users can view active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true);

-- Add promo_code_id to registrations if not exists
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id);

-- Add form_responses if not exists
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS form_responses JSONB DEFAULT '{}';

-- Add discount fields if not exists
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_event ON public.promo_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_registrations_promo ON public.registrations(promo_code_id);