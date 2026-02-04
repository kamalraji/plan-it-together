-- Create reserved usernames table
CREATE TABLE IF NOT EXISTS public.reserved_usernames (
  username TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;

-- Only admins can modify, but anyone can read (for validation)
CREATE POLICY "Anyone can read reserved usernames"
  ON public.reserved_usernames
  FOR SELECT
  USING (true);

-- Insert common reserved words
INSERT INTO public.reserved_usernames (username, reason) VALUES
  ('admin', 'system'),
  ('administrator', 'system'),
  ('support', 'system'),
  ('help', 'system'),
  ('root', 'system'),
  ('moderator', 'system'),
  ('mod', 'system'),
  ('api', 'system'),
  ('www', 'system'),
  ('mail', 'system'),
  ('email', 'system'),
  ('null', 'system'),
  ('undefined', 'system'),
  ('anonymous', 'system'),
  ('system', 'system'),
  ('bot', 'system'),
  ('official', 'system'),
  ('verified', 'system'),
  ('settings', 'system'),
  ('profile', 'system'),
  ('account', 'system'),
  ('login', 'system'),
  ('signup', 'system'),
  ('register', 'system'),
  ('dashboard', 'system'),
  ('home', 'system'),
  ('about', 'system'),
  ('contact', 'system'),
  ('privacy', 'system'),
  ('terms', 'system'),
  ('security', 'system')
ON CONFLICT DO NOTHING;

-- Create function to check username availability
CREATE OR REPLACE FUNCTION public.check_username_availability(
  _username TEXT,
  _user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  normalized_username TEXT;
BEGIN
  -- Normalize username to lowercase and trim
  normalized_username := lower(trim(_username));
  
  -- Check if empty
  IF normalized_username = '' OR normalized_username IS NULL THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'empty',
      'message', 'Username cannot be empty'
    );
  END IF;
  
  -- Check format (3-30 chars, alphanumeric + underscores, must start with letter)
  IF NOT normalized_username ~ '^[a-z][a-z0-9_]{2,29}$' THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'invalid_format',
      'message', 'Username must be 3-30 characters, start with a letter, and contain only letters, numbers, and underscores'
    );
  END IF;
  
  -- Check reserved usernames
  IF EXISTS (SELECT 1 FROM public.reserved_usernames WHERE username = normalized_username) THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'reserved',
      'message', 'This username is reserved'
    );
  END IF;
  
  -- Check if already taken (excluding current user)
  IF EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE lower(username) = normalized_username 
    AND (_user_id IS NULL OR id != _user_id)
  ) THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'taken',
      'message', 'This username is already taken'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'available', true,
    'reason', null,
    'message', 'Username is available'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to enforce username change rate limiting
CREATE OR REPLACE FUNCTION public.enforce_username_change_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if username is being changed
  IF OLD.username IS NOT NULL 
     AND NEW.username IS DISTINCT FROM OLD.username 
     AND OLD.username_changed_at IS NOT NULL
     AND OLD.username_changed_at > now() - INTERVAL '30 days' THEN
    RAISE EXCEPTION 'Username can only be changed once every 30 days. Please wait until %', 
      (OLD.username_changed_at + INTERVAL '30 days')::date;
  END IF;
  
  -- Update username_changed_at if username changed
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    NEW.username_changed_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_username_change_limit ON public.user_profiles;

CREATE TRIGGER trigger_username_change_limit
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_username_change_limit();