-- Create vendor_bookings table to track quote requests and bookings
CREATE TABLE public.vendor_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.vendor_services(id) ON DELETE SET NULL,
  organizer_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  
  -- Request details
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_location TEXT,
  guest_count INTEGER,
  requirements TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  
  -- Quote and pricing
  quoted_price NUMERIC,
  final_price NUMERIC,
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWING', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DECLINED')),
  
  -- Contact info
  organizer_name TEXT NOT NULL,
  organizer_email TEXT NOT NULL,
  organizer_phone TEXT,
  
  -- Notes
  vendor_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trigger for updated_at
CREATE TRIGGER set_vendor_bookings_updated_at
  BEFORE UPDATE ON public.vendor_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.vendor_bookings ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own bookings
CREATE POLICY "Vendors can view their own bookings"
  ON public.vendor_bookings
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_bookings.vendor_id AND v.user_id = auth.uid()
  ));

-- Vendors can update their own bookings
CREATE POLICY "Vendors can update their own bookings"
  ON public.vendor_bookings
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_bookings.vendor_id AND v.user_id = auth.uid()
  ));

-- Organizers can view bookings they created
CREATE POLICY "Organizers can view their bookings"
  ON public.vendor_bookings
  FOR SELECT
  USING (organizer_id = auth.uid());

-- Authenticated users can create bookings
CREATE POLICY "Authenticated users can create bookings"
  ON public.vendor_bookings
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can manage all bookings
CREATE POLICY "Admins can manage all bookings"
  ON public.vendor_bookings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_vendor_bookings_vendor_id ON public.vendor_bookings(vendor_id);
CREATE INDEX idx_vendor_bookings_organizer_id ON public.vendor_bookings(organizer_id);
CREATE INDEX idx_vendor_bookings_status ON public.vendor_bookings(status);