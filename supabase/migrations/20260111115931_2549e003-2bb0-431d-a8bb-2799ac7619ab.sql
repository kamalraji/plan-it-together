-- Create workspace_incidents table for incident tracking
CREATE TABLE public.workspace_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  location TEXT,
  reported_by UUID REFERENCES auth.users(id),
  reported_by_name TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_to_name TEXT,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace_logistics table for shipment/delivery tracking
CREATE TABLE public.workspace_logistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  carrier TEXT,
  tracking_number TEXT,
  origin TEXT,
  destination TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  eta TIMESTAMP WITH TIME ZONE,
  actual_arrival TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  priority TEXT DEFAULT 'normal',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace_facility_checks table for facility inspection tracking
CREATE TABLE public.workspace_facility_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  item TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  checked_by UUID REFERENCES auth.users(id),
  checked_by_name TEXT,
  checked_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace_event_briefings table for day-of schedule items
CREATE TABLE public.workspace_event_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  scheduled_time TIME NOT NULL,
  activity TEXT NOT NULL,
  location TEXT,
  lead_name TEXT,
  lead_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'upcoming',
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  event_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.workspace_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_logistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_facility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_event_briefings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workspace_incidents
CREATE POLICY "Team members can view incidents" ON public.workspace_incidents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_incidents.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_incidents.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create incidents" ON public.workspace_incidents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_incidents.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_incidents.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team managers can update incidents" ON public.workspace_incidents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_incidents.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD')
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_incidents.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team managers can delete incidents" ON public.workspace_incidents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_incidents.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD')
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_incidents.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

-- Create RLS policies for workspace_logistics
CREATE POLICY "Team members can view logistics" ON public.workspace_logistics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_logistics.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_logistics.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create logistics" ON public.workspace_logistics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_logistics.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_logistics.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team managers can update logistics" ON public.workspace_logistics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_logistics.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD')
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_logistics.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team managers can delete logistics" ON public.workspace_logistics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_logistics.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD')
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_logistics.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

-- Create RLS policies for workspace_facility_checks
CREATE POLICY "Team members can view facility checks" ON public.workspace_facility_checks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_facility_checks.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_facility_checks.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create facility checks" ON public.workspace_facility_checks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_facility_checks.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_facility_checks.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team managers can update facility checks" ON public.workspace_facility_checks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_facility_checks.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD')
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_facility_checks.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team managers can delete facility checks" ON public.workspace_facility_checks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_facility_checks.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD')
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_facility_checks.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

-- Create RLS policies for workspace_event_briefings
CREATE POLICY "Team members can view event briefings" ON public.workspace_event_briefings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_event_briefings.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_event_briefings.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create event briefings" ON public.workspace_event_briefings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_event_briefings.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_event_briefings.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team managers can update event briefings" ON public.workspace_event_briefings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_event_briefings.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD')
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_event_briefings.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Team managers can delete event briefings" ON public.workspace_event_briefings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_event_briefings.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD')
    ) OR EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_event_briefings.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX idx_workspace_incidents_workspace_id ON public.workspace_incidents(workspace_id);
CREATE INDEX idx_workspace_incidents_status ON public.workspace_incidents(status);
CREATE INDEX idx_workspace_logistics_workspace_id ON public.workspace_logistics(workspace_id);
CREATE INDEX idx_workspace_logistics_status ON public.workspace_logistics(status);
CREATE INDEX idx_workspace_facility_checks_workspace_id ON public.workspace_facility_checks(workspace_id);
CREATE INDEX idx_workspace_facility_checks_area ON public.workspace_facility_checks(area);
CREATE INDEX idx_workspace_event_briefings_workspace_id ON public.workspace_event_briefings(workspace_id);
CREATE INDEX idx_workspace_event_briefings_event_date ON public.workspace_event_briefings(event_date);

-- Create updated_at triggers
CREATE TRIGGER set_workspace_incidents_updated_at
  BEFORE UPDATE ON public.workspace_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_workspace_logistics_updated_at
  BEFORE UPDATE ON public.workspace_logistics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_workspace_facility_checks_updated_at
  BEFORE UPDATE ON public.workspace_facility_checks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_workspace_event_briefings_updated_at
  BEFORE UPDATE ON public.workspace_event_briefings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();