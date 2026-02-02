-- Create index on interaction events for faster AI matching queries
CREATE INDEX IF NOT EXISTS idx_user_interaction_events_ai_matching 
ON public.user_interaction_events (target_user_id, event_type, created_at DESC)
WHERE event_type IN ('profile_view', 'profile_expand', 'skip', 'save', 'follow', 'ai_match_detail_open', 'ai_conversation_starter_tap', 'ai_collaboration_idea_tap', 'card_tap');

-- Create index for user's own interactions (for reciprocity scoring)
CREATE INDEX IF NOT EXISTS idx_user_interaction_events_user_actions 
ON public.user_interaction_events (user_id, created_at DESC);

-- Create materialized view for interaction summaries (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_interaction_summary AS
SELECT 
  user_id,
  target_user_id,
  event_type,
  COUNT(*) as event_count,
  MAX(created_at) as last_interaction,
  -- Time-weighted score (half-life: 14 days)
  SUM(
    CASE 
      WHEN event_type = 'meeting_accepted' THEN 80
      WHEN event_type = 'meeting_requested' THEN 70
      WHEN event_type = 'contact_exchanged' THEN 65
      WHEN event_type = 'follow' THEN 50
      WHEN event_type IN ('message_sent', 'message_replied') THEN 40
      WHEN event_type = 'save' THEN 30
      WHEN event_type = 'profile_shared' THEN 25
      WHEN event_type IN ('ai_conversation_starter_tap', 'ai_collaboration_idea_tap') THEN 20
      WHEN event_type = 'ai_match_detail_open' THEN 15
      WHEN event_type = 'profile_expand' THEN 10
      WHEN event_type = 'card_tap' THEN 8
      WHEN event_type IN ('profile_view', 'dwell_time') THEN 5
      WHEN event_type = 'scroll_past' THEN 2
      WHEN event_type = 'skip' THEN -15
      WHEN event_type = 'unfollow' THEN -30
      WHEN event_type = 'meeting_declined' THEN -20
      ELSE 5
    END * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - created_at)) / (14 * 24 * 3600))
  ) as weighted_score
FROM public.user_interaction_events
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY user_id, target_user_id, event_type
WITH DATA;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_interaction_summary_unique 
ON public.user_interaction_summary (user_id, target_user_id, event_type);

-- Create index on the materialized view for lookups
CREATE INDEX IF NOT EXISTS idx_user_interaction_summary_lookup 
ON public.user_interaction_summary (user_id, target_user_id);

-- Create function to refresh the materialized view (call periodically via cron)
CREATE OR REPLACE FUNCTION public.refresh_interaction_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_interaction_summary;
END;
$$;

-- Add comment for documentation
COMMENT ON MATERIALIZED VIEW public.user_interaction_summary IS 
'Aggregated user interaction scores for AI matching. Refreshed periodically via cron job calling refresh_interaction_summary().';