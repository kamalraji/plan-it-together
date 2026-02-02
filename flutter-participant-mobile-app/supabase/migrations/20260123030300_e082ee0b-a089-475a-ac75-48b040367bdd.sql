-- Create pinned_conversations table for cross-device sync
-- Local storage is primary, server is backup for cross-device consistency
CREATE TABLE IF NOT EXISTS public.pinned_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Create archived_conversations table
CREATE TABLE IF NOT EXISTS public.archived_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Enable RLS on both tables
ALTER TABLE public.pinned_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for pinned_conversations
CREATE POLICY "Users can view own pinned conversations"
  ON public.pinned_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pinned conversations"
  ON public.pinned_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pinned conversations"
  ON public.pinned_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for archived_conversations
CREATE POLICY "Users can view own archived conversations"
  ON public.archived_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own archived conversations"
  ON public.archived_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own archived conversations"
  ON public.archived_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_pinned_conversations_user_id 
  ON public.pinned_conversations(user_id);
  
CREATE INDEX IF NOT EXISTS idx_archived_conversations_user_id 
  ON public.archived_conversations(user_id);