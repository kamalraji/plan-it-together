-- ============================================
-- Add missing columns to user_roles table for production readiness
-- ============================================

-- Add missing columns (these will be silently ignored if they already exist)
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS granted_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Create indexes for faster role lookups (will be silently ignored if they exist)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires ON public.user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- Create helper functions (using CREATE OR REPLACE to avoid dropping dependencies)
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(role),
    ARRAY[]::app_role[]
  )
  FROM public.user_roles
  WHERE user_id = _user_id
    AND (expires_at IS NULL OR expires_at > now())
$$;

-- Create is_admin helper (using CREATE OR REPLACE to avoid dropping dependencies)  
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
$$;

-- Create is_organizer helper (using CREATE OR REPLACE to avoid dropping dependencies)
CREATE OR REPLACE FUNCTION public.is_organizer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'organizer'::app_role)
$$;

-- Add documentation comments
COMMENT ON TABLE public.user_roles IS 'Stores user role assignments. Uses SECURITY DEFINER functions to prevent RLS recursion.';
COMMENT ON FUNCTION public.get_user_roles IS 'Get all active roles for a user. Uses SECURITY DEFINER to bypass RLS safely.';
COMMENT ON FUNCTION public.is_admin IS 'Check if a user is an admin. Uses SECURITY DEFINER to bypass RLS safely.';
COMMENT ON FUNCTION public.is_organizer IS 'Check if a user is an organizer. Uses SECURITY DEFINER to bypass RLS safely.';