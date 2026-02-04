-- =============================================
-- Phase 5: Workspace Enhancements Database Schema (Modified)
-- Extends existing notification_preferences table
-- =============================================

-- =============================================
-- 5.1 Voice Channel Tables
-- =============================================

-- Voice channel configuration linked to workspace channels
CREATE TABLE IF NOT EXISTS public.workspace_voice_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.workspace_channels(id) ON DELETE CASCADE,
  agora_channel_name TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  max_participants INTEGER DEFAULT 50,
  is_stage_mode BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice sessions (each time someone starts/joins a huddle)
CREATE TABLE IF NOT EXISTS public.workspace_voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_channel_id UUID NOT NULL REFERENCES public.workspace_voice_channels(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  peak_participants INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0
);

-- Track participants in voice sessions
CREATE TABLE IF NOT EXISTS public.workspace_voice_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_session_id UUID NOT NULL REFERENCES public.workspace_voice_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT false,
  is_deafened BOOLEAN DEFAULT false,
  is_speaking BOOLEAN DEFAULT false,
  is_screen_sharing BOOLEAN DEFAULT false,
  UNIQUE(voice_session_id, user_id)
);

-- =============================================
-- 5.2 Notification Batching - Extend existing table
-- =============================================

-- Add batching columns to existing notification_preferences table
ALTER TABLE public.notification_preferences 
  ADD COLUMN IF NOT EXISTS batch_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS batch_window_minutes INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS email_digest_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_digest_frequency TEXT DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS channel_overrides JSONB DEFAULT '{}';

-- Queue for pending notifications to be batched
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.workspace_channels(id) ON DELETE SET NULL,
  source_id UUID,
  source_type TEXT,
  content JSONB NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  batch_window_end TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  batch_id UUID
);

-- Notification batches (grouped notifications)
CREATE TABLE IF NOT EXISTS public.notification_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  batch_type TEXT NOT NULL,
  notification_count INTEGER DEFAULT 0,
  content_summary JSONB NOT NULL,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5.3 Thread Enhancement Tables
-- =============================================

-- Track unread thread replies per user
CREATE TABLE IF NOT EXISTS public.thread_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  parent_message_id UUID NOT NULL REFERENCES public.channel_messages(id) ON DELETE CASCADE,
  last_read_reply_id UUID REFERENCES public.channel_messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  UNIQUE(user_id, parent_message_id)
);

-- Thread subscriptions (users following threads)
CREATE TABLE IF NOT EXISTS public.thread_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  parent_message_id UUID NOT NULL REFERENCES public.channel_messages(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_muted BOOLEAN DEFAULT false,
  UNIQUE(user_id, parent_message_id)
);

-- =============================================
-- Indexes for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_voice_channels_workspace ON public.workspace_voice_channels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_channel ON public.workspace_voice_sessions(voice_channel_id);
CREATE INDEX IF NOT EXISTS idx_voice_participants_session ON public.workspace_voice_participants(voice_session_id);
CREATE INDEX IF NOT EXISTS idx_voice_participants_user ON public.workspace_voice_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON public.notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_batches_user ON public.notification_batches(user_id);

CREATE INDEX IF NOT EXISTS idx_thread_read_status_user ON public.thread_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_thread_subscriptions_user ON public.thread_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_thread_subscriptions_message ON public.thread_subscriptions(parent_message_id);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE public.workspace_voice_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_voice_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_subscriptions ENABLE ROW LEVEL SECURITY;

-- Voice channel policies
CREATE POLICY "Workspace members can view voice channels"
  ON public.workspace_voice_channels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_voice_channels.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace admins can manage voice channels"
  ON public.workspace_voice_channels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_voice_channels.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.role IN ('OWNER', 'ADMIN', 'LEAD')
    )
  );

-- Voice session policies
CREATE POLICY "Workspace members can view voice sessions"
  ON public.workspace_voice_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_voice_channels wvc
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = wvc.workspace_id
      WHERE wvc.id = workspace_voice_sessions.voice_channel_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create voice sessions"
  ON public.workspace_voice_sessions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update voice sessions"
  ON public.workspace_voice_sessions FOR UPDATE
  USING (true);

-- Voice participant policies
CREATE POLICY "Workspace members can view participants"
  ON public.workspace_voice_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_voice_sessions wvs
      JOIN public.workspace_voice_channels wvc ON wvc.id = wvs.voice_channel_id
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = wvc.workspace_id
      WHERE wvs.id = workspace_voice_participants.voice_session_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own participation"
  ON public.workspace_voice_participants FOR ALL
  USING (user_id = auth.uid());

-- Notification queue policies
CREATE POLICY "Users can view own notification queue"
  ON public.notification_queue FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage notification queue"
  ON public.notification_queue FOR ALL
  USING (true);

-- Notification batches policies
CREATE POLICY "Users can view own batches"
  ON public.notification_batches FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own batches"
  ON public.notification_batches FOR UPDATE
  USING (user_id = auth.uid());

-- Thread read status policies
CREATE POLICY "Users manage own thread read status"
  ON public.thread_read_status FOR ALL
  USING (user_id = auth.uid());

-- Thread subscription policies
CREATE POLICY "Users manage own thread subscriptions"
  ON public.thread_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- =============================================
-- Triggers
-- =============================================

CREATE TRIGGER update_workspace_voice_channels_updated_at
  BEFORE UPDATE ON public.workspace_voice_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();