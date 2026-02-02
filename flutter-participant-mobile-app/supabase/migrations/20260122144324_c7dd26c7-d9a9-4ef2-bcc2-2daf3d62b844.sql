-- Create channel notification settings table for per-conversation preferences
CREATE TABLE public.channel_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted BOOLEAN DEFAULT false,
  muted_until TIMESTAMPTZ,
  custom_sound_name TEXT,
  vibration_enabled BOOLEAN DEFAULT true,
  show_previews BOOLEAN DEFAULT true,
  mentions_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Enable RLS
ALTER TABLE public.channel_notification_settings ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notification settings
CREATE POLICY "Users can view own notification settings"
ON public.channel_notification_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own notification settings
CREATE POLICY "Users can insert own notification settings"
ON public.channel_notification_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own notification settings
CREATE POLICY "Users can update own notification settings"
ON public.channel_notification_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notification settings
CREATE POLICY "Users can delete own notification settings"
ON public.channel_notification_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_channel_notification_settings_user ON public.channel_notification_settings(user_id);
CREATE INDEX idx_channel_notification_settings_channel ON public.channel_notification_settings(channel_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_channel_notification_settings_updated_at
BEFORE UPDATE ON public.channel_notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();