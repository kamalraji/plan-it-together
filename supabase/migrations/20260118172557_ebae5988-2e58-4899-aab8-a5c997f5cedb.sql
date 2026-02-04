-- Create workspace_software_licenses table for IT license management
CREATE TABLE public.workspace_software_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  
  -- License details
  name TEXT NOT NULL,
  vendor TEXT,
  version TEXT,
  license_key TEXT,
  license_type TEXT DEFAULT 'subscription' CHECK (license_type IN ('perpetual', 'subscription', 'trial', 'open_source')),
  
  -- Seat management
  total_seats INTEGER DEFAULT 1,
  used_seats INTEGER DEFAULT 0,
  
  -- Financial tracking
  cost_per_seat DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Expiry management
  purchase_date DATE,
  expiry_date DATE,
  renewal_date DATE,
  auto_renew BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expiring', 'expired', 'suspended')),
  
  -- Alert configuration
  expiry_alert_days INTEGER DEFAULT 30,
  seat_alert_threshold INTEGER DEFAULT 80,
  
  -- Assignment tracking
  assigned_to_department TEXT,
  primary_contact_name TEXT,
  
  -- Notes and documentation
  notes TEXT,
  documentation_url TEXT,
  
  -- Audit tracking
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_software_licenses_workspace ON public.workspace_software_licenses(workspace_id);
CREATE INDEX idx_software_licenses_status ON public.workspace_software_licenses(status);
CREATE INDEX idx_software_licenses_expiry ON public.workspace_software_licenses(expiry_date);

-- Enable RLS
ALTER TABLE public.workspace_software_licenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view licenses in their workspaces"
ON public.workspace_software_licenses
FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can create licenses in their workspaces"
ON public.workspace_software_licenses
FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can update licenses in their workspaces"
ON public.workspace_software_licenses
FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can delete licenses in their workspaces"
ON public.workspace_software_licenses
FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- Auto-update trigger for updated_at
CREATE TRIGGER set_software_licenses_updated_at
BEFORE UPDATE ON public.workspace_software_licenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_software_licenses;