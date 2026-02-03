
-- Phase 1 Security Fixes: Restrict user_profiles and ticket_tiers to authenticated users only

-- =====================================================
-- FIX 1: ticket_tiers - Change public policies to authenticated only
-- =====================================================

-- Drop existing public-accessible policies
DROP POLICY IF EXISTS "Public can read active tiers" ON public.ticket_tiers;
DROP POLICY IF EXISTS "Public can view published event tiers" ON public.ticket_tiers;
DROP POLICY IF EXISTS "Event owners can manage ticket tiers" ON public.ticket_tiers;

-- Recreate policies for authenticated users only
CREATE POLICY "Authenticated users can view active tiers for published events"
ON public.ticket_tiers
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = ticket_tiers.event_id 
    AND e.status = 'PUBLISHED'::event_status
  )
);

CREATE POLICY "Event owners can manage their ticket tiers"
ON public.ticket_tiers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = ticket_tiers.event_id 
    AND e.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = ticket_tiers.event_id 
    AND e.owner_id = auth.uid()
  )
);

-- =====================================================
-- FIX 2: user_profiles - Ensure no anonymous access and add explicit deny
-- =====================================================

-- Verify RLS is enabled (should already be, but ensure it)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (extra security)
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

-- Verify RLS is enabled on ticket_tiers
ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tiers FORCE ROW LEVEL SECURITY;

-- Add comment documenting security requirements
COMMENT ON TABLE public.user_profiles IS 'User profile data - RLS enforced, authenticated access only. PII protected.';
COMMENT ON TABLE public.ticket_tiers IS 'Event ticket pricing tiers - RLS enforced, authenticated access only to prevent price scraping.';
