-- ============================================
-- E2E ENCRYPTION SCHEMA
-- User encryption keys and group key management
-- ============================================

-- User encryption keys table
CREATE TABLE IF NOT EXISTS public.user_encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  public_key TEXT NOT NULL,
  key_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, key_id)
);

-- Enable RLS
ALTER TABLE public.user_encryption_keys ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can read public keys (needed for encryption)
CREATE POLICY "Public keys are readable by authenticated users"
  ON public.user_encryption_keys
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert/update their own keys
CREATE POLICY "Users can insert their own keys"
  ON public.user_encryption_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keys"
  ON public.user_encryption_keys
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keys"
  ON public.user_encryption_keys
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_encryption_keys_user_id 
  ON public.user_encryption_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_encryption_keys_active 
  ON public.user_encryption_keys(user_id, is_active) WHERE is_active = true;

-- ============================================
-- Group encryption keys table
-- Stores group symmetric key encrypted for each member
-- ============================================

CREATE TABLE IF NOT EXISTS public.group_encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL,
  encrypted_key TEXT NOT NULL,
  nonce TEXT NOT NULL,
  sender_public_key TEXT NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, member_id, key_version)
);

-- Enable RLS
ALTER TABLE public.group_encryption_keys ENABLE ROW LEVEL SECURITY;

-- Members can read their own encrypted group keys
CREATE POLICY "Members can read their own group keys"
  ON public.group_encryption_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = member_id);

-- Group admins can insert keys for members
CREATE POLICY "Group admins can insert keys"
  ON public.group_encryption_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE chat_group_members.group_id = group_encryption_keys.group_id
      AND chat_group_members.user_id = auth.uid()
      AND chat_group_members.role IN ('owner', 'admin')
    )
  );

-- Group admins can delete keys (for key rotation)
CREATE POLICY "Group admins can delete keys"
  ON public.group_encryption_keys
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_group_members
      WHERE chat_group_members.group_id = group_encryption_keys.group_id
      AND chat_group_members.user_id = auth.uid()
      AND chat_group_members.role IN ('owner', 'admin')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_encryption_keys_group 
  ON public.group_encryption_keys(group_id);
CREATE INDEX IF NOT EXISTS idx_group_encryption_keys_member 
  ON public.group_encryption_keys(member_id);

-- ============================================
-- Add encryption columns to channel_messages
-- ============================================

ALTER TABLE public.channel_messages 
  ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sender_public_key TEXT,
  ADD COLUMN IF NOT EXISTS nonce TEXT;

-- Index for filtering encrypted messages
CREATE INDEX IF NOT EXISTS idx_channel_messages_encrypted 
  ON public.channel_messages(channel_id, is_encrypted);

-- ============================================
-- Add encryption columns to group_messages (if exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'group_messages') THEN
    ALTER TABLE public.group_messages 
      ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS sender_public_key TEXT,
      ADD COLUMN IF NOT EXISTS nonce TEXT;
  END IF;
END $$;