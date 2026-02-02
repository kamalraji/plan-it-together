-- Add hours tracking columns to volunteer_assignments
ALTER TABLE public.volunteer_assignments 
ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hours_logged DECIMAL(5,2);

-- Create function to auto-calculate hours_logged when check_out_time is set
CREATE OR REPLACE FUNCTION public.calculate_volunteer_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
    NEW.hours_logged := ROUND(EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600.0, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-calculating hours
DROP TRIGGER IF EXISTS calculate_hours_on_checkout ON public.volunteer_assignments;
CREATE TRIGGER calculate_hours_on_checkout
BEFORE UPDATE ON public.volunteer_assignments
FOR EACH ROW
WHEN (NEW.check_out_time IS DISTINCT FROM OLD.check_out_time)
EXECUTE FUNCTION public.calculate_volunteer_hours();