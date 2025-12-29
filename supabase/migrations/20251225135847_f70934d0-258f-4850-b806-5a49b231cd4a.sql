-- Create vendors table for vendor profiles
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  business_address JSONB,
  service_categories TEXT[] NOT NULL DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  response_time_hours INTEGER DEFAULT 24,
  portfolio_images TEXT[] DEFAULT '{}',
  business_license TEXT,
  insurance_certificate TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on vendors
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Vendors can manage their own profiles
CREATE POLICY vendor_manage_own_profile
ON public.vendors
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Everyone can view active verified vendors
CREATE POLICY public_view_verified_vendors
ON public.vendors
FOR SELECT
USING (is_active = true AND verification_status = 'VERIFIED');

-- Add trigger for updated_at on vendors
CREATE TRIGGER set_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Update services table to add vendor-related columns
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pricing_type TEXT DEFAULT 'FIXED' CHECK (pricing_type IN ('FIXED', 'HOURLY', 'PER_PERSON', 'CUSTOM_QUOTE')),
ADD COLUMN IF NOT EXISTS inclusions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS exclusions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add policy to allow public viewing of active services
CREATE POLICY public_view_active_services
ON public.services
FOR SELECT
USING (is_active = true);

-- Add index for faster searches
CREATE INDEX IF NOT EXISTS idx_services_vendor_id ON public.services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_location ON public.services(location);
CREATE INDEX IF NOT EXISTS idx_vendors_verification_status ON public.vendors(verification_status);
CREATE INDEX IF NOT EXISTS idx_vendors_service_categories ON public.vendors USING GIN(service_categories);