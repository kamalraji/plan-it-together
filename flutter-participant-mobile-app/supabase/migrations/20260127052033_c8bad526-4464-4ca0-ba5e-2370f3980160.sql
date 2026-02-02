-- Settings Audit Log Table
-- Tracks all user preference changes for history and undo functionality

CREATE TABLE IF NOT EXISTS public.settings_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  setting_type TEXT NOT NULL,  -- 'notification', 'privacy', 'accessibility', 'locale', 'appearance', 'security'
  setting_key TEXT NOT NULL,   -- e.g., 'show_online_status', 'text_scale_factor'
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_settings_audit_user_id ON public.settings_audit_log(user_id);
CREATE INDEX idx_settings_audit_created_at ON public.settings_audit_log(created_at DESC);
CREATE INDEX idx_settings_audit_type ON public.settings_audit_log(setting_type);

-- Enable Row Level Security
ALTER TABLE public.settings_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own audit history
CREATE POLICY "Users can view own settings history"
ON public.settings_audit_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings history"
ON public.settings_audit_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings history"
ON public.settings_audit_log
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Comment for documentation
COMMENT ON TABLE public.settings_audit_log IS 'Tracks user preference changes for audit trail and undo functionality';