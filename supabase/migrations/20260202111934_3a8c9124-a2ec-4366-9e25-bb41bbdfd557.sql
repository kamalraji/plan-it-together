-- ============================================
-- Phase 4A: Participant Communication Infrastructure
-- ============================================

-- 1. Create workspace_channel_templates table for default channel configurations
CREATE TABLE IF NOT EXISTS public.workspace_channel_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  channel_type TEXT NOT NULL DEFAULT 'general' CHECK (channel_type IN ('general', 'announcement', 'private', 'task')),
  is_participant_visible BOOLEAN DEFAULT true,
  participant_can_write BOOLEAN DEFAULT true,
  auto_create_on_provision BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workspace_channel_templates ENABLE ROW LEVEL SECURITY;

-- Templates are readable by all authenticated users
CREATE POLICY "Channel templates are readable by authenticated users"
ON public.workspace_channel_templates FOR SELECT
TO authenticated
USING (true);

-- 2. Add participant-related columns to workspace_channels
ALTER TABLE public.workspace_channels 
  ADD COLUMN IF NOT EXISTS is_participant_channel BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS participant_permissions JSONB DEFAULT '{"can_read": true, "can_write": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS max_participants INTEGER,
  ADD COLUMN IF NOT EXISTS auto_join_on_registration BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.workspace_channel_templates(id);

-- 3. Create participant_channels table - links registrations to channels
CREATE TABLE IF NOT EXISTS public.participant_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.workspace_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{"can_read": true, "can_write": true}'::jsonb,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(registration_id, channel_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_participant_channels_user_id ON public.participant_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_participant_channels_event_id ON public.participant_channels(event_id);
CREATE INDEX IF NOT EXISTS idx_participant_channels_channel_id ON public.participant_channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_participant_channels_active ON public.participant_channels(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.participant_channels ENABLE ROW LEVEL SECURITY;

-- Participants can view their own channel memberships
CREATE POLICY "Users can view their own participant channels"
ON public.participant_channels FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow insert via service role (edge functions) or workspace team members
CREATE POLICY "Workspace team members can manage participant channels"
ON public.participant_channels FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    JOIN public.workspace_channels wc ON wtm.workspace_id = wc.workspace_id
    WHERE wc.id = participant_channels.channel_id
      AND wtm.user_id = auth.uid()
      AND wtm.role IN ('OWNER', 'ADMIN', 'MEMBER')
  )
);

-- 4. Seed default channel templates
INSERT INTO public.workspace_channel_templates (name, description, channel_type, participant_can_write, sort_order, icon) VALUES
  ('Announcements', 'Official event announcements from organizers', 'announcement', false, 1, 'megaphone'),
  ('General', 'Open discussion for all participants', 'general', true, 2, 'message-circle'),
  ('Help & Support', 'Get help from event organizers and volunteers', 'general', true, 3, 'help-circle'),
  ('Networking', 'Connect and network with other participants', 'general', true, 4, 'users')
ON CONFLICT DO NOTHING;

-- 5. Create function to auto-join participants to channels when registration is confirmed
CREATE OR REPLACE FUNCTION public.auto_join_participant_channels()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  -- Only trigger when status changes to CONFIRMED
  IF NEW.status = 'CONFIRMED' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'CONFIRMED') THEN
    -- Get user name
    SELECT full_name INTO v_user_name 
    FROM public.user_profiles 
    WHERE id = NEW.user_id;
    
    -- Add to channel_members for all auto-join participant channels
    INSERT INTO public.channel_members (channel_id, user_id, user_name)
    SELECT 
      wc.id,
      NEW.user_id,
      v_user_name
    FROM public.workspace_channels wc
    JOIN public.workspaces w ON wc.workspace_id = w.id
    WHERE w.event_id = NEW.event_id
      AND wc.auto_join_on_registration = true
      AND wc.is_participant_channel = true
    ON CONFLICT (channel_id, user_id) DO NOTHING;
    
    -- Create participant_channels records for tracking
    INSERT INTO public.participant_channels (registration_id, channel_id, user_id, event_id, permissions)
    SELECT 
      NEW.id,
      wc.id,
      NEW.user_id,
      NEW.event_id,
      wc.participant_permissions
    FROM public.workspace_channels wc
    JOIN public.workspaces w ON wc.workspace_id = w.id
    WHERE w.event_id = NEW.event_id
      AND wc.auto_join_on_registration = true
      AND wc.is_participant_channel = true
    ON CONFLICT (registration_id, channel_id) DO NOTHING;
  END IF;
  
  -- Handle registration cancellation - deactivate channel access
  IF NEW.status IN ('CANCELLED', 'WAITLISTED') AND OLD.status = 'CONFIRMED' THEN
    UPDATE public.participant_channels
    SET is_active = false, left_at = NOW(), updated_at = NOW()
    WHERE registration_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-join
DROP TRIGGER IF EXISTS trigger_auto_join_channels ON public.registrations;
CREATE TRIGGER trigger_auto_join_channels
AFTER INSERT OR UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.auto_join_participant_channels();

-- 6. Enhanced RLS for workspace_channels - participants can view their channels
DROP POLICY IF EXISTS "Participants can view their accessible channels" ON public.workspace_channels;
CREATE POLICY "Participants can view their accessible channels"
ON public.workspace_channels FOR SELECT
TO authenticated
USING (
  -- Existing workspace team member access
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_channels.workspace_id
      AND wtm.user_id = auth.uid()
  )
  OR
  -- Participant access through participant_channels
  EXISTS (
    SELECT 1 FROM public.participant_channels pc
    WHERE pc.channel_id = workspace_channels.id
      AND pc.user_id = auth.uid()
      AND pc.is_active = true
  )
);

-- 7. Enhanced RLS for channel_messages - participants can read/write based on permissions
DROP POLICY IF EXISTS "Participants can read messages in their channels" ON public.channel_messages;
CREATE POLICY "Participants can read messages in their channels"
ON public.channel_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.participant_channels pc
    WHERE pc.channel_id = channel_messages.channel_id
      AND pc.user_id = auth.uid()
      AND pc.is_active = true
      AND (pc.permissions->>'can_read')::boolean = true
  )
  OR
  EXISTS (
    SELECT 1 FROM public.channel_members cm
    WHERE cm.channel_id = channel_messages.channel_id
      AND cm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Participants can send messages if permitted" ON public.channel_messages;
CREATE POLICY "Participants can send messages if permitted"
ON public.channel_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND (
    -- Workspace team member can always send
    EXISTS (
      SELECT 1 FROM public.workspace_channels wc
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = wc.workspace_id
      WHERE wc.id = channel_messages.channel_id
        AND wtm.user_id = auth.uid()
    )
    OR
    -- Participant can send if permissions allow
    EXISTS (
      SELECT 1 FROM public.participant_channels pc
      JOIN public.workspace_channels wc ON pc.channel_id = wc.id
      WHERE pc.channel_id = channel_messages.channel_id
        AND pc.user_id = auth.uid()
        AND pc.is_active = true
        AND (pc.permissions->>'can_write')::boolean = true
        AND (wc.participant_permissions->>'can_write')::boolean = true
    )
  )
);

-- 8. Add updated_at trigger for new tables
DROP TRIGGER IF EXISTS update_workspace_channel_templates_updated_at ON public.workspace_channel_templates;
CREATE TRIGGER update_workspace_channel_templates_updated_at
BEFORE UPDATE ON public.workspace_channel_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_participant_channels_updated_at ON public.participant_channels;
CREATE TRIGGER update_participant_channels_updated_at
BEFORE UPDATE ON public.participant_channels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();