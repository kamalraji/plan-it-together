-- Create workspace_equipment table for equipment tracking
CREATE TABLE workspace_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  
  -- Equipment details
  name TEXT NOT NULL,
  equipment_type TEXT NOT NULL DEFAULT 'general',
  serial_number TEXT,
  location TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('passed', 'failed', 'pending', 'testing', 'maintenance')),
  
  -- Assignment
  assigned_to UUID,
  assigned_to_name TEXT,
  
  -- Tracking
  last_tested_at TIMESTAMPTZ,
  last_tested_by UUID,
  last_tested_by_name TEXT,
  next_maintenance_date DATE,
  
  -- Notes
  notes TEXT,
  
  order_index INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workspace_equipment_tests table for test history
CREATE TABLE workspace_equipment_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES workspace_equipment(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Test details
  test_type TEXT DEFAULT 'manual',
  result TEXT NOT NULL CHECK (result IN ('passed', 'failed', 'warning')),
  
  -- Who performed the test
  tested_by UUID,
  tested_by_name TEXT,
  
  -- Details
  notes TEXT,
  metrics JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on workspace_equipment
ALTER TABLE workspace_equipment ENABLE ROW LEVEL SECURITY;

-- RLS policies for workspace_equipment
CREATE POLICY "Users can view equipment in their workspaces"
  ON workspace_equipment FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_equipment.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert equipment in their workspaces"
  ON workspace_equipment FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_equipment.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update equipment in their workspaces"
  ON workspace_equipment FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_equipment.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete equipment in their workspaces"
  ON workspace_equipment FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_equipment.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

-- Enable RLS on workspace_equipment_tests
ALTER TABLE workspace_equipment_tests ENABLE ROW LEVEL SECURITY;

-- RLS policies for workspace_equipment_tests
CREATE POLICY "Users can view equipment tests in their workspaces"
  ON workspace_equipment_tests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_equipment_tests.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert equipment tests in their workspaces"
  ON workspace_equipment_tests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_equipment_tests.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_workspace_equipment_workspace_id ON workspace_equipment(workspace_id);
CREATE INDEX idx_workspace_equipment_event_id ON workspace_equipment(event_id);
CREATE INDEX idx_workspace_equipment_status ON workspace_equipment(status);
CREATE INDEX idx_workspace_equipment_tests_equipment_id ON workspace_equipment_tests(equipment_id);
CREATE INDEX idx_workspace_equipment_tests_workspace_id ON workspace_equipment_tests(workspace_id);

-- Create trigger for updated_at
CREATE TRIGGER update_workspace_equipment_updated_at
  BEFORE UPDATE ON workspace_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();