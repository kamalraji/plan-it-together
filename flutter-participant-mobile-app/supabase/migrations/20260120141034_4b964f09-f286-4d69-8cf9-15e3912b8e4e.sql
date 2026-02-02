-- Phase 1: Critical Security Enhancements

-- 1. Session timeout preferences (add to notification_preferences if exists, or create user_security_preferences)
CREATE TABLE IF NOT EXISTS user_security_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  session_timeout_minutes INTEGER DEFAULT 30,
  idle_timeout_enabled BOOLEAN DEFAULT true,
  require_reauthentication_sensitive BOOLEAN DEFAULT true,
  password_expiry_days INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_security_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own security preferences"
  ON user_security_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own security preferences"
  ON user_security_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own security preferences"
  ON user_security_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Password history table (prevent reuse)
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (users should not directly access this, only via edge functions)
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- No direct user access - only service role can access
CREATE POLICY "No direct access to password history"
  ON password_history FOR ALL
  USING (false);

-- 3. Login attempts table (rate limiting & anomaly detection)
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT,
  ip_address_hash TEXT,
  user_agent TEXT,
  location_country TEXT,
  location_city TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own login attempts
CREATE POLICY "Users can view own login attempts"
  ON login_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Security notification preferences
CREATE TABLE IF NOT EXISTS security_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email_on_new_login BOOLEAN DEFAULT true,
  email_on_password_change BOOLEAN DEFAULT true,
  email_on_2fa_change BOOLEAN DEFAULT true,
  email_on_suspicious_activity BOOLEAN DEFAULT true,
  push_on_new_login BOOLEAN DEFAULT true,
  push_on_password_change BOOLEAN DEFAULT true,
  push_on_2fa_change BOOLEAN DEFAULT true,
  push_on_suspicious_activity BOOLEAN DEFAULT true,
  weekly_security_digest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE security_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notification preferences"
  ON security_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON security_notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON security_notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_hash ON login_attempts(ip_address_hash);
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);

-- 6. Updated at trigger for security preferences
CREATE OR REPLACE FUNCTION update_security_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_security_preferences_updated_at
  BEFORE UPDATE ON user_security_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_security_preferences_updated_at();

CREATE TRIGGER trigger_security_notification_preferences_updated_at
  BEFORE UPDATE ON security_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_security_preferences_updated_at();