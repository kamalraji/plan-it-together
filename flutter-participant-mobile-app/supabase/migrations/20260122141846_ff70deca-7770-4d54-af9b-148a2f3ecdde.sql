-- Chat theme settings table for persisting user preferences
CREATE TABLE IF NOT EXISTS public.chat_theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  selected_theme TEXT NOT NULL DEFAULT 'default',
  accent_color TEXT NOT NULL DEFAULT '#8B5CF6',
  bubble_style TEXT NOT NULL DEFAULT 'modern',
  font_size INTEGER NOT NULL DEFAULT 16,
  reduced_motion BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.chat_theme_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own theme settings
CREATE POLICY "Users can view their own theme settings"
  ON public.chat_theme_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own theme settings"
  ON public.chat_theme_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own theme settings"
  ON public.chat_theme_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own theme settings"
  ON public.chat_theme_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_chat_theme_settings_user_id ON public.chat_theme_settings(user_id);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER update_chat_theme_settings_updated_at
  BEFORE UPDATE ON public.chat_theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();