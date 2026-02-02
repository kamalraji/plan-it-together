-- RPC function to batch-fetch unread counts for multiple channels in a single query
-- This reduces N+1 network calls to a single round-trip

CREATE OR REPLACE FUNCTION public.get_batch_unread_counts(p_channel_ids uuid[])
RETURNS TABLE (
  channel_id uuid,
  unread_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    cm.channel_id,
    COUNT(msg.id)::bigint AS unread_count
  FROM unnest(p_channel_ids) AS cm(channel_id)
  LEFT JOIN channel_members cmem 
    ON cmem.channel_id = cm.channel_id 
    AND cmem.user_id = v_user_id
  LEFT JOIN channel_messages msg 
    ON msg.channel_id = cm.channel_id
    AND msg.created_at > COALESCE(cmem.last_read_at, '1970-01-01'::timestamp with time zone)
    AND msg.created_at > COALESCE(cmem.cleared_at, '1970-01-01'::timestamp with time zone)
    AND msg.sender_id != v_user_id  -- Don't count own messages as unread
  GROUP BY cm.channel_id;
END;
$function$;

-- Optimized version for DM threads that also handles blocked users
CREATE OR REPLACE FUNCTION public.get_dm_unread_counts(p_channel_ids uuid[])
RETURNS TABLE (
  channel_id uuid,
  unread_count bigint,
  is_muted boolean,
  last_message_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    cm.channel_id,
    COUNT(msg.id) FILTER (
      WHERE msg.created_at > COALESCE(cmem.last_read_at, '1970-01-01'::timestamp with time zone)
        AND msg.created_at > COALESCE(cmem.cleared_at, '1970-01-01'::timestamp with time zone)
        AND msg.sender_id != v_user_id
    )::bigint AS unread_count,
    COALESCE(cmem.is_muted, false) AS is_muted,
    MAX(msg.created_at) AS last_message_at
  FROM unnest(p_channel_ids) AS cm(channel_id)
  LEFT JOIN channel_members cmem 
    ON cmem.channel_id = cm.channel_id 
    AND cmem.user_id = v_user_id
  LEFT JOIN channel_messages msg 
    ON msg.channel_id = cm.channel_id
  -- Exclude blocked users' messages
  WHERE NOT EXISTS (
    SELECT 1 FROM blocked_users bu
    WHERE bu.user_id = v_user_id 
      AND bu.blocked_user_id = msg.sender_id
  )
  GROUP BY cm.channel_id, cmem.is_muted;
END;
$function$;

-- Function to get total unread count across all user's channels (for badge)
CREATE OR REPLACE FUNCTION public.get_total_unread_count()
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_total bigint;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(SUM(unread_ct), 0) INTO v_total
  FROM (
    SELECT COUNT(msg.id) AS unread_ct
    FROM channel_members cmem
    JOIN channel_messages msg ON msg.channel_id = cmem.channel_id
    WHERE cmem.user_id = v_user_id
      AND cmem.is_muted = false  -- Don't count muted channels
      AND msg.created_at > COALESCE(cmem.last_read_at, '1970-01-01'::timestamp with time zone)
      AND msg.created_at > COALESCE(cmem.cleared_at, '1970-01-01'::timestamp with time zone)
      AND msg.sender_id != v_user_id
      AND NOT EXISTS (
        SELECT 1 FROM blocked_users bu
        WHERE bu.user_id = v_user_id AND bu.blocked_user_id = msg.sender_id
      )
    GROUP BY cmem.channel_id
  ) sub;

  RETURN v_total;
END;
$function$;

-- Add index to improve unread count query performance
CREATE INDEX IF NOT EXISTS idx_channel_messages_unread_lookup 
ON channel_messages(channel_id, created_at DESC, sender_id);

-- Add index for channel_members last_read_at lookup
CREATE INDEX IF NOT EXISTS idx_channel_members_user_read 
ON channel_members(user_id, channel_id, last_read_at);