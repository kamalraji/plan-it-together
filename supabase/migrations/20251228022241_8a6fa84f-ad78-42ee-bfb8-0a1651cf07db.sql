-- Add branding column to events for public landing-page customization
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS branding jsonb;

-- Optional: backfill existing rows with empty JSON object for consistency
UPDATE public.events
SET branding = '{}'::jsonb
WHERE branding IS NULL;