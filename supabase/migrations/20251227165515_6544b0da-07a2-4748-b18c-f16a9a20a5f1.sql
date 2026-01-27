-- Create notifications table for real-time, per-user notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'system', -- e.g. workspace | event | marketplace | organization | system
  type text NOT NULL DEFAULT 'info',      -- e.g. info | success | warning | error | task
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  action_url text,
  action_label text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: users can see their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users view own notifications'
  ) THEN
    CREATE POLICY "Users view own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END$$;

-- Policy: users can insert their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users insert own notifications'
  ) THEN
    CREATE POLICY "Users insert own notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Policy: users can update their own notifications (e.g. mark as read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users update own notifications'
  ) THEN
    CREATE POLICY "Users update own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Policy: users can delete their own notifications (e.g. clear)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users delete own notifications'
  ) THEN
    CREATE POLICY "Users delete own notifications"
    ON public.notifications
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END$$;

-- Optional: admins can see all notifications using existing has_role() helper
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Admins view all notifications'
  ) THEN
    CREATE POLICY "Admins view all notifications"
    ON public.notifications
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END$$;