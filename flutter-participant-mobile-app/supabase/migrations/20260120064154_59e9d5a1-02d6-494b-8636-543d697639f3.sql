-- Add username column to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create unique index for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username_lower 
ON public.user_profiles (LOWER(username)) WHERE username IS NOT NULL;

-- Create function to validate username format
CREATE OR REPLACE FUNCTION public.validate_username()
RETURNS TRIGGER AS $$
DECLARE
  reserved_names TEXT[] := ARRAY[
    'admin', 'administrator', 'support', 'help', 'info',
    'thittam1hub', 'official', 'moderator', 'system',
    'root', 'api', 'www', 'mail', 'contact', 'about',
    'profile', 'settings', 'login', 'signup', 'register'
  ];
BEGIN
  -- Allow NULL usernames
  IF NEW.username IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check length (3-30 characters)
  IF LENGTH(NEW.username) < 3 OR LENGTH(NEW.username) > 30 THEN
    RAISE EXCEPTION 'Username must be between 3 and 30 characters';
  END IF;
  
  -- Check format: starts with letter, alphanumeric + underscores only
  IF NOT NEW.username ~ '^[a-zA-Z][a-zA-Z0-9_]*$' THEN
    RAISE EXCEPTION 'Username must start with a letter and contain only letters, numbers, and underscores';
  END IF;
  
  -- Check reserved names
  IF LOWER(NEW.username) = ANY(reserved_names) THEN
    RAISE EXCEPTION 'This username is reserved and cannot be used';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for username validation
DROP TRIGGER IF EXISTS validate_username_trigger ON public.user_profiles;
CREATE TRIGGER validate_username_trigger
BEFORE INSERT OR UPDATE OF username ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_username();

-- Add column for username change tracking (rate limiting)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ;