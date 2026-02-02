-- =====================================================
-- NotificationService Industrial Best Practice Migration
-- =====================================================

-- 1. Add missing columns to notifications table for aggregation
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS group_key TEXT;

-- 2. Add comprehensive notification preference columns
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS connection_requests BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS connection_accepted BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS circle_invites BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS spark_reactions BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS achievements BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS high_match_online BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS quiet_hours_start TIME,
ADD COLUMN IF NOT EXISTS quiet_hours_end TIME,
ADD COLUMN IF NOT EXISTS allow_urgent_in_quiet_hours BOOLEAN DEFAULT TRUE;

-- 3. Create trigger for spark reaction notifications (CRITICAL - was missing!)
DROP TRIGGER IF EXISTS trigger_notify_spark_reaction ON public.spark_reactions;
CREATE TRIGGER trigger_notify_spark_reaction
  AFTER INSERT ON public.spark_reactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_spark_reaction();

-- 4. Create trigger for high match online notifications
DROP TRIGGER IF EXISTS trigger_notify_high_match_online ON public.impact_profiles;
CREATE TRIGGER trigger_notify_high_match_online
  AFTER UPDATE ON public.impact_profiles
  FOR EACH ROW
  WHEN (OLD.is_online IS DISTINCT FROM NEW.is_online AND NEW.is_online = TRUE)
  EXECUTE FUNCTION notify_high_match_online();

-- 5. Add performance indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_group_key 
  ON public.notifications(user_id, group_key) 
  WHERE group_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON public.notifications(user_id, read) 
  WHERE read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_created_desc 
  ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON public.notifications(user_id, type);

-- 6. Add RLS policy for notifications if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can manage own notifications'
  ) THEN
    CREATE POLICY "Users can manage own notifications"
      ON public.notifications
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;