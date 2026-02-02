-- Phase 6: Database Performance Optimization
-- Add missing indexes for common query patterns

-- Workspace queries by event (heavily used for filtering workspaces by event)
CREATE INDEX IF NOT EXISTS idx_workspaces_event_id ON workspaces(event_id);

-- Tasks by assignee (used in task lists, dashboards)
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_assigned_to ON workspace_tasks(assigned_to);

-- Team members by user (used for "my workspaces" and permission checks)
CREATE INDEX IF NOT EXISTS idx_workspace_team_members_user_id ON workspace_team_members(user_id);

-- Workspace team members by workspace (already common but ensure exists)
CREATE INDEX IF NOT EXISTS idx_workspace_team_members_workspace_id ON workspace_team_members(workspace_id);

-- Tasks by workspace (heavily used in workspace views)
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_workspace_id ON workspace_tasks(workspace_id);

-- Registrations by event (used for registration counts)
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);

-- Volunteer assignments by user (used in volunteer roster)
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_user_id ON volunteer_assignments(user_id);

-- Events by organization (used in organizer dashboards)
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);

-- Tasks by status for filtering (common filter operation)
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_status ON workspace_tasks(status);

-- Composite index for workspace tasks (common query pattern)
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_workspace_status ON workspace_tasks(workspace_id, status);

-- Composite index for team members with status
CREATE INDEX IF NOT EXISTS idx_workspace_team_members_workspace_status ON workspace_team_members(workspace_id, status);