-- =============================================
-- Logistics Committee Tables
-- =============================================

-- 1. Transport Schedules Table
CREATE TABLE public.workspace_transport_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  transport_type TEXT NOT NULL DEFAULT 'shuttle',
  departure_time TIMESTAMP WITH TIME ZONE,
  pickup_location TEXT,
  dropoff_location TEXT,
  capacity INTEGER DEFAULT 10,
  passengers_booked INTEGER DEFAULT 0,
  vehicle_info TEXT,
  driver_name TEXT,
  driver_contact TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Logistics Reports Table
CREATE TABLE public.workspace_logistics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  generated_by UUID REFERENCES auth.users(id),
  generated_by_name TEXT,
  date_range_start TIMESTAMP WITH TIME ZONE,
  date_range_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workspace_transport_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_logistics_reports ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_transport_schedules_workspace ON public.workspace_transport_schedules(workspace_id);
CREATE INDEX idx_transport_schedules_status ON public.workspace_transport_schedules(status);
CREATE INDEX idx_transport_schedules_departure ON public.workspace_transport_schedules(departure_time);
CREATE INDEX idx_logistics_reports_workspace ON public.workspace_logistics_reports(workspace_id);
CREATE INDEX idx_logistics_reports_type ON public.workspace_logistics_reports(report_type);

-- Updated at trigger for transport schedules
CREATE TRIGGER set_transport_schedules_updated_at
  BEFORE UPDATE ON public.workspace_transport_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for Transport Schedules
CREATE POLICY "Workspace members can view transport schedules"
  ON public.workspace_transport_schedules
  FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can create transport schedules"
  ON public.workspace_transport_schedules
  FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update transport schedules"
  ON public.workspace_transport_schedules
  FOR UPDATE
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete transport schedules"
  ON public.workspace_transport_schedules
  FOR DELETE
  USING (public.has_workspace_access(workspace_id));

-- RLS Policies for Logistics Reports
CREATE POLICY "Workspace members can view logistics reports"
  ON public.workspace_logistics_reports
  FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can create logistics reports"
  ON public.workspace_logistics_reports
  FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete logistics reports"
  ON public.workspace_logistics_reports
  FOR DELETE
  USING (public.has_workspace_access(workspace_id));