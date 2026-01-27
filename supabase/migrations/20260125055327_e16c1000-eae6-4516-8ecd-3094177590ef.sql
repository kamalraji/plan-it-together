-- =====================================================
-- Phase 1: Critical Security Fixes (Corrected)
-- Create public-safe function for ticket tier display
-- =====================================================

-- Create public-safe function for ticket tier display (hides internal pricing strategy)
CREATE OR REPLACE FUNCTION public.get_public_ticket_tiers(p_event_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC,
  currency TEXT,
  available_quantity INTEGER,
  sale_start TIMESTAMPTZ,
  sale_end TIMESTAMPTZ,
  is_available BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT 
    tt.id,
    tt.name,
    tt.description,
    tt.price,
    tt.currency,
    GREATEST(0, tt.quantity - COALESCE(tt.sold_count, 0)) as available_quantity,
    tt.sale_start,
    tt.sale_end,
    (
      tt.is_active = true
      AND (tt.sale_start IS NULL OR tt.sale_start <= NOW())
      AND (tt.sale_end IS NULL OR tt.sale_end >= NOW())
      AND (tt.quantity IS NULL OR tt.quantity > COALESCE(tt.sold_count, 0))
    ) as is_available
  FROM public.ticket_tiers tt
  JOIN public.events e ON e.id = tt.event_id
  WHERE tt.event_id = p_event_id
    AND e.status = 'PUBLISHED'
    AND e.visibility = 'PUBLIC'
    AND tt.is_active = true
  ORDER BY tt.sort_order, tt.price;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_public_ticket_tiers(UUID) TO anon, authenticated;