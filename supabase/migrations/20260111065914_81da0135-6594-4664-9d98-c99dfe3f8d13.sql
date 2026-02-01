-- Tighten access to user_profiles to prevent harvesting of contact info.
-- Remove broad access to "public portfolios" from direct table reads,
-- and expose only safe fields via SECURITY DEFINER RPC.

BEGIN;

-- 1) Remove the overly-broad policy that allows any authenticated user to SELECT
--    the full user_profiles row (including phone) when portfolio_is_public is true.
DROP POLICY IF EXISTS "Public portfolios viewable by all" ON public.user_profiles;

-- 2) Ensure the public portfolio RPC exists and is safe (no phone/email fields returned).
CREATE OR REPLACE FUNCTION public.get_public_portfolio(_user_id uuid)
RETURNS TABLE(
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
  portfolio_sections text[],
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    up.portfolio_sections,
    up.created_at
  FROM public.user_profiles up
  WHERE up.id = _user_id
    AND up.portfolio_is_public = TRUE;
$$;

-- Allow both anon (public pages) and authenticated (in-app) callers to read safe public portfolio data.
GRANT EXECUTE ON FUNCTION public.get_public_portfolio(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_portfolio(uuid) TO authenticated;

COMMIT;