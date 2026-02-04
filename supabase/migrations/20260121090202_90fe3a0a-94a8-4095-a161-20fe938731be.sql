-- Create function for atomic inventory increment (prevents overselling)
CREATE OR REPLACE FUNCTION increment_sold_count(
  p_tier_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE ticket_tiers
  SET sold_count = sold_count + p_quantity,
      updated_at = now()
  WHERE id = p_tier_id
    AND is_active = true
    AND (quantity IS NULL OR sold_count + p_quantity <= quantity)
  RETURNING true INTO v_updated;
  
  RETURN COALESCE(v_updated, false);
END;
$$;

-- Create function for atomic inventory decrement (for cancellations)
CREATE OR REPLACE FUNCTION decrement_sold_count(
  p_tier_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ticket_tiers
  SET sold_count = GREATEST(0, sold_count - p_quantity),
      updated_at = now()
  WHERE id = p_tier_id
  RETURNING true;
  
  RETURN true;
END;
$$;

-- Add index for efficient tier queries on public pages
CREATE INDEX IF NOT EXISTS idx_ticket_tiers_event_active 
ON ticket_tiers(event_id, is_active) 
WHERE is_active = true;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_sold_count(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_sold_count(UUID, INTEGER) TO authenticated;