-- Add group_id column to messages table for group chat support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES chat_groups(id) ON DELETE CASCADE;

-- Create index for efficient group message queries
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);

-- Update messages RLS policy to allow group message access
DROP POLICY IF EXISTS "Users can view messages in their groups" ON messages;
CREATE POLICY "Users can view messages in their groups" ON messages
  FOR SELECT USING (
    group_id IS NULL OR
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE chat_group_members.group_id = messages.group_id
      AND chat_group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their groups" ON messages;
CREATE POLICY "Users can send messages to their groups" ON messages
  FOR INSERT WITH CHECK (
    group_id IS NULL OR
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE chat_group_members.group_id = messages.group_id
      AND chat_group_members.user_id = auth.uid()
    )
  );

-- Create group_events table for tracking group activities
CREATE TABLE IF NOT EXISTS group_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES chat_groups(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  actor_id uuid NOT NULL,
  actor_name text,
  target_id uuid,
  target_name text,
  old_value text,
  new_value text,
  created_at timestamptz DEFAULT now()
);

-- Create index for group events
CREATE INDEX IF NOT EXISTS idx_group_events_group_id ON group_events(group_id);
CREATE INDEX IF NOT EXISTS idx_group_events_created_at ON group_events(created_at DESC);

-- RLS for group_events
ALTER TABLE group_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group members can view events" ON group_events;
CREATE POLICY "Group members can view events" ON group_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE chat_group_members.group_id = group_events.group_id
      AND chat_group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can insert events" ON group_events;
CREATE POLICY "Group members can insert events" ON group_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_group_members
      WHERE chat_group_members.group_id = group_events.group_id
      AND chat_group_members.user_id = auth.uid()
    )
  );