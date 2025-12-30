-- Add GrapesJS landing page storage to events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS landing_page_data jsonb;

-- Unique slug/URL for custom event landing pages
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS landing_page_slug text UNIQUE;