-- Add slug column to events table for SEO-friendly URLs
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create a function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(input_text),
          '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Backfill existing events with unique slugs (append row number for duplicates)
WITH numbered AS (
  SELECT id, name, organization_id,
    ROW_NUMBER() OVER (PARTITION BY organization_id, public.generate_slug(name) ORDER BY created_at) AS rn
  FROM public.events
)
UPDATE public.events e
SET slug = CASE 
  WHEN n.rn = 1 THEN public.generate_slug(n.name)
  ELSE public.generate_slug(n.name) || '-' || n.rn
END
FROM numbered n
WHERE e.id = n.id AND e.slug IS NULL;