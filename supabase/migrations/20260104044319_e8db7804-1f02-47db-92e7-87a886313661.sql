-- Create updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create vendor verification status enum if not exists
DO $$ BEGIN
  CREATE TYPE public.vendor_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create vendors table if not exists
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'SERVICE_PROVIDER',
  description TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  categories TEXT[] DEFAULT '{}',
  documents JSONB DEFAULT '[]',
  portfolio_urls TEXT[] DEFAULT '{}',
  verification_status public.vendor_status DEFAULT 'PENDING',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create vendor services table if not exists  
CREATE TABLE IF NOT EXISTS public.vendor_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  pricing_type TEXT NOT NULL DEFAULT 'FIXED',
  base_price DECIMAL(10,2),
  price_unit TEXT,
  availability JSONB DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  inclusions TEXT[] DEFAULT '{}',
  service_areas TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT vendor_services_vendor_fk FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view their own vendor profile" ON public.vendors;
DROP POLICY IF EXISTS "Users can create their own vendor profile" ON public.vendors;
DROP POLICY IF EXISTS "Users can update their own vendor profile" ON public.vendors;
DROP POLICY IF EXISTS "Admins can view all vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admins can update all vendors" ON public.vendors;
DROP POLICY IF EXISTS "Public can view verified vendors" ON public.vendors;

-- RLS Policies for vendors
CREATE POLICY "Users can view their own vendor profile"
ON public.vendors FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own vendor profile"
ON public.vendors FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own vendor profile"
ON public.vendors FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all vendors"
ON public.vendors FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all vendors"
ON public.vendors FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view verified vendors"
ON public.vendors FOR SELECT
USING (verification_status = 'VERIFIED');

-- Drop existing policies for vendor_services
DROP POLICY IF EXISTS "Vendors can manage their own services" ON public.vendor_services;
DROP POLICY IF EXISTS "Admins can manage all services" ON public.vendor_services;
DROP POLICY IF EXISTS "Public can view active services from verified vendors" ON public.vendor_services;

-- RLS Policies for vendor_services
CREATE POLICY "Vendors can manage their own services"
ON public.vendor_services FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_services.vendor_id
    AND v.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_services.vendor_id
    AND v.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all services"
ON public.vendor_services FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active services from verified vendors"
ON public.vendor_services FOR SELECT
USING (
  status = 'ACTIVE' AND
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_services.vendor_id
    AND v.verification_status = 'VERIFIED'
  )
);

-- Create triggers
DROP TRIGGER IF EXISTS set_vendors_updated_at ON public.vendors;
DROP TRIGGER IF EXISTS set_vendor_services_updated_at ON public.vendor_services;

CREATE TRIGGER set_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_vendor_services_updated_at
BEFORE UPDATE ON public.vendor_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();