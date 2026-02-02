-- Disappearing Messages Settings
CREATE TABLE public.disappearing_message_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 86400,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Message Reports Table
CREATE TABLE public.message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'scam', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Chat Security Settings Table
CREATE TABLE public.chat_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  app_lock_enabled BOOLEAN DEFAULT false,
  lock_timeout_minutes INTEGER DEFAULT 5,
  require_biometric BOOLEAN DEFAULT false,
  hide_message_preview_locked BOOLEAN DEFAULT true,
  incognito_keyboard BOOLEAN DEFAULT false,
  screenshot_protection BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.disappearing_message_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_security_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disappearing_message_settings
CREATE POLICY "Users can view their disappearing settings"
  ON public.disappearing_message_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their disappearing settings"
  ON public.disappearing_message_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their disappearing settings"
  ON public.disappearing_message_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their disappearing settings"
  ON public.disappearing_message_settings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for message_reports
CREATE POLICY "Users can create reports"
  ON public.message_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON public.message_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- RLS Policies for chat_security_settings
CREATE POLICY "Users can view their security settings"
  ON public.chat_security_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their security settings"
  ON public.chat_security_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their security settings"
  ON public.chat_security_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_disappearing_settings_channel ON public.disappearing_message_settings(channel_id);
CREATE INDEX idx_disappearing_settings_user ON public.disappearing_message_settings(user_id);
CREATE INDEX idx_message_reports_status ON public.message_reports(status);
CREATE INDEX idx_message_reports_reporter ON public.message_reports(reporter_id);
CREATE INDEX idx_chat_security_user ON public.chat_security_settings(user_id);

-- Function to check if user is blocked (security definer)
CREATE OR REPLACE FUNCTION public.check_blocked_status(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE user_id = auth.uid() AND blocked_user_id = target_user_id
  ) OR EXISTS (
    SELECT 1 FROM blocked_users
    WHERE user_id = target_user_id AND blocked_user_id = auth.uid()
  )
$$;

-- Trigger for updated_at
CREATE TRIGGER update_disappearing_settings_updated_at
  BEFORE UPDATE ON public.disappearing_message_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_security_settings_updated_at
  BEFORE UPDATE ON public.chat_security_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();