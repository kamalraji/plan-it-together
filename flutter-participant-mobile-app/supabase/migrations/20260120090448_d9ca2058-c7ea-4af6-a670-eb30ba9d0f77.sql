-- Fix: Set search_path for the log_consent_change function
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