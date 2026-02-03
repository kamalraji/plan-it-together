-- Create vendor_reviews table for organizers to rate vendors after events
CREATE TABLE public.vendor_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  response_text TEXT,
  response_at TIMESTAMP WITH TIME ZONE,
  is_verified_booking BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, reviewer_id, event_id)
);

-- Enable RLS
ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;

-- Public can view all reviews
CREATE POLICY "Public can view vendor reviews"
ON public.vendor_reviews
FOR SELECT
USING (true);

-- Authenticated users can create reviews (organizers after events)
CREATE POLICY "Authenticated users can create reviews"
ON public.vendor_reviews
FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.vendor_reviews
FOR UPDATE
USING (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id);

-- Vendors can respond to their own reviews
CREATE POLICY "Vendors can respond to reviews"
ON public.vendor_reviews
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.id = vendor_reviews.vendor_id
    AND v.user_id = auth.uid()
  )
);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.vendor_reviews
FOR DELETE
USING (auth.uid() = reviewer_id);

-- Create trigger for updated_at
CREATE TRIGGER update_vendor_reviews_updated_at
BEFORE UPDATE ON public.vendor_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_vendor_reviews_vendor_id ON public.vendor_reviews(vendor_id);
CREATE INDEX idx_vendor_reviews_reviewer_id ON public.vendor_reviews(reviewer_id);
CREATE INDEX idx_vendor_reviews_rating ON public.vendor_reviews(rating);