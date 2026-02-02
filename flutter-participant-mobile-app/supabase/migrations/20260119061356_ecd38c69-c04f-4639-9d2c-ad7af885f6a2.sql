-- =============================================
-- CONFERENCE/WORKSHOP ZONE TABLES
-- =============================================

-- Event Tracks (for multi-track conferences)
CREATE TABLE public.event_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'event',
  location TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sponsor Booths
CREATE TABLE public.sponsor_booths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sponsor_name TEXT NOT NULL,
  sponsor_logo TEXT,
  tier TEXT DEFAULT 'silver' CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze', 'partner')),
  booth_number TEXT,
  location TEXT,
  description TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  offerings TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  visit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Booth Visits (for tracking engagement)
CREATE TABLE public.booth_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booth_id UUID NOT NULL REFERENCES public.sponsor_booths(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scanned_qr BOOLEAN DEFAULT false,
  collected_swag BOOLEAN DEFAULT false,
  notes TEXT,
  UNIQUE(booth_id, user_id)
);

-- Event Materials (for workshops/training)
CREATE TABLE public.event_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  session_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL CHECK (material_type IN ('slides', 'document', 'code', 'video', 'link', 'exercise', 'template')),
  file_url TEXT,
  external_link TEXT,
  file_size INTEGER,
  is_downloadable BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Material Downloads (tracking)
CREATE TABLE public.material_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.event_materials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workshop Progress (for hands-on tracking)
CREATE TABLE public.workshop_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes JSONB DEFAULT '{}',
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booth_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_tracks
CREATE POLICY "Anyone can view tracks for published events"
ON public.event_tracks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_tracks.event_id
    AND (e.visibility = 'PUBLIC' OR EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.event_id = e.id AND r.user_id = auth.uid() AND r.status = 'CONFIRMED'
    ))
  )
);

-- RLS Policies for sponsor_booths
CREATE POLICY "Anyone can view active booths for published events"
ON public.sponsor_booths FOR SELECT
USING (
  is_active = true AND EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = sponsor_booths.event_id
    AND (e.visibility = 'PUBLIC' OR EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.event_id = e.id AND r.user_id = auth.uid() AND r.status = 'CONFIRMED'
    ))
  )
);

-- RLS Policies for booth_visits
CREATE POLICY "Users can view their own booth visits"
ON public.booth_visits FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Registered users can record booth visits"
ON public.booth_visits FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM sponsor_booths sb
    JOIN registrations r ON r.event_id = sb.event_id
    WHERE sb.id = booth_visits.booth_id
    AND r.user_id = auth.uid()
    AND r.status = 'CONFIRMED'
  )
);

-- RLS Policies for event_materials
CREATE POLICY "Registered users can view materials"
ON public.event_materials FOR SELECT
USING (
  is_public = true OR EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.event_id = event_materials.event_id
    AND r.user_id = auth.uid()
    AND r.status = 'CONFIRMED'
  )
);

-- RLS Policies for material_downloads
CREATE POLICY "Users can view their own downloads"
ON public.material_downloads FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can record downloads"
ON public.material_downloads FOR INSERT
WITH CHECK (user_id = auth.uid());

-- RLS Policies for workshop_progress
CREATE POLICY "Users can view their own progress"
ON public.workshop_progress FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own progress"
ON public.workshop_progress FOR ALL
USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_event_tracks_event ON public.event_tracks(event_id, sort_order);
CREATE INDEX idx_sponsor_booths_event ON public.sponsor_booths(event_id, tier);
CREATE INDEX idx_sponsor_booths_active ON public.sponsor_booths(event_id) WHERE is_active = true;
CREATE INDEX idx_booth_visits_booth ON public.booth_visits(booth_id);
CREATE INDEX idx_booth_visits_user ON public.booth_visits(user_id);
CREATE INDEX idx_event_materials_event ON public.event_materials(event_id, sort_order);
CREATE INDEX idx_event_materials_session ON public.event_materials(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_material_downloads_material ON public.material_downloads(material_id);
CREATE INDEX idx_workshop_progress_event ON public.workshop_progress(event_id, user_id);

-- Triggers for updated_at
CREATE TRIGGER update_sponsor_booths_updated_at
  BEFORE UPDATE ON public.sponsor_booths
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_materials_updated_at
  BEFORE UPDATE ON public.event_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment booth visit count
CREATE OR REPLACE FUNCTION public.increment_booth_visit(p_booth_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.sponsor_booths 
  SET visit_count = visit_count + 1 
  WHERE id = p_booth_id;
END;
$$;