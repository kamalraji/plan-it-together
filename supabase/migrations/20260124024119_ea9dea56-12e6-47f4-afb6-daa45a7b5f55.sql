-- =============================================
-- Phase 1: Events Table Schema Normalization
-- =============================================

-- 1.1 Add missing columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'OPEN' 
  CHECK (registration_type IN ('OPEN', 'INVITE_ONLY', 'APPROVAL_REQUIRED'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_waitlist BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_website TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS min_age INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_age INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_timezone ON events(timezone);
CREATE INDEX IF NOT EXISTS idx_events_registration_deadline ON events(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_events_is_free ON events(is_free);
CREATE INDEX IF NOT EXISTS idx_events_registration_type ON events(registration_type);

-- 1.2 Create event_venues table (normalized venue data)
CREATE TABLE IF NOT EXISTS event_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  capacity INTEGER,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accessibility_features TEXT[] DEFAULT '{}',
  accessibility_notes TEXT,
  google_place_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id)
);

-- Indexes for venue queries
CREATE INDEX IF NOT EXISTS idx_event_venues_event_id ON event_venues(event_id);
CREATE INDEX IF NOT EXISTS idx_event_venues_city ON event_venues(city);
CREATE INDEX IF NOT EXISTS idx_event_venues_country ON event_venues(country);

-- 1.3 Create event_virtual_links table
CREATE TABLE IF NOT EXISTS event_virtual_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('zoom', 'teams', 'meet', 'webex', 'discord', 'other')),
  meeting_url TEXT,
  meeting_id TEXT,
  password TEXT,
  instructions TEXT,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for virtual links
CREATE INDEX IF NOT EXISTS idx_event_virtual_links_event_id ON event_virtual_links(event_id);

-- 1.4 Create event_images table (gallery support)
CREATE TABLE IF NOT EXISTS event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);

-- 1.5 Create event_faqs table
CREATE TABLE IF NOT EXISTS event_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_faqs_event_id ON event_faqs(event_id);

-- =============================================
-- RLS Policies
-- =============================================

-- event_venues RLS
ALTER TABLE event_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read venues" ON event_venues 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage venues for their events" ON event_venues 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = event_venues.event_id 
      AND e.owner_id = auth.uid()
    )
  );

-- event_virtual_links RLS
ALTER TABLE event_virtual_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read virtual links for public events" ON event_virtual_links 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = event_virtual_links.event_id 
      AND e.visibility = 'PUBLIC'
    )
  );

CREATE POLICY "Event owners can manage virtual links" ON event_virtual_links 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = event_virtual_links.event_id 
      AND e.owner_id = auth.uid()
    )
  );

-- event_images RLS
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read event images" ON event_images 
  FOR SELECT USING (true);

CREATE POLICY "Event owners can manage images" ON event_images 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = event_images.event_id 
      AND e.owner_id = auth.uid()
    )
  );

-- event_faqs RLS
ALTER TABLE event_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published FAQs" ON event_faqs 
  FOR SELECT USING (is_published = true);

CREATE POLICY "Event owners can manage FAQs" ON event_faqs 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = event_faqs.event_id 
      AND e.owner_id = auth.uid()
    )
  );

-- =============================================
-- Data Migration from JSONB to new columns
-- =============================================

UPDATE events SET
  timezone = COALESCE(branding->>'timezone', 'UTC'),
  registration_deadline = CASE 
    WHEN branding->>'registrationDeadline' IS NOT NULL 
    AND branding->>'registrationDeadline' != '' 
    THEN (branding->>'registrationDeadline')::timestamptz 
    ELSE NULL 
  END,
  registration_type = COALESCE(
    NULLIF(branding->'ticketing'->>'registrationType', ''),
    NULLIF(branding->'registration'->>'type', ''),
    'OPEN'
  ),
  is_free = COALESCE((branding->'ticketing'->>'isFree')::boolean, true),
  allow_waitlist = COALESCE((branding->'ticketing'->>'allowWaitlist')::boolean, false),
  contact_email = NULLIF(branding->'contact'->>'email', ''),
  contact_phone = NULLIF(branding->'contact'->>'phone', ''),
  event_website = NULLIF(branding->'contact'->>'eventWebsite', ''),
  min_age = CASE 
    WHEN branding->'accessibility'->>'ageRestrictionEnabled' = 'true' 
    THEN (branding->'accessibility'->>'minAge')::integer 
    ELSE NULL 
  END,
  max_age = CASE 
    WHEN branding->'accessibility'->>'ageRestrictionEnabled' = 'true' 
    THEN (branding->'accessibility'->>'maxAge')::integer 
    ELSE NULL 
  END,
  language = COALESCE(NULLIF(branding->'accessibility'->>'language', ''), 'en')
WHERE branding IS NOT NULL;