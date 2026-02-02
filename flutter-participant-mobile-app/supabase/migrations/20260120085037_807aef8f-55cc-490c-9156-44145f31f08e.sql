-- Privacy & Security Enhancement Tables
-- =====================================================

-- Privacy Consents Table (GDPR/CCPA Compliance)
CREATE TABLE IF NOT EXISTS public.privacy_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  analytics_consent BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  personalization_consent BOOLEAN DEFAULT false,
  third_party_sharing BOOLEAN DEFAULT false,
  essential_consent BOOLEAN DEFAULT true, -- Always true, required
  consent_version TEXT NOT NULL DEFAULT '1.0',
  consented_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address_hash TEXT, -- Hashed for privacy
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile Visibility Settings
CREATE TABLE IF NOT EXISTS public.profile_visibility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  profile_visibility TEXT DEFAULT 'everyone' CHECK (profile_visibility IN ('everyone', 'connections', 'nobody')),
  email_visibility TEXT DEFAULT 'hidden' CHECK (email_visibility IN ('public', 'connections', 'hidden')),
  phone_visibility TEXT DEFAULT 'hidden' CHECK (phone_visibility IN ('public', 'connections', 'hidden')),
  location_visibility TEXT DEFAULT 'city' CHECK (location_visibility IN ('exact', 'city', 'country', 'hidden')),
  searchable BOOLEAN DEFAULT true,
  contact_sync_discoverable BOOLEAN DEFAULT true,
  show_profile_views BOOLEAN DEFAULT true,
  allow_connection_requests BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Retention Settings
CREATE TABLE IF NOT EXISTS public.data_retention_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  message_retention_days INTEGER DEFAULT NULL, -- NULL = forever
  activity_retention_days INTEGER DEFAULT 365,
  search_history_retention_days INTEGER DEFAULT 30,
  auto_delete_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Activity Logs
CREATE TABLE IF NOT EXISTS public.security_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address_hash TEXT, -- Hashed for privacy
  location TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trusted Devices
CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  trusted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  is_current BOOLEAN DEFAULT false,
  UNIQUE(user_id, device_id)
);

-- Add email_security_alerts to notification_preferences if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_preferences' 
    AND column_name = 'email_security_alerts'
  ) THEN
    ALTER TABLE public.notification_preferences 
    ADD COLUMN email_security_alerts BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_preferences' 
    AND column_name = 'security_alerts_enabled'
  ) THEN
    ALTER TABLE public.notification_preferences 
    ADD COLUMN security_alerts_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE public.privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_visibility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for privacy_consents
CREATE POLICY "Users can view their own consent" 
  ON public.privacy_consents FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent" 
  ON public.privacy_consents FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent" 
  ON public.privacy_consents FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS Policies for profile_visibility_settings
CREATE POLICY "Users can view their own visibility settings" 
  ON public.profile_visibility_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visibility settings" 
  ON public.profile_visibility_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visibility settings" 
  ON public.profile_visibility_settings FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS Policies for data_retention_settings
CREATE POLICY "Users can view their own retention settings" 
  ON public.data_retention_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own retention settings" 
  ON public.data_retention_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own retention settings" 
  ON public.data_retention_settings FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS Policies for security_activity_logs
CREATE POLICY "Users can view their own security logs" 
  ON public.security_activity_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert security logs" 
  ON public.security_activity_logs FOR INSERT 
  WITH CHECK (true); -- Edge function uses service role

-- RLS Policies for trusted_devices
CREATE POLICY "Users can view their own trusted devices" 
  ON public.trusted_devices FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trusted devices" 
  ON public.trusted_devices FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trusted devices" 
  ON public.trusted_devices FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trusted devices" 
  ON public.trusted_devices FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_activity_logs_user_id ON public.security_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_activity_logs_created_at ON public.security_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_activity_logs_event_type ON public.security_activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON public.trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_expires_at ON public.trusted_devices(expires_at);

-- Auto-update updated_at triggers
CREATE TRIGGER update_privacy_consents_updated_at
  BEFORE UPDATE ON public.privacy_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profile_visibility_settings_updated_at
  BEFORE UPDATE ON public.profile_visibility_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_retention_settings_updated_at
  BEFORE UPDATE ON public.data_retention_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();