-- =====================================================
-- Communication Committee Tables
-- =====================================================

-- 1. Email Campaigns Table
CREATE TABLE public.workspace_email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  template_id UUID,
  status TEXT NOT NULL DEFAULT 'draft',
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  target_audience TEXT DEFAULT 'all',
  recipient_list JSONB,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Press Releases Table
CREATE TABLE public.workspace_press_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'press-release',
  status TEXT NOT NULL DEFAULT 'draft',
  author_id UUID,
  author_name TEXT,
  reviewer_id UUID,
  reviewer_name TEXT,
  embargo_date TIMESTAMP WITH TIME ZONE,
  distribution_date TIMESTAMP WITH TIME ZONE,
  distribution_channels TEXT[],
  media_contacts TEXT[],
  attachments JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Stakeholders Table
CREATE TABLE public.workspace_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  organization TEXT,
  email TEXT,
  phone TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Broadcast Messages Table
CREATE TABLE public.workspace_broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'general',
  channels TEXT[] NOT NULL DEFAULT ARRAY['in-app'],
  target_audience TEXT DEFAULT 'all',
  recipient_ids TEXT[],
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_by UUID,
  delivery_stats JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Enable RLS
-- =====================================================
ALTER TABLE public.workspace_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_press_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_broadcast_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies - Email Campaigns
-- =====================================================
CREATE POLICY "Workspace members can view email campaigns"
ON public.workspace_email_campaigns FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can create email campaigns"
ON public.workspace_email_campaigns FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update email campaigns"
ON public.workspace_email_campaigns FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete email campaigns"
ON public.workspace_email_campaigns FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- =====================================================
-- RLS Policies - Press Releases
-- =====================================================
CREATE POLICY "Workspace members can view press releases"
ON public.workspace_press_releases FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can create press releases"
ON public.workspace_press_releases FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update press releases"
ON public.workspace_press_releases FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete press releases"
ON public.workspace_press_releases FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- =====================================================
-- RLS Policies - Stakeholders
-- =====================================================
CREATE POLICY "Workspace members can view stakeholders"
ON public.workspace_stakeholders FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can create stakeholders"
ON public.workspace_stakeholders FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update stakeholders"
ON public.workspace_stakeholders FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete stakeholders"
ON public.workspace_stakeholders FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- =====================================================
-- RLS Policies - Broadcast Messages
-- =====================================================
CREATE POLICY "Workspace members can view broadcast messages"
ON public.workspace_broadcast_messages FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can create broadcast messages"
ON public.workspace_broadcast_messages FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update broadcast messages"
ON public.workspace_broadcast_messages FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete broadcast messages"
ON public.workspace_broadcast_messages FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- =====================================================
-- Updated At Triggers
-- =====================================================
CREATE TRIGGER set_workspace_email_campaigns_updated_at
  BEFORE UPDATE ON public.workspace_email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_workspace_press_releases_updated_at
  BEFORE UPDATE ON public.workspace_press_releases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_workspace_stakeholders_updated_at
  BEFORE UPDATE ON public.workspace_stakeholders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_workspace_broadcast_messages_updated_at
  BEFORE UPDATE ON public.workspace_broadcast_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX idx_workspace_email_campaigns_workspace ON public.workspace_email_campaigns(workspace_id);
CREATE INDEX idx_workspace_email_campaigns_status ON public.workspace_email_campaigns(status);
CREATE INDEX idx_workspace_press_releases_workspace ON public.workspace_press_releases(workspace_id);
CREATE INDEX idx_workspace_press_releases_status ON public.workspace_press_releases(status);
CREATE INDEX idx_workspace_stakeholders_workspace ON public.workspace_stakeholders(workspace_id);
CREATE INDEX idx_workspace_stakeholders_category ON public.workspace_stakeholders(category);
CREATE INDEX idx_workspace_broadcast_messages_workspace ON public.workspace_broadcast_messages(workspace_id);
CREATE INDEX idx_workspace_broadcast_messages_status ON public.workspace_broadcast_messages(status);