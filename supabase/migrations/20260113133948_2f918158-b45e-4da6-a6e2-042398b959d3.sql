-- ============================================================
-- PHASE 2: Change the app_role enum type
-- ============================================================

-- Step 1: Create new enum type with only needed values
CREATE TYPE public.app_role_new AS ENUM ('admin', 'organizer', 'participant');

-- Step 2: Update user_roles table to use new enum
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role_new 
  USING role::text::public.app_role_new;

-- Step 3: Drop old has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Step 4: Drop old enum
DROP TYPE public.app_role;

-- Step 5: Rename new enum to app_role
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Step 6: Recreate has_role function with new enum type
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;