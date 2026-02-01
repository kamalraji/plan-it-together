
-- Phase 1: Enhance workspace_incidents for Technical Incident Log
ALTER TABLE workspace_incidents ADD COLUMN IF NOT EXISTS incident_type TEXT DEFAULT 'general';
ALTER TABLE workspace_incidents ADD COLUMN IF NOT EXISTS affected_systems TEXT[];
ALTER TABLE workspace_incidents ADD COLUMN IF NOT EXISTS root_cause TEXT;
ALTER TABLE workspace_incidents ADD COLUMN IF NOT EXISTS impact_assessment TEXT;
ALTER TABLE workspace_incidents ADD COLUMN IF NOT EXISTS time_to_resolve_minutes INTEGER;
ALTER TABLE workspace_incidents ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE workspace_incidents ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE workspace_incidents ADD COLUMN IF NOT EXISTS post_event_notes TEXT;
ALTER TABLE workspace_incidents ADD COLUMN IF NOT EXISTS lessons_learned TEXT;
ALTER TABLE workspace_incidents ADD COLUMN IF NOT EXISTS preventive_actions TEXT;
ALTER TABLE workspace_incidents ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE workspace_incidents ADD COLUMN IF NOT EXISTS related_incident_id UUID;

-- Phase 2: Equipment Checkout System
CREATE TABLE workspace_equipment_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES workspace_equipment(id) ON DELETE CASCADE,
  borrowed_by_workspace_id UUID REFERENCES workspaces(id),
  borrowed_by_user_id UUID,
  borrowed_by_name TEXT NOT NULL,
  borrowed_by_committee TEXT,
  checkout_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_return_date TIMESTAMPTZ NOT NULL,
  actual_return_date TIMESTAMPTZ,
  status TEXT DEFAULT 'checked_out' CHECK (status IN ('checked_out', 'returned', 'overdue', 'lost', 'damaged')),
  condition_at_checkout TEXT DEFAULT 'good' CHECK (condition_at_checkout IN ('excellent', 'good', 'fair', 'poor')),
  condition_at_return TEXT CHECK (condition_at_return IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  checkout_notes TEXT,
  return_notes TEXT,
  damage_description TEXT,
  checked_out_by UUID,
  returned_to UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipment_checkouts_workspace ON workspace_equipment_checkouts(workspace_id);
CREATE INDEX idx_equipment_checkouts_equipment ON workspace_equipment_checkouts(equipment_id);
CREATE INDEX idx_equipment_checkouts_status ON workspace_equipment_checkouts(status);

ALTER TABLE workspace_equipment_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace team can view checkouts"
  ON workspace_equipment_checkouts FOR SELECT
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can insert checkouts"
  ON workspace_equipment_checkouts FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can update checkouts"
  ON workspace_equipment_checkouts FOR UPDATE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can delete checkouts"
  ON workspace_equipment_checkouts FOR DELETE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

-- Phase 3: Power Distribution Tracking
CREATE TABLE workspace_power_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  zone_type TEXT DEFAULT 'standard' CHECK (zone_type IN ('standard', 'high_power', 'backup', 'generator', 'ups')),
  total_capacity_amps INTEGER,
  allocated_amps INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'overloaded', 'fault', 'maintenance')),
  is_generator_backed BOOLEAN DEFAULT false,
  generator_id TEXT,
  fuel_level_percent INTEGER,
  notes TEXT,
  emergency_procedure TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_power_circuits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES workspace_power_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  circuit_number TEXT,
  rated_amps INTEGER NOT NULL,
  current_load_amps INTEGER DEFAULT 0,
  assigned_to TEXT,
  equipment_connected TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'tripped', 'overloaded', 'reserved')),
  last_checked_at TIMESTAMPTZ,
  last_checked_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_power_zones_workspace ON workspace_power_zones(workspace_id);
CREATE INDEX idx_power_circuits_workspace ON workspace_power_circuits(workspace_id);
CREATE INDEX idx_power_circuits_zone ON workspace_power_circuits(zone_id);

ALTER TABLE workspace_power_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_power_circuits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace team can manage power zones"
  ON workspace_power_zones FOR ALL
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can manage power circuits"
  ON workspace_power_circuits FOR ALL
  USING (public.has_workspace_access(workspace_id, auth.uid()));

-- Phase 4: Backup & Contingency Checklists
CREATE TABLE workspace_backup_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  primary_equipment_id UUID REFERENCES workspace_equipment(id),
  location TEXT,
  status TEXT DEFAULT 'ready' CHECK (status IN ('ready', 'deployed', 'in_use', 'maintenance', 'unavailable')),
  last_tested_at TIMESTAMPTZ,
  last_tested_by TEXT,
  test_result TEXT CHECK (test_result IN ('passed', 'failed', 'warning')),
  deployed_at TIMESTAMPTZ,
  deployed_for TEXT,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_contingency_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('power_failure', 'network_failure', 'av_failure', 'equipment_failure', 'weather', 'security', 'medical', 'evacuation', 'other')),
  trigger_condition TEXT NOT NULL,
  procedure_steps JSONB NOT NULL DEFAULT '[]',
  recovery_time_objective_minutes INTEGER,
  primary_contact_name TEXT,
  primary_contact_phone TEXT,
  secondary_contact_name TEXT,
  secondary_contact_phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  last_drill_at TIMESTAMPTZ,
  related_equipment TEXT[],
  related_zones TEXT[],
  priority INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backup_equipment_workspace ON workspace_backup_equipment(workspace_id);
CREATE INDEX idx_contingency_procedures_workspace ON workspace_contingency_procedures(workspace_id);

ALTER TABLE workspace_backup_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_contingency_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace team can manage backup equipment"
  ON workspace_backup_equipment FOR ALL
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can manage contingency procedures"
  ON workspace_contingency_procedures FOR ALL
  USING (public.has_workspace_access(workspace_id, auth.uid()));
