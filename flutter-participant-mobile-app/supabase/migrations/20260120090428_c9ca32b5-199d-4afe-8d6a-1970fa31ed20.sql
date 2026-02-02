-- Privacy Consent Management System for GDPR/CCPA Compliance

-- Consent categories table (defines what types of consent we collect)
CREATE TABLE public.consent_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User consent records (current state of user's consent)
CREATE TABLE public.user_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_key TEXT NOT NULL REFERENCES public.consent_categories(key) ON DELETE CASCADE,
  is_granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMP WITH TIME ZONE,
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  ip_address_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_key)
);

-- Consent audit log (tracks all consent changes for compliance)
CREATE TABLE public.consent_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_key TEXT NOT NULL,
  action TEXT NOT NULL, -- 'granted', 'withdrawn', 'updated'
  previous_value BOOLEAN,
  new_value BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  ip_address_hash TEXT,
  user_agent TEXT,
  source TEXT, -- 'banner', 'settings', 'api', 'data_request'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data subject requests (GDPR Article 15-22)
CREATE TABLE public.data_subject_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL, -- 'access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'rejected'
  reason TEXT,
  response_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE, -- GDPR requires response within 30 days
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Privacy policy versions (track policy updates)
CREATE TABLE public.privacy_policy_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User policy acknowledgments
CREATE TABLE public.user_policy_acknowledgments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  policy_version TEXT NOT NULL REFERENCES public.privacy_policy_versions(version),
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address_hash TEXT,
  UNIQUE(user_id, policy_version)
);

-- Enable RLS on all tables
ALTER TABLE public.consent_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_policy_acknowledgments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Consent categories are readable by everyone (public info)
CREATE POLICY "Consent categories are publicly readable"
  ON public.consent_categories FOR SELECT
  USING (is_active = true);

-- Users can only manage their own consents
CREATE POLICY "Users can view their own consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents"
  ON public.user_consents FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can view their own audit log
CREATE POLICY "Users can view their own consent audit log"
  ON public.consent_audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view and create their own data requests
CREATE POLICY "Users can view their own data requests"
  ON public.data_subject_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data requests"
  ON public.data_subject_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Privacy policy versions are publicly readable
CREATE POLICY "Privacy policies are publicly readable"
  ON public.privacy_policy_versions FOR SELECT
  USING (is_active = true);

-- Users can view and create their own acknowledgments
CREATE POLICY "Users can view their own policy acknowledgments"
  ON public.user_policy_acknowledgments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can acknowledge policies"
  ON public.user_policy_acknowledgments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to log consent changes
CREATE OR REPLACE FUNCTION public.log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.consent_audit_log (
    user_id,
    category_key,
    action,
    previous_value,
    new_value,
    consent_version,
    ip_address_hash,
    user_agent,
    source
  ) VALUES (
    NEW.user_id,
    NEW.category_key,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'granted'
      WHEN OLD.is_granted = true AND NEW.is_granted = false THEN 'withdrawn'
      ELSE 'updated'
    END,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.is_granted ELSE NULL END,
    NEW.is_granted,
    NEW.consent_version,
    NEW.ip_address_hash,
    NEW.user_agent,
    'settings'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-log consent changes
CREATE TRIGGER on_consent_change
  AFTER INSERT OR UPDATE ON public.user_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_consent_change();

-- Function to update timestamps
CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON public.user_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_subject_requests_updated_at
  BEFORE UPDATE ON public.data_subject_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consent_categories_updated_at
  BEFORE UPDATE ON public.consent_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default consent categories
INSERT INTO public.consent_categories (key, name, description, is_required, sort_order) VALUES
  ('essential', 'Essential', 'Required for the app to function properly. Cannot be disabled.', true, 1),
  ('analytics', 'Analytics', 'Help us understand how you use the app to improve your experience.', false, 2),
  ('personalization', 'Personalization', 'Allow us to personalize content and recommendations for you.', false, 3),
  ('marketing', 'Marketing', 'Receive promotional communications and offers.', false, 4),
  ('third_party', 'Third-Party Sharing', 'Allow sharing data with trusted partners for enhanced services.', false, 5);

-- Insert initial privacy policy version
INSERT INTO public.privacy_policy_versions (version, title, content, summary, effective_date, is_active) VALUES
  ('1.0', 'Privacy Policy', 'Full privacy policy content here...', 'We respect your privacy and are committed to protecting your personal data.', now(), true);

-- Create indexes for performance
CREATE INDEX idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX idx_consent_audit_log_user_id ON public.consent_audit_log(user_id);
CREATE INDEX idx_consent_audit_log_created_at ON public.consent_audit_log(created_at);
CREATE INDEX idx_data_subject_requests_user_id ON public.data_subject_requests(user_id);
CREATE INDEX idx_data_subject_requests_status ON public.data_subject_requests(status);