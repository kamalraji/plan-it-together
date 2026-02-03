-- External Integrations Tables

-- External Integration Connections
CREATE TABLE workspace_external_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('google_calendar', 'github', 'jira', 'zapier')),
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  credentials JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error', 'success')),
  sync_error TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, integration_type, name)
);

-- Zapier Webhook Endpoints
CREATE TABLE workspace_zapier_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('task_created', 'task_completed', 'task_updated', 'member_joined', 'message_sent', 'document_created', 'custom')),
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync Logs for tracking integration activity
CREATE TABLE integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES workspace_external_integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'error')),
  items_synced INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GitHub Issue Links
CREATE TABLE workspace_github_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  task_id UUID REFERENCES workspace_tasks(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES workspace_external_integrations(id) ON DELETE CASCADE,
  github_repo TEXT NOT NULL,
  github_issue_number INTEGER NOT NULL,
  github_issue_url TEXT NOT NULL,
  github_issue_state TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Event Links
CREATE TABLE workspace_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  task_id UUID REFERENCES workspace_tasks(id) ON DELETE SET NULL,
  integration_id UUID REFERENCES workspace_external_integrations(id) ON DELETE CASCADE,
  external_event_id TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_start TIMESTAMPTZ NOT NULL,
  event_end TIMESTAMPTZ,
  event_url TEXT,
  is_all_day BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE workspace_external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_zapier_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_github_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_calendar_events ENABLE ROW LEVEL SECURITY;

-- Integration policies
CREATE POLICY "Users can view integrations in their workspaces" ON workspace_external_integrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_external_integrations.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage integrations" ON workspace_external_integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_external_integrations.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.role IN ('owner', 'admin', 'lead')
    )
  );

-- Zapier webhook policies
CREATE POLICY "Users can view zapier webhooks" ON workspace_zapier_webhooks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_zapier_webhooks.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage zapier webhooks" ON workspace_zapier_webhooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_zapier_webhooks.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.role IN ('owner', 'admin', 'lead')
    )
  );

-- Sync log policies
CREATE POLICY "Users can view sync logs" ON integration_sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_external_integrations wei
      JOIN workspace_team_members wtm ON wtm.workspace_id = wei.workspace_id
      WHERE wei.id = integration_sync_logs.integration_id
      AND wtm.user_id = auth.uid()
    )
  );

-- GitHub link policies
CREATE POLICY "Users can view github links" ON workspace_github_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_github_links.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage github links" ON workspace_github_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_github_links.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

-- Calendar event policies
CREATE POLICY "Users can view calendar events" ON workspace_calendar_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_calendar_events.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage calendar events" ON workspace_calendar_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_calendar_events.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_external_integrations_workspace ON workspace_external_integrations(workspace_id);
CREATE INDEX idx_zapier_webhooks_workspace ON workspace_zapier_webhooks(workspace_id);
CREATE INDEX idx_sync_logs_integration ON integration_sync_logs(integration_id);
CREATE INDEX idx_github_links_task ON workspace_github_links(task_id);
CREATE INDEX idx_calendar_events_task ON workspace_calendar_events(task_id);

-- Trigger for updated_at
CREATE TRIGGER update_external_integrations_updated_at
  BEFORE UPDATE ON workspace_external_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();