-- Add additional fields to workspace_speakers for materials tracking
ALTER TABLE workspace_speakers 
ADD COLUMN IF NOT EXISTS bio_submitted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS photo_submitted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS presentation_submitted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS av_requirements_submitted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bio_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS photo_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS presentation_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS av_requirements_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bio_url TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS presentation_url TEXT,
ADD COLUMN IF NOT EXISTS av_requirements_text TEXT,
ADD COLUMN IF NOT EXISTS session_duration TEXT,
ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'breakout',
ADD COLUMN IF NOT EXISTS room TEXT;

-- Create speaker_travel table for travel logistics
CREATE TABLE IF NOT EXISTS speaker_travel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id UUID NOT NULL REFERENCES workspace_speakers(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Flight details
  flight_status TEXT DEFAULT 'not_needed' CHECK (flight_status IN ('confirmed', 'pending', 'not_needed')),
  flight_details TEXT,
  flight_number TEXT,
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  
  -- Hotel details
  hotel_status TEXT DEFAULT 'not_needed' CHECK (hotel_status IN ('confirmed', 'pending', 'not_needed')),
  hotel_details TEXT,
  hotel_name TEXT,
  check_in_date DATE,
  check_out_date DATE,
  
  -- Transport details
  transport_status TEXT DEFAULT 'not_needed' CHECK (transport_status IN ('confirmed', 'pending', 'not_needed')),
  transport_details TEXT,
  transport_type TEXT,
  
  -- Meals details
  meals_status TEXT DEFAULT 'not_needed' CHECK (meals_status IN ('confirmed', 'pending', 'not_needed')),
  meals_details TEXT,
  dietary_requirements TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create speaker_communications table for communication log
CREATE TABLE IF NOT EXISTS speaker_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id UUID NOT NULL REFERENCES workspace_speakers(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('email', 'call', 'message')),
  subject TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('sent', 'read', 'replied', 'pending')),
  sent_by UUID,
  sent_by_name TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create speaker_sessions table for detailed session scheduling
CREATE TABLE IF NOT EXISTS speaker_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  speaker_id UUID NOT NULL REFERENCES workspace_speakers(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT DEFAULT 'breakout' CHECK (session_type IN ('keynote', 'workshop', 'panel', 'breakout', 'fireside')),
  
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  
  room TEXT,
  location TEXT,
  
  is_published BOOLEAN DEFAULT false,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE speaker_travel ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaker_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaker_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for speaker_travel
CREATE POLICY "Users can view speaker travel for accessible workspaces"
  ON speaker_travel FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can manage speaker travel for accessible workspaces"
  ON speaker_travel FOR ALL
  USING (public.has_workspace_access(workspace_id))
  WITH CHECK (public.has_workspace_access(workspace_id));

-- RLS policies for speaker_communications
CREATE POLICY "Users can view speaker communications for accessible workspaces"
  ON speaker_communications FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can manage speaker communications for accessible workspaces"
  ON speaker_communications FOR ALL
  USING (public.has_workspace_access(workspace_id))
  WITH CHECK (public.has_workspace_access(workspace_id));

-- RLS policies for speaker_sessions
CREATE POLICY "Users can view speaker sessions for accessible workspaces"
  ON speaker_sessions FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can manage speaker sessions for accessible workspaces"
  ON speaker_sessions FOR ALL
  USING (public.has_workspace_access(workspace_id))
  WITH CHECK (public.has_workspace_access(workspace_id));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_speaker_travel_speaker ON speaker_travel(speaker_id);
CREATE INDEX IF NOT EXISTS idx_speaker_travel_workspace ON speaker_travel(workspace_id);
CREATE INDEX IF NOT EXISTS idx_speaker_communications_speaker ON speaker_communications(speaker_id);
CREATE INDEX IF NOT EXISTS idx_speaker_communications_workspace ON speaker_communications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_speaker_sessions_speaker ON speaker_sessions(speaker_id);
CREATE INDEX IF NOT EXISTS idx_speaker_sessions_workspace ON speaker_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_speaker_sessions_date ON speaker_sessions(scheduled_date);

-- Update triggers
CREATE TRIGGER set_speaker_travel_updated_at
  BEFORE UPDATE ON speaker_travel
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_speaker_communications_updated_at
  BEFORE UPDATE ON speaker_communications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_speaker_sessions_updated_at
  BEFORE UPDATE ON speaker_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();