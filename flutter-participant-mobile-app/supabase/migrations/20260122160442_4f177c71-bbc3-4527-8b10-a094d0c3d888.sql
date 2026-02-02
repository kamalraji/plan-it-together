-- Scheduled messages for future sending
CREATE TABLE public.scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Message drafts for auto-save
CREATE TABLE public.message_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  content TEXT,
  attachments JSONB,
  reply_to_message_id UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Auto-reply settings
CREATE TABLE public.auto_reply_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT false,
  message TEXT NOT NULL DEFAULT 'I am currently unavailable and will respond as soon as possible.',
  schedule_start TIME,
  schedule_end TIME,
  active_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  exclude_contacts UUID[],
  rate_limit_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat folders for organization
CREATE TABLE public.chat_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,
  is_muted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Folder membership
CREATE TABLE public.chat_folder_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES public.chat_folders(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(folder_id, channel_id)
);

-- FCM tokens for push notifications
CREATE TABLE public.fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
  device_name TEXT,
  app_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now()
);

-- Message translations cache
CREATE TABLE public.message_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  translated_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, target_language)
);

-- Auto-reply logs to enforce rate limiting
CREATE TABLE public.auto_reply_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_scheduled_messages_status ON public.scheduled_messages(status, scheduled_for);
CREATE INDEX idx_scheduled_messages_sender ON public.scheduled_messages(sender_id);
CREATE INDEX idx_message_drafts_user ON public.message_drafts(user_id);
CREATE INDEX idx_chat_folders_user ON public.chat_folders(user_id, sort_order);
CREATE INDEX idx_fcm_tokens_user ON public.fcm_tokens(user_id);
CREATE INDEX idx_auto_reply_logs_rate ON public.auto_reply_logs(user_id, recipient_id, sent_at);
CREATE INDEX idx_message_translations_message ON public.message_translations(message_id);

-- Enable RLS
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_reply_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_folder_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_reply_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own scheduled messages" ON public.scheduled_messages
  FOR ALL USING (auth.uid() = sender_id);

CREATE POLICY "Users manage own drafts" ON public.message_drafts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own auto-reply settings" ON public.auto_reply_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own folders" ON public.chat_folders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own folder members" ON public.chat_folder_members
  FOR ALL USING (
    folder_id IN (SELECT id FROM public.chat_folders WHERE user_id = auth.uid())
  );

CREATE POLICY "Users manage own FCM tokens" ON public.fcm_tokens
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users read own translations" ON public.message_translations
  FOR SELECT USING (true);

CREATE POLICY "Users create translations" ON public.message_translations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users manage own auto-reply logs" ON public.auto_reply_logs
  FOR ALL USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_scheduled_messages_updated_at
  BEFORE UPDATE ON public.scheduled_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auto_reply_settings_updated_at
  BEFORE UPDATE ON public.auto_reply_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_folders_updated_at
  BEFORE UPDATE ON public.chat_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();