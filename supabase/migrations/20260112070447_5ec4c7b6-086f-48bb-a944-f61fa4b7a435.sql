-- Track which workspace is responsible for event page building
CREATE TABLE workspace_page_responsibilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  responsibility_type text NOT NULL DEFAULT 'LANDING_PAGE',
  assigned_by uuid,
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'ACTIVE',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(event_id, responsibility_type)
);

-- Track page sections for collaborative editing
CREATE TABLE page_builder_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  section_id text NOT NULL,
  owned_by_workspace_id uuid REFERENCES workspaces(id),
  locked_by_user_id uuid,
  locked_at timestamptz,
  html_content text,
  css_content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(event_id, section_id)
);

-- Audit trail for page changes
CREATE TABLE page_builder_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  workspace_id uuid REFERENCES workspaces(id),
  user_id uuid,
  action_type text NOT NULL,
  section_id text,
  previous_content jsonb,
  new_content jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE workspace_page_responsibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_builder_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_builder_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_page_responsibilities
CREATE POLICY "Users can view responsibilities for their workspaces"
  ON workspace_page_responsibilities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_page_responsibilities.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
    OR
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_page_responsibilities.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can insert responsibilities"
  ON workspace_page_responsibilities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_page_responsibilities.workspace_id
      AND w.organizer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM workspaces w
      JOIN workspaces parent ON w.parent_workspace_id = parent.id
      WHERE w.id = workspace_page_responsibilities.workspace_id
      AND parent.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can update responsibilities"
  ON workspace_page_responsibilities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_page_responsibilities.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can delete responsibilities"
  ON workspace_page_responsibilities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_page_responsibilities.workspace_id
      AND w.organizer_id = auth.uid()
    )
  );

-- RLS Policies for page_builder_sections
CREATE POLICY "Users can view sections for events they have access to"
  ON page_builder_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_page_responsibilities wpr
      JOIN workspace_team_members wtm ON wtm.workspace_id = wpr.workspace_id
      WHERE wpr.event_id = page_builder_sections.event_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
  );

CREATE POLICY "Users can manage sections for events they are responsible for"
  ON page_builder_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_page_responsibilities wpr
      JOIN workspace_team_members wtm ON wtm.workspace_id = wpr.workspace_id
      WHERE wpr.event_id = page_builder_sections.event_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
  );

-- RLS Policies for page_builder_history
CREATE POLICY "Users can view history for events they have access to"
  ON page_builder_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_page_responsibilities wpr
      JOIN workspace_team_members wtm ON wtm.workspace_id = wpr.workspace_id
      WHERE wpr.event_id = page_builder_history.event_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
  );

CREATE POLICY "Users can insert history for events they are responsible for"
  ON page_builder_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_page_responsibilities wpr
      JOIN workspace_team_members wtm ON wtm.workspace_id = wpr.workspace_id
      WHERE wpr.event_id = page_builder_history.event_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
  );

-- Indexes
CREATE INDEX idx_page_responsibilities_event ON workspace_page_responsibilities(event_id);
CREATE INDEX idx_page_responsibilities_workspace ON workspace_page_responsibilities(workspace_id);
CREATE INDEX idx_page_responsibilities_status ON workspace_page_responsibilities(status);
CREATE INDEX idx_page_sections_event ON page_builder_sections(event_id);
CREATE INDEX idx_page_sections_locked ON page_builder_sections(locked_by_user_id) WHERE locked_by_user_id IS NOT NULL;
CREATE INDEX idx_page_history_event ON page_builder_history(event_id);
CREATE INDEX idx_page_history_workspace ON page_builder_history(workspace_id);
CREATE INDEX idx_page_history_created ON page_builder_history(created_at DESC);

-- Update timestamp trigger
CREATE TRIGGER update_workspace_page_responsibilities_updated_at
  BEFORE UPDATE ON workspace_page_responsibilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_builder_sections_updated_at
  BEFORE UPDATE ON page_builder_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();