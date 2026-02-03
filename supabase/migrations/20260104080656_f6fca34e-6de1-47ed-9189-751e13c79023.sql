-- Create admin audit logs table
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only service role can insert (from edge functions)
CREATE POLICY "Service role can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action ON public.admin_audit_logs(action);