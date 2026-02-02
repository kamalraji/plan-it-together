-- Create event_sessions table for Zone tab attendee-facing sessions
CREATE TABLE public.event_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  speaker_name TEXT,
  speaker_avatar TEXT,
  room TEXT,
  location TEXT,
  track_id UUID REFERENCES public.event_tracks(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'ended')),
  attendee_count INTEGER DEFAULT 0,
  stream_url TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create event_announcements table for Zone tab attendee-facing announcements
CREATE TABLE public.event_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'alert', 'update', 'sponsor', 'schedule')),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  author_avatar TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_event_sessions_event_id ON public.event_sessions(event_id);
CREATE INDEX idx_event_sessions_start_time ON public.event_sessions(start_time);
CREATE INDEX idx_event_sessions_status ON public.event_sessions(status);
CREATE INDEX idx_event_announcements_event_id ON public.event_announcements(event_id);
CREATE INDEX idx_event_announcements_created_at ON public.event_announcements(created_at DESC);

-- Enable RLS
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_sessions
CREATE POLICY "Anyone can view published event sessions"
  ON public.event_sessions FOR SELECT
  USING (is_published = true);

CREATE POLICY "Event owners can manage sessions"
  ON public.event_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_sessions.event_id
      AND e.owner_id = auth.uid()
    )
  );

-- RLS Policies for event_announcements
CREATE POLICY "Anyone can view active event announcements"
  ON public.event_announcements FOR SELECT
  USING (is_active = true);

CREATE POLICY "Event owners can manage announcements"
  ON public.event_announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_announcements.event_id
      AND e.owner_id = auth.uid()
    )
  );

-- Trigger for updated_at on event_sessions
CREATE TRIGGER update_event_sessions_updated_at
  BEFORE UPDATE ON public.event_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();