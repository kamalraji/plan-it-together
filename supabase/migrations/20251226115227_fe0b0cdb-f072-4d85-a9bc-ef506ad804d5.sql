-- 1. Create app_role enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END$$;

-- 2. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Helper function to safely check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
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
  );
$$;

-- 5. Basic RLS policies for user_roles
-- Drop existing policies if they exist to avoid duplicates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles'
  ) THEN
    DROP POLICY IF EXISTS "Users can select themselves" ON public.user_roles;
    DROP POLICY IF EXISTS "Users can select any user if they are an admin" ON public.user_roles;
    DROP POLICY IF EXISTS "Users can update any user if they are an admin" ON public.user_roles;
    DROP POLICY IF EXISTS "Users can insert if they are an admin" ON public.user_roles;
    DROP POLICY IF EXISTS "Users can delete if they are an admin" ON public.user_roles;
  END IF;
END$$;

-- Only authenticated users interact with user_roles
-- Users can select their own roles
CREATE POLICY "Users can select themselves"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can select any user's roles
CREATE POLICY "Users can select any user if they are an admin"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert roles for any user
CREATE POLICY "Users can insert if they are an admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update roles for any user
CREATE POLICY "Users can update any user if they are an admin"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete roles for any user
CREATE POLICY "Users can delete if they are an admin"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
