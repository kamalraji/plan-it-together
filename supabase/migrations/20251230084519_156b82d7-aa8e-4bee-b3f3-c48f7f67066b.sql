-- Add canvas_state column to store serialized tldraw editor state for events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS canvas_state jsonb;