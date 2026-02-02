-- =============================================
-- PHASE 3: SERVER-SIDE AGGREGATION RPC
-- Replaces client-side .limit(1000) with efficient server-side aggregation
-- =============================================

CREATE OR REPLACE FUNCTION public.get_high_follow_count_users(
  min_following INTEGER DEFAULT 100,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE(user_id UUID, following_count BIGINT) AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    f.follower_id,
    COUNT(*) as cnt
  FROM public.followers f
  WHERE f.status = 'ACCEPTED'
  GROUP BY f.follower_id
  HAVING COUNT(*) > min_following
  ORDER BY cnt DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_high_follow_count_users TO authenticated;