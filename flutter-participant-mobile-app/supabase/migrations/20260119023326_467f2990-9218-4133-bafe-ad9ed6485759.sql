-- Add presence columns to impact_profiles if not exists
ALTER TABLE impact_profiles 
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();

-- Add message management columns to messages if not exists
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  blocked_user_id uuid NOT NULL,
  blocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);

-- Enable RLS on blocked_users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS policy for blocked_users
CREATE POLICY "Users can manage their own blocks" ON blocked_users
  FOR ALL USING (auth.uid() = user_id);

-- Add muting columns to channel_members if not exists
ALTER TABLE channel_members 
ADD COLUMN IF NOT EXISTS is_muted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS muted_until timestamptz,
ADD COLUMN IF NOT EXISTS cleared_at timestamptz;

-- Create index for faster blocked user lookups
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON blocked_users(blocked_user_id);

-- Create index for presence queries
CREATE INDEX IF NOT EXISTS idx_impact_profiles_is_online ON impact_profiles(is_online) WHERE is_online = true;