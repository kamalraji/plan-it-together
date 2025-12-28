-- Harden function search_path for organizations timestamp trigger
CREATE OR REPLACE FUNCTION public.set_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;