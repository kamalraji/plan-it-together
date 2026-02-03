-- Create system_settings table for platform-wide configuration
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  category text NOT NULL DEFAULT 'general',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view settings
CREATE POLICY "Admins can view system settings"
ON public.system_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can update settings
CREATE POLICY "Admins can update system settings"
ON public.system_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can insert settings
CREATE POLICY "Admins can insert system settings"
ON public.system_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER set_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
  ('feature_flags', '{"marketplace_enabled": true, "vendor_registration_enabled": true, "public_events_enabled": true, "email_notifications_enabled": true}', 'Feature toggles for platform features', 'features'),
  ('platform_limits', '{"max_events_per_org": 50, "max_team_members_per_workspace": 100, "max_registrations_per_event": 10000, "max_file_upload_mb": 10}', 'Platform-wide limits and quotas', 'limits'),
  ('email_templates', '{"welcome_subject": "Welcome to Thittam1Hub!", "welcome_body": "Thank you for joining our platform.", "vendor_approved_subject": "Your vendor application has been approved", "vendor_rejected_subject": "Update on your vendor application"}', 'Email template configurations', 'email');

-- Create index for faster lookups
CREATE INDEX idx_system_settings_key ON public.system_settings(key);
CREATE INDEX idx_system_settings_category ON public.system_settings(category);