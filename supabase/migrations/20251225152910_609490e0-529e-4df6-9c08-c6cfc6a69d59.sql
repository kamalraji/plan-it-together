-- Extend events table to support Prisma-like event features
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS branding jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS venue jsonb,
  ADD COLUMN IF NOT EXISTS virtual_links jsonb,
  ADD COLUMN IF NOT EXISTS landing_page_url text,
  ADD COLUMN IF NOT EXISTS invite_link text,
  ADD COLUMN IF NOT EXISTS leaderboard_enabled boolean DEFAULT false;

-- Unique-ish identifiers for public landing and private invite links
CREATE UNIQUE INDEX IF NOT EXISTS events_landing_page_url_key
  ON public.events(landing_page_url)
  WHERE landing_page_url IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS events_invite_link_key
  ON public.events(invite_link)
  WHERE invite_link IS NOT NULL;

-- Extend workspaces to better match Prisma Workspace model
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS template_id text,
  ADD COLUMN IF NOT EXISTS dissolved_at timestamptz;