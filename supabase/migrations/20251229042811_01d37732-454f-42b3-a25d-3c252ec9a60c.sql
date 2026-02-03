-- Recreate get_public_portfolio with created_at included
DROP FUNCTION IF EXISTS public.get_public_portfolio(uuid);

CREATE FUNCTION public.get_public_portfolio(_user_id uuid)
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
  portfolio_sections text[],
  created_at timestamptz
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
    up.portfolio_sections,
    up.created_at
  FROM public.user_profiles up
  WHERE up.id = _user_id
    AND up.portfolio_is_public = TRUE;
$$ LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public;

REVOKE ALL ON FUNCTION public.get_public_portfolio(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_portfolio(uuid) TO anon, authenticated;