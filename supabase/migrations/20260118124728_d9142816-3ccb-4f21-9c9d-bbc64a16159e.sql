-- Create workspace_network_zones table for network monitoring
CREATE TABLE public.workspace_network_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  
  -- Zone details
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  zone_type TEXT DEFAULT 'wifi' CHECK (zone_type IN ('wifi', 'wired', 'av', 'staff', 'guest', 'backup')),
  
  -- Capacity configuration
  max_devices INTEGER DEFAULT 100,
  max_bandwidth_mbps INTEGER DEFAULT 1000,
  
  -- Real-time metrics (updated by technicians)
  current_devices INTEGER DEFAULT 0,
  current_bandwidth_percent INTEGER DEFAULT 0 CHECK (current_bandwidth_percent >= 0 AND current_bandwidth_percent <= 100),
  
  -- Status tracking
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'degraded', 'maintenance')),
  status_message TEXT,
  
  -- Alert thresholds
  device_alert_threshold INTEGER DEFAULT 80, -- Alert when device count reaches X% of max
  bandwidth_alert_threshold INTEGER DEFAULT 80, -- Alert when bandwidth reaches X%
  
  -- Network configuration
  ssid TEXT,
  ip_range TEXT,
  vlan_id INTEGER,
  
  -- Tracking
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_by UUID REFERENCES auth.users(id),
  last_checked_by_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_network_zones_workspace ON public.workspace_network_zones(workspace_id);
CREATE INDEX idx_network_zones_status ON public.workspace_network_zones(status);
CREATE INDEX idx_network_zones_event ON public.workspace_network_zones(event_id);

-- Enable RLS
ALTER TABLE public.workspace_network_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workspace members can view network zones"
  ON public.workspace_network_zones
  FOR SELECT
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can insert network zones"
  ON public.workspace_network_zones
  FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can update network zones"
  ON public.workspace_network_zones
  FOR UPDATE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace members can delete network zones"
  ON public.workspace_network_zones
  FOR DELETE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER set_network_zones_updated_at
  BEFORE UPDATE ON public.workspace_network_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();