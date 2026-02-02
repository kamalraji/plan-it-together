-- Create workspace_vip_guests table for VIP tracking
CREATE TABLE public.workspace_vip_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  vip_level TEXT DEFAULT 'standard',
  dietary_requirements TEXT,
  accessibility_needs TEXT,
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  escort_assigned TEXT,
  seating_assignment TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workspace_team_briefings table for team briefings
CREATE TABLE public.workspace_team_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  briefing_type TEXT DEFAULT 'general',
  scheduled_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  duration_minutes INTEGER DEFAULT 30,
  agenda TEXT,
  materials_url TEXT,
  status TEXT DEFAULT 'scheduled',
  attendees JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_vip_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_team_briefings ENABLE ROW LEVEL SECURITY;

-- VIP Guests policies
CREATE POLICY "Team members can view VIP guests"
  ON public.workspace_vip_guests FOR SELECT
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Team members can insert VIP guests"
  ON public.workspace_vip_guests FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Team members can update VIP guests"
  ON public.workspace_vip_guests FOR UPDATE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Team members can delete VIP guests"
  ON public.workspace_vip_guests FOR DELETE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

-- Team Briefings policies
CREATE POLICY "Team members can view briefings"
  ON public.workspace_team_briefings FOR SELECT
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Team members can insert briefings"
  ON public.workspace_team_briefings FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Team members can update briefings"
  ON public.workspace_team_briefings FOR UPDATE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Team members can delete briefings"
  ON public.workspace_team_briefings FOR DELETE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

-- Indexes for performance
CREATE INDEX idx_vip_guests_workspace ON public.workspace_vip_guests(workspace_id);
CREATE INDEX idx_vip_guests_status ON public.workspace_vip_guests(status);
CREATE INDEX idx_vip_guests_vip_level ON public.workspace_vip_guests(vip_level);
CREATE INDEX idx_team_briefings_workspace ON public.workspace_team_briefings(workspace_id);
CREATE INDEX idx_team_briefings_status ON public.workspace_team_briefings(status);
CREATE INDEX idx_team_briefings_scheduled ON public.workspace_team_briefings(scheduled_at);

-- Triggers for updated_at
CREATE TRIGGER set_vip_guests_updated_at
  BEFORE UPDATE ON public.workspace_vip_guests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_team_briefings_updated_at
  BEFORE UPDATE ON public.workspace_team_briefings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();