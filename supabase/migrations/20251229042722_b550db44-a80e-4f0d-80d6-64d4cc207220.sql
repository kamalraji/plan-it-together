-- Portfolio customization and secure public access

-- 1) Layout enum for portfolios
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'portfolio_layout') THEN
    CREATE TYPE public.portfolio_layout AS ENUM ('stacked', 'grid');
  END IF;
END $$;

-- 2) Extended profile fields for portfolio customization
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS portfolio_accent_color text,
  ADD COLUMN IF NOT EXISTS portfolio_layout public.portfolio_layout NOT NULL DEFAULT 'stacked',
  ADD COLUMN IF NOT EXISTS portfolio_sections text[] NOT NULL DEFAULT ARRAY['about','links','highlights'],
  ADD COLUMN IF NOT EXISTS portfolio_is_public boolean NOT NULL DEFAULT true;

-- 3) Secure function to expose only safe, public portfolio fields without requiring login
CREATE OR REPLACE FUNCTION public.get_public_portfolio(_user_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  organization text,
  bio text,
  website text,
  linkedin_url text,
  twitter_url text,
  github_url text,
  portfolio_accent_color text,
  portfolio_layout public.portfolio_layout,
  portfolio_sections text[]
) AS $$
  SELECT
    up.id,
    up.full_name,
    up.avatar_url,
    up.organization,
    up.bio,
    up.website,
    up.linkedin_url,
    up.twitter_url,
    up.github_url,
    up.portfolio_accent_color,
    up.portfolio_layout,
    up.portfolio_sections
  FROM public.user_profiles up
  WHERE up.id = _user_id
    AND up.portfolio_is_public = TRUE;
$$ LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public;

-- 4) Lock down function so it is callable only via PostgREST roles
REVOKE ALL ON FUNCTION public.get_public_portfolio(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_portfolio(uuid) TO anon, authenticated;