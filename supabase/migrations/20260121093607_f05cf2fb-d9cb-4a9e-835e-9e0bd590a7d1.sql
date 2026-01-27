-- Fix legacy role values in workspace_team_members table
-- This updates any records using legacy role strings to the correct WorkspaceRole enum values

-- Update legacy 'OWNER' to 'WORKSPACE_OWNER'
UPDATE workspace_team_members
SET role = 'WORKSPACE_OWNER'
WHERE role = 'OWNER';

-- Update legacy 'LEAD' to 'EVENT_LEAD' (default lead role)
UPDATE workspace_team_members
SET role = 'EVENT_LEAD'
WHERE role = 'LEAD';

-- Update legacy 'COORDINATOR' or 'member' to 'VOLUNTEER_COORDINATOR'
UPDATE workspace_team_members
SET role = 'VOLUNTEER_COORDINATOR'
WHERE role IN ('COORDINATOR', 'member');