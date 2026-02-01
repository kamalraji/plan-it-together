-- Workspace channels for real-time messaging
CREATE TABLE IF NOT EXISTS workspace_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'announcement', 'private', 'task')),
  is_private BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Channel messages with realtime enabled
CREATE TABLE channel_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES workspace_channels(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  sender_name TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'task_update', 'system', 'broadcast')),
  attachments JSONB DEFAULT '[]',
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Channel members for presence and read tracking
CREATE TABLE channel_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES workspace_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE channel_messages;
ALTER TABLE channel_messages REPLICA IDENTITY FULL;

-- Indexes for performance
CREATE INDEX idx_channel_messages_channel_id ON channel_messages(channel_id);
CREATE INDEX idx_channel_messages_created_at ON channel_messages(created_at DESC);
CREATE INDEX idx_workspace_channels_workspace_id ON workspace_channels(workspace_id);
CREATE INDEX idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX idx_channel_members_user_id ON channel_members(user_id);

-- RLS policies
ALTER TABLE workspace_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- Workspace channels policies
CREATE POLICY "Users can view channels in their workspaces"
  ON workspace_channels FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_team_members WHERE user_id = auth.uid() AND status = 'ACTIVE'
    ) OR
    workspace_id IN (
      SELECT id FROM workspaces WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create channels"
  ON workspace_channels FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_team_members WHERE user_id = auth.uid() AND status = 'ACTIVE'
    ) OR
    workspace_id IN (
      SELECT id FROM workspaces WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "Channel creators and workspace owners can update channels"
  ON workspace_channels FOR UPDATE
  USING (
    created_by = auth.uid() OR
    workspace_id IN (
      SELECT id FROM workspaces WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "Channel creators and workspace owners can delete channels"
  ON workspace_channels FOR DELETE
  USING (
    created_by = auth.uid() OR
    workspace_id IN (
      SELECT id FROM workspaces WHERE organizer_id = auth.uid()
    )
  );

-- Channel messages policies
CREATE POLICY "Channel members can view messages"
  ON channel_messages FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM workspace_channels WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_team_members WHERE user_id = auth.uid() AND status = 'ACTIVE'
      )
    ) OR
    channel_id IN (
      SELECT id FROM workspace_channels WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE organizer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Channel members can send messages"
  ON channel_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND (
      channel_id IN (
        SELECT id FROM workspace_channels WHERE workspace_id IN (
          SELECT workspace_id FROM workspace_team_members WHERE user_id = auth.uid() AND status = 'ACTIVE'
        )
      ) OR
      channel_id IN (
        SELECT id FROM workspace_channels WHERE workspace_id IN (
          SELECT id FROM workspaces WHERE organizer_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Message senders can update their messages"
  ON channel_messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Message senders can delete their messages"
  ON channel_messages FOR DELETE
  USING (sender_id = auth.uid());

-- Channel members policies
CREATE POLICY "Users can view channel members"
  ON channel_members FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM workspace_channels WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_team_members WHERE user_id = auth.uid() AND status = 'ACTIVE'
      )
    ) OR
    channel_id IN (
      SELECT id FROM workspace_channels WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE organizer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can join channels"
  ON channel_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their membership"
  ON channel_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can leave channels"
  ON channel_members FOR DELETE
  USING (user_id = auth.uid());

-- Trigger to update updated_at
CREATE TRIGGER set_workspace_channels_updated_at
  BEFORE UPDATE ON workspace_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();