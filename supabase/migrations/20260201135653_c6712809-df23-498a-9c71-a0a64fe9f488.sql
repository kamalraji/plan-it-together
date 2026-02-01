-- Sprint 4: Message Threading and Reactions Support
-- Add parent_message_id for threaded replies
ALTER TABLE channel_messages 
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES channel_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reply_count INT DEFAULT 0;

-- Create index for efficient thread lookups
CREATE INDEX IF NOT EXISTS idx_channel_messages_parent ON channel_messages(parent_message_id) WHERE parent_message_id IS NOT NULL;

-- Create message_reactions table for emoji reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES channel_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS on message_reactions
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reactions on messages in channels they're members of
CREATE POLICY "View reactions in member channels" 
ON message_reactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM channel_messages cm
    JOIN channel_members cmem ON cmem.channel_id = cm.channel_id
    WHERE cm.id = message_reactions.message_id
    AND cmem.user_id = auth.uid()
  )
);

-- Policy: Users can add their own reactions
CREATE POLICY "Add own reactions" 
ON message_reactions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Policy: Users can remove their own reactions
CREATE POLICY "Remove own reactions" 
ON message_reactions 
FOR DELETE 
USING (user_id = auth.uid());

-- Create index for efficient reaction lookups
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);

-- Function to update reply count when a reply is added
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    UPDATE channel_messages 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.parent_message_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for updating reply count on new messages
DROP TRIGGER IF EXISTS trigger_update_reply_count ON channel_messages;
CREATE TRIGGER trigger_update_reply_count
AFTER INSERT ON channel_messages
FOR EACH ROW
EXECUTE FUNCTION update_reply_count();

-- Function to decrement reply count when a reply is deleted
CREATE OR REPLACE FUNCTION decrement_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.parent_message_id IS NOT NULL THEN
    UPDATE channel_messages 
    SET reply_count = GREATEST(0, reply_count - 1) 
    WHERE id = OLD.parent_message_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for decrementing reply count on message deletion
DROP TRIGGER IF EXISTS trigger_decrement_reply_count ON channel_messages;
CREATE TRIGGER trigger_decrement_reply_count
AFTER DELETE ON channel_messages
FOR EACH ROW
EXECUTE FUNCTION decrement_reply_count();