-- Revoke direct API access to the materialized view (security fix)
REVOKE ALL ON public.user_interaction_summary FROM anon, authenticated;

-- Grant access only through RPC functions that have proper security checks
GRANT SELECT ON public.user_interaction_summary TO service_role;