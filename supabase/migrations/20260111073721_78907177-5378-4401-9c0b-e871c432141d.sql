-- Create Growth Department tables with RLS (excluding workspace_goals which already exists)

-- 1. Workspace Campaigns - Marketing Campaign Management
CREATE TABLE IF NOT EXISTS public.workspace_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL DEFAULT 'multi-channel',
  status TEXT NOT NULL DEFAULT 'draft',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  target_audience JSONB DEFAULT '{}',
  utm_params JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_campaign_status CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
  CONSTRAINT valid_campaign_channel CHECK (channel IN ('multi-channel', 'social_media', 'email', 'linkedin', 'google_ads', 'facebook', 'instagram', 'twitter', 'tiktok'))
);

-- 2. Workspace Sponsors - Sponsorship Tracking
CREATE TABLE IF NOT EXISTS public.workspace_sponsors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  tier TEXT NOT NULL DEFAULT 'bronze',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contract_value NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  deliverables JSONB DEFAULT '[]',
  deliverables_status JSONB DEFAULT '{}',
  proposal_sent_at TIMESTAMPTZ,
  contract_signed_at TIMESTAMPTZ,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'prospect',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_sponsor_tier CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze', 'custom')),
  CONSTRAINT valid_sponsor_status CHECK (status IN ('prospect', 'negotiating', 'confirmed', 'declined', 'churned')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue'))
);

-- 3. Workspace Partners - Influencer/Partner Management
CREATE TABLE IF NOT EXISTS public.workspace_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  partner_type TEXT NOT NULL DEFAULT 'strategic',
  contact_name TEXT,
  contact_email TEXT,
  social_handles JSONB DEFAULT '{}',
  reach INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  partnership_value NUMERIC DEFAULT 0,
  commission_percentage NUMERIC DEFAULT 0,
  deliverables JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_partner_type CHECK (partner_type IN ('influencer', 'media', 'affiliate', 'strategic', 'community')),
  CONSTRAINT valid_partner_status CHECK (status IN ('active', 'pending', 'completed', 'cancelled'))
);

-- 4. Workspace Announcements - Broadcast Communications
CREATE TABLE IF NOT EXISTS public.workspace_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT NOT NULL DEFAULT 'general',
  target_audience TEXT NOT NULL DEFAULT 'all',
  channels JSONB DEFAULT '["in-app"]',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_by UUID REFERENCES auth.users(id),
  recipients_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_announcement_type CHECK (announcement_type IN ('general', 'urgent', 'reminder', 'update')),
  CONSTRAINT valid_target_audience CHECK (target_audience IN ('all', 'team', 'stakeholders', 'public')),
  CONSTRAINT valid_announcement_status CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled'))
);

-- 5. Workspace PR Contacts - Press/Media Database
CREATE TABLE IF NOT EXISTS public.workspace_pr_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  outlet_name TEXT,
  contact_type TEXT NOT NULL DEFAULT 'journalist',
  email TEXT,
  phone TEXT,
  social_handles JSONB DEFAULT '{}',
  beat TEXT,
  last_contacted_at TIMESTAMPTZ,
  response_rate NUMERIC DEFAULT 0,
  notes TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_contact_type CHECK (contact_type IN ('journalist', 'blogger', 'editor', 'producer', 'podcaster')),
  CONSTRAINT valid_priority CHECK (priority IN ('high', 'medium', 'low')),
  CONSTRAINT valid_pr_status CHECK (status IN ('active', 'unresponsive', 'do_not_contact'))
);

-- Enable RLS on all tables
ALTER TABLE public.workspace_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_pr_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_campaigns
CREATE POLICY "Workspace members can view campaigns"
  ON public.workspace_campaigns FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can insert campaigns"
  ON public.workspace_campaigns FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update campaigns"
  ON public.workspace_campaigns FOR UPDATE
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete campaigns"
  ON public.workspace_campaigns FOR DELETE
  USING (public.has_workspace_access(workspace_id));

-- RLS Policies for workspace_sponsors
CREATE POLICY "Workspace members can view sponsors"
  ON public.workspace_sponsors FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can insert sponsors"
  ON public.workspace_sponsors FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update sponsors"
  ON public.workspace_sponsors FOR UPDATE
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete sponsors"
  ON public.workspace_sponsors FOR DELETE
  USING (public.has_workspace_access(workspace_id));

-- RLS Policies for workspace_partners
CREATE POLICY "Workspace members can view partners"
  ON public.workspace_partners FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can insert partners"
  ON public.workspace_partners FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update partners"
  ON public.workspace_partners FOR UPDATE
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete partners"
  ON public.workspace_partners FOR DELETE
  USING (public.has_workspace_access(workspace_id));

-- RLS Policies for workspace_announcements
CREATE POLICY "Workspace members can view announcements"
  ON public.workspace_announcements FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can insert announcements"
  ON public.workspace_announcements FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update announcements"
  ON public.workspace_announcements FOR UPDATE
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete announcements"
  ON public.workspace_announcements FOR DELETE
  USING (public.has_workspace_access(workspace_id));

-- RLS Policies for workspace_pr_contacts
CREATE POLICY "Workspace members can view PR contacts"
  ON public.workspace_pr_contacts FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can insert PR contacts"
  ON public.workspace_pr_contacts FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update PR contacts"
  ON public.workspace_pr_contacts FOR UPDATE
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete PR contacts"
  ON public.workspace_pr_contacts FOR DELETE
  USING (public.has_workspace_access(workspace_id));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspace_campaigns_workspace ON public.workspace_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_campaigns_status ON public.workspace_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_workspace_sponsors_workspace ON public.workspace_sponsors(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_sponsors_tier ON public.workspace_sponsors(tier);
CREATE INDEX IF NOT EXISTS idx_workspace_partners_workspace ON public.workspace_partners(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_announcements_workspace ON public.workspace_announcements(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_pr_contacts_workspace ON public.workspace_pr_contacts(workspace_id);

-- Create updated_at triggers
CREATE TRIGGER update_workspace_campaigns_updated_at
  BEFORE UPDATE ON public.workspace_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_sponsors_updated_at
  BEFORE UPDATE ON public.workspace_sponsors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_partners_updated_at
  BEFORE UPDATE ON public.workspace_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_announcements_updated_at
  BEFORE UPDATE ON public.workspace_announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_pr_contacts_updated_at
  BEFORE UPDATE ON public.workspace_pr_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();