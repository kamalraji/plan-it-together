
-- Fix function search path mutable warning
-- Add explicit search_path to prevent search path injection attacks

CREATE OR REPLACE FUNCTION public.update_recurring_tasks_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
