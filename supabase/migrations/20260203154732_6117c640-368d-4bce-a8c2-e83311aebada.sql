-- Security Fix: Recreate slugify function with proper search_path
DROP FUNCTION IF EXISTS public.slugify(text);

CREATE FUNCTION public.slugify(input_text text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT lower(regexp_replace(regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
$function$