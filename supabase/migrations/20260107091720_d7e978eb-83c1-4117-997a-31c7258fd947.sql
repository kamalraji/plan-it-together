-- Create event category enum
CREATE TYPE public.event_category AS ENUM (
  'HACKATHON',
  'BOOTCAMP',
  'WORKSHOP',
  'CONFERENCE',
  'MEETUP',
  'STARTUP_PITCH',
  'HIRING_CHALLENGE',
  'WEBINAR',
  'COMPETITION',
  'OTHER'
);

-- Add category column to events table
ALTER TABLE public.events 
ADD COLUMN category public.event_category DEFAULT 'OTHER';

-- Add comment for documentation
COMMENT ON COLUMN public.events.category IS 'Type of event program (hackathon, bootcamp, etc.)';