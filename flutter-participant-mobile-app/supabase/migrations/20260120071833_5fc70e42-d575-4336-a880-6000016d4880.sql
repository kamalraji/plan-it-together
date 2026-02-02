-- Pinned Messages Table
CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL,
  pinned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, message_id)
);

-- Enable RLS
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

-- Policies for pinned messages
CREATE POLICY "Users can view pinned messages in channels"
  ON public.pinned_messages FOR SELECT USING (true);

CREATE POLICY "Users can pin messages"
  ON public.pinned_messages FOR INSERT
  WITH CHECK (auth.uid() = pinned_by);

CREATE POLICY "Pinners can unpin their messages"
  ON public.pinned_messages FOR DELETE
  USING (auth.uid() = pinned_by);

-- Starred Messages Table (personal bookmarks)
CREATE TABLE IF NOT EXISTS public.starred_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  starred_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- Enable RLS
ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;

-- Policies for starred messages
CREATE POLICY "Users can view their starred messages"
  ON public.starred_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can star messages"
  ON public.starred_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar messages"
  ON public.starred_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Voice Messages Table
CREATE TABLE IF NOT EXISTS public.voice_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  waveform_data JSONB,
  transcription TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view voice messages"
  ON public.voice_messages FOR SELECT USING (true);

CREATE POLICY "Users can create voice messages"
  ON public.voice_messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add full-text search index to messages
CREATE INDEX IF NOT EXISTS idx_messages_content_search 
  ON public.messages USING gin(to_tsvector('english', content));

-- Add index for channel messages
CREATE INDEX IF NOT EXISTS idx_messages_channel_sent 
  ON public.messages(channel_id, sent_at DESC);

-- Create function to search messages by username
CREATE OR REPLACE FUNCTION public.search_messages_by_username(
  _channel_id TEXT,
  _search_term TEXT,
  _limit INTEGER DEFAULT 50
) RETURNS TABLE (
  id UUID,
  channel_id TEXT,
  sender_id UUID,
  sender_name TEXT,
  sender_avatar TEXT,
  content TEXT,
  sent_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.channel_id,
    m.sender_id,
    m.sender_name,
    m.sender_avatar,
    m.content,
    m.sent_at
  FROM public.messages m
  WHERE m.channel_id = _channel_id
    AND (
      m.content ILIKE '%' || _search_term || '%'
      OR m.sender_name ILIKE '%' || _search_term || '%'
    )
  ORDER BY m.sent_at DESC
  LIMIT _limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;