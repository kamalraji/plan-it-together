-- Update any legacy 'OWNER' role values to 'WORKSPACE_OWNER'
UPDATE workspace_team_members 
SET role = 'WORKSPACE_OWNER' 
WHERE role = 'OWNER';