-- Create vendor_shortlist table for storing vendor shortlists per event
CREATE TABLE IF NOT EXISTS public.vendor_shortlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.vendor_services(id) ON DELETE CASCADE,
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id, service_id)
);

-- Enable RLS
ALTER TABLE public.vendor_shortlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own shortlist
CREATE POLICY "Users can view their own shortlist"
ON public.vendor_shortlist FOR SELECT
USING ((SELECT auth.uid()) = user_id);

-- Users can add to their own shortlist
CREATE POLICY "Users can add to their own shortlist"
ON public.vendor_shortlist FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own shortlist items
CREATE POLICY "Users can update their own shortlist"
ON public.vendor_shortlist FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

-- Users can remove from their own shortlist
CREATE POLICY "Users can delete from their own shortlist"
ON public.vendor_shortlist FOR DELETE
USING ((SELECT auth.uid()) = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_shortlist_user ON public.vendor_shortlist(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_shortlist_event ON public.vendor_shortlist(event_id);
CREATE INDEX IF NOT EXISTS idx_vendor_shortlist_service ON public.vendor_shortlist(service_id);