-- Channel Categories (Discord-style organization)
CREATE TABLE public.workspace_channel_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_collapsed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

-- Add category reference to existing workspace_channels
ALTER TABLE public.workspace_channels 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.workspace_channel_categories(id) ON DELETE SET NULL;

-- Broadcast Messages Table (Slack-style announcements)
CREATE TABLE public.workspace_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  channel_ids UUID[] DEFAULT '{}',
  send_push BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivery_stats JSONB DEFAULT '{"sent": 0, "delivered": 0, "read": 0, "failed": 0}',
  target_audience JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channel Moderation Actions
CREATE TABLE public.channel_moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.workspace_channels(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('mute', 'timeout', 'ban', 'warn', 'restrict', 'kick')),
  duration_minutes INTEGER,
  reason TEXT,
  moderator_id UUID NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session-to-Channel Linking
CREATE TABLE public.session_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  channel_id UUID NOT NULL REFERENCES public.workspace_channels(id) ON DELETE CASCADE,
  auto_created BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, channel_id)
);

-- Channel Templates for Event Types
CREATE TABLE public.channel_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('conference', 'hackathon', 'workshop', 'networking', 'meetup', 'custom')),
  channels JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channel Analytics (message counts, engagement)
CREATE TABLE public.channel_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.workspace_channels(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER DEFAULT 0,
  unique_senders INTEGER DEFAULT 0,
  reaction_count INTEGER DEFAULT 0,
  thread_count INTEGER DEFAULT 0,
  peak_hour INTEGER,
  active_participants UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, date)
);

-- Enable RLS on all new tables
ALTER TABLE public.workspace_channel_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_channel_categories
CREATE POLICY "Users can view categories in their workspaces"
  ON public.workspace_channel_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_channel_categories.workspace_id
        AND wtm.user_id = auth.uid()
        AND wtm.status = 'ACTIVE'
    )
  );

CREATE POLICY "Workspace managers can manage categories"
  ON public.workspace_channel_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_channel_categories.workspace_id
        AND wtm.user_id = auth.uid()
        AND wtm.status = 'ACTIVE'
        AND wtm.role IN ('WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'COMMUNICATION_LEAD')
    )
  );

-- RLS Policies for workspace_broadcasts
CREATE POLICY "Users can view broadcasts in their workspaces"
  ON public.workspace_broadcasts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_broadcasts.workspace_id
        AND wtm.user_id = auth.uid()
        AND wtm.status = 'ACTIVE'
    )
  );

CREATE POLICY "Authorized users can create broadcasts"
  ON public.workspace_broadcasts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_broadcasts.workspace_id
        AND wtm.user_id = auth.uid()
        AND wtm.status = 'ACTIVE'
        AND wtm.role IN ('WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'COMMUNICATION_LEAD', 'COMMUNICATIONS_SPECIALIST')
    )
  );

CREATE POLICY "Broadcast creators can update their broadcasts"
  ON public.workspace_broadcasts FOR UPDATE
  USING (sender_id = auth.uid());

-- RLS Policies for channel_moderation_actions
CREATE POLICY "Moderators can view moderation actions"
  ON public.channel_moderation_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_channels wc
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = wc.workspace_id
      WHERE wc.id = channel_moderation_actions.channel_id
        AND wtm.user_id = auth.uid()
        AND wtm.status = 'ACTIVE'
        AND wtm.role IN ('WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'COMMUNICATION_LEAD')
    )
  );

CREATE POLICY "Moderators can create moderation actions"
  ON public.channel_moderation_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_channels wc
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = wc.workspace_id
      WHERE wc.id = channel_moderation_actions.channel_id
        AND wtm.user_id = auth.uid()
        AND wtm.status = 'ACTIVE'
        AND wtm.role IN ('WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'COMMUNICATION_LEAD')
    )
  );

-- RLS Policies for session_channels
CREATE POLICY "Users can view session channels"
  ON public.session_channels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_channels wc
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = wc.workspace_id
      WHERE wc.id = session_channels.channel_id
        AND wtm.user_id = auth.uid()
        AND wtm.status = 'ACTIVE'
    )
  );

-- RLS Policies for channel_templates
CREATE POLICY "Anyone can view default templates"
  ON public.channel_templates FOR SELECT
  USING (is_default = true OR created_by = auth.uid());

CREATE POLICY "Users can create custom templates"
  ON public.channel_templates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for channel_analytics
CREATE POLICY "Workspace members can view analytics"
  ON public.channel_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_channels wc
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = wc.workspace_id
      WHERE wc.id = channel_analytics.channel_id
        AND wtm.user_id = auth.uid()
        AND wtm.status = 'ACTIVE'
    )
  );

-- Insert default channel templates
INSERT INTO public.channel_templates (name, description, category, channels, is_default) VALUES
(
  'Conference',
  'Standard conference event with announcements, networking, and help channels',
  'conference',
  '[
    {"name": "announcements", "type": "announcement", "autoJoin": true, "participantCanWrite": false, "description": "Official event announcements"},
    {"name": "general", "type": "general", "autoJoin": true, "participantCanWrite": true, "description": "General discussion"},
    {"name": "help-desk", "type": "general", "autoJoin": true, "participantCanWrite": true, "description": "Get help from organizers"},
    {"name": "networking", "type": "general", "autoJoin": true, "participantCanWrite": true, "description": "Connect with other attendees"},
    {"name": "job-board", "type": "general", "autoJoin": false, "participantCanWrite": true, "description": "Job opportunities"},
    {"name": "feedback", "type": "general", "autoJoin": false, "participantCanWrite": true, "description": "Share your feedback"}
  ]',
  true
),
(
  'Hackathon',
  'Hackathon event with team formation and project channels',
  'hackathon',
  '[
    {"name": "announcements", "type": "announcement", "autoJoin": true, "participantCanWrite": false, "description": "Official announcements"},
    {"name": "general", "type": "general", "autoJoin": true, "participantCanWrite": true, "description": "General discussion"},
    {"name": "team-formation", "type": "general", "autoJoin": true, "participantCanWrite": true, "description": "Find teammates"},
    {"name": "help-mentors", "type": "general", "autoJoin": true, "participantCanWrite": true, "description": "Get help from mentors"},
    {"name": "resources", "type": "general", "autoJoin": true, "participantCanWrite": false, "description": "Useful resources and APIs"},
    {"name": "showcase", "type": "general", "autoJoin": false, "participantCanWrite": true, "description": "Show off your projects"}
  ]',
  true
),
(
  'Workshop',
  'Interactive workshop with Q&A and resources',
  'workshop',
  '[
    {"name": "announcements", "type": "announcement", "autoJoin": true, "participantCanWrite": false, "description": "Workshop updates"},
    {"name": "questions", "type": "general", "autoJoin": true, "participantCanWrite": true, "description": "Ask questions during the workshop"},
    {"name": "resources", "type": "general", "autoJoin": true, "participantCanWrite": false, "description": "Workshop materials"},
    {"name": "general", "type": "general", "autoJoin": true, "participantCanWrite": true, "description": "General discussion"}
  ]',
  true
),
(
  'Networking Event',
  'Focused on attendee connections',
  'networking',
  '[
    {"name": "announcements", "type": "announcement", "autoJoin": true, "participantCanWrite": false, "description": "Event updates"},
    {"name": "introductions", "type": "general", "autoJoin": true, "participantCanWrite": true, "description": "Introduce yourself"},
    {"name": "networking", "type": "general", "autoJoin": true, "participantCanWrite": true, "description": "Connect with others"},
    {"name": "opportunities", "type": "general", "autoJoin": false, "participantCanWrite": true, "description": "Share opportunities"}
  ]',
  true
);

-- Create indexes for performance
CREATE INDEX idx_channel_categories_workspace ON public.workspace_channel_categories(workspace_id);
CREATE INDEX idx_broadcasts_workspace ON public.workspace_broadcasts(workspace_id);
CREATE INDEX idx_broadcasts_status ON public.workspace_broadcasts(status);
CREATE INDEX idx_broadcasts_scheduled ON public.workspace_broadcasts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_moderation_channel ON public.channel_moderation_actions(channel_id);
CREATE INDEX idx_moderation_active ON public.channel_moderation_actions(target_user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_session_channels_session ON public.session_channels(session_id);
CREATE INDEX idx_channel_analytics_date ON public.channel_analytics(channel_id, date);

-- Trigger for updated_at timestamps
CREATE TRIGGER update_workspace_channel_categories_updated_at
  BEFORE UPDATE ON public.workspace_channel_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_broadcasts_updated_at
  BEFORE UPDATE ON public.workspace_broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channel_templates_updated_at
  BEFORE UPDATE ON public.channel_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();