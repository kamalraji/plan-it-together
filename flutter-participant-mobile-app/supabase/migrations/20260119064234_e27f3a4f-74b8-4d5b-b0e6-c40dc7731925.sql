-- Add chat_group_id to hackathon_teams to link with existing chat system
ALTER TABLE hackathon_teams 
ADD COLUMN chat_group_id UUID REFERENCES chat_groups(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_hackathon_teams_chat_group ON hackathon_teams(chat_group_id);