-- Change default role from invalid 'member' to valid 'VOLUNTEER_COORDINATOR'
ALTER TABLE workspace_team_members 
ALTER COLUMN role SET DEFAULT 'VOLUNTEER_COORDINATOR';