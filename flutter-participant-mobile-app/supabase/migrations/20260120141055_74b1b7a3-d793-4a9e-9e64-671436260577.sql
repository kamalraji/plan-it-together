-- Fix security warnings: Set search_path on functions

-- Fix the update_security_preferences_updated_at function
CREATE OR REPLACE FUNCTION update_security_preferences_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;