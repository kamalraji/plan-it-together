-- Media crew table for photographers/videographers
CREATE TABLE public.media_crew (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  crew_type TEXT NOT NULL CHECK (crew_type IN ('photographer', 'videographer', 'drone', 'audio')),
  assignment TEXT,
  status TEXT NOT NULL DEFAULT 'off_duty' CHECK (status IN ('on_duty', 'off_duty', 'break')),
  equipment TEXT[] DEFAULT '{}',
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coverage schedule for media events
CREATE TABLE public.media_coverage_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  coverage_type TEXT NOT NULL DEFAULT 'both' CHECK (coverage_type IN ('photo', 'video', 'both')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coverage crew assignments (many-to-many)
CREATE TABLE public.media_coverage_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coverage_id UUID NOT NULL REFERENCES public.media_coverage_schedule(id) ON DELETE CASCADE,
  crew_id UUID NOT NULL REFERENCES public.media_crew(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coverage_id, crew_id)
);

-- Press credentials
CREATE TABLE public.press_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  outlet TEXT NOT NULL,
  credential_type TEXT NOT NULL CHECK (credential_type IN ('print', 'broadcast', 'online', 'freelance')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  access_level TEXT NOT NULL DEFAULT 'restricted' CHECK (access_level IN ('full', 'restricted', 'press_room_only')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ad channels for marketing performance
CREATE TABLE public.ad_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  spend DECIMAL(10,2) NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Branding assets for marketing
CREATE TABLE public.branding_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'banner', 'template', 'video', 'guideline', 'other')),
  file_url TEXT,
  format TEXT,
  file_size TEXT,
  downloads INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.media_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_coverage_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_coverage_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies for media_crew
CREATE POLICY "Users can view media crew in their workspaces"
ON public.media_crew FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = media_crew.workspace_id
    AND wtm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage media crew in their workspaces"
ON public.media_crew FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = media_crew.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.role IN ('LEAD', 'MANAGER', 'ADMIN')
  )
);

-- RLS policies for media_coverage_schedule
CREATE POLICY "Users can view coverage schedule in their workspaces"
ON public.media_coverage_schedule FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = media_coverage_schedule.workspace_id
    AND wtm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage coverage schedule in their workspaces"
ON public.media_coverage_schedule FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = media_coverage_schedule.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.role IN ('LEAD', 'MANAGER', 'ADMIN')
  )
);

-- RLS policies for media_coverage_assignments
CREATE POLICY "Users can view coverage assignments in their workspaces"
ON public.media_coverage_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.media_coverage_schedule mcs
    JOIN public.workspace_team_members wtm ON wtm.workspace_id = mcs.workspace_id
    WHERE mcs.id = media_coverage_assignments.coverage_id
    AND wtm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage coverage assignments in their workspaces"
ON public.media_coverage_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.media_coverage_schedule mcs
    JOIN public.workspace_team_members wtm ON wtm.workspace_id = mcs.workspace_id
    WHERE mcs.id = media_coverage_assignments.coverage_id
    AND wtm.user_id = auth.uid()
    AND wtm.role IN ('LEAD', 'MANAGER', 'ADMIN')
  )
);

-- RLS policies for press_credentials
CREATE POLICY "Users can view press credentials in their workspaces"
ON public.press_credentials FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = press_credentials.workspace_id
    AND wtm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage press credentials in their workspaces"
ON public.press_credentials FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = press_credentials.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.role IN ('LEAD', 'MANAGER', 'ADMIN')
  )
);

-- RLS policies for ad_channels
CREATE POLICY "Users can view ad channels in their workspaces"
ON public.ad_channels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = ad_channels.workspace_id
    AND wtm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage ad channels in their workspaces"
ON public.ad_channels FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = ad_channels.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.role IN ('LEAD', 'MANAGER', 'ADMIN')
  )
);

-- RLS policies for branding_assets
CREATE POLICY "Users can view branding assets in their workspaces"
ON public.branding_assets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = branding_assets.workspace_id
    AND wtm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage branding assets in their workspaces"
ON public.branding_assets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = branding_assets.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.role IN ('LEAD', 'MANAGER', 'ADMIN')
  )
);

-- Create indexes for performance
CREATE INDEX idx_media_crew_workspace ON public.media_crew(workspace_id);
CREATE INDEX idx_media_coverage_schedule_workspace ON public.media_coverage_schedule(workspace_id);
CREATE INDEX idx_media_coverage_schedule_start ON public.media_coverage_schedule(start_time);
CREATE INDEX idx_press_credentials_workspace ON public.press_credentials(workspace_id);
CREATE INDEX idx_press_credentials_status ON public.press_credentials(status);
CREATE INDEX idx_ad_channels_workspace ON public.ad_channels(workspace_id);
CREATE INDEX idx_ad_channels_date ON public.ad_channels(date);
CREATE INDEX idx_branding_assets_workspace ON public.branding_assets(workspace_id);

-- Update triggers
CREATE TRIGGER update_media_crew_updated_at
  BEFORE UPDATE ON public.media_crew
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_media_coverage_schedule_updated_at
  BEFORE UPDATE ON public.media_coverage_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_press_credentials_updated_at
  BEFORE UPDATE ON public.press_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_channels_updated_at
  BEFORE UPDATE ON public.ad_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branding_assets_updated_at
  BEFORE UPDATE ON public.branding_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();