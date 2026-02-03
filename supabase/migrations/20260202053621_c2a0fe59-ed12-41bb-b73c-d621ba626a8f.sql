-- Social Media Accounts for PlatformManager
CREATE TABLE public.social_media_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  handle TEXT NOT NULL,
  followers INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  trend TEXT DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  posts_this_week INTEGER DEFAULT 0,
  posts_goal INTEGER DEFAULT 7,
  color TEXT,
  connected BOOLEAN DEFAULT false,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Hashtag Tracking for HashtagTracker
CREATE TABLE public.hashtag_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  uses_count INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  trend TEXT DEFAULT 'stable' CHECK (trend IN ('trending', 'stable', 'declining')),
  is_primary BOOLEAN DEFAULT false,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, tag)
);

-- Audience Demographics for AudienceInsights
CREATE TABLE public.audience_demographics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  demographic_type TEXT NOT NULL CHECK (demographic_type IN ('age', 'location', 'industry')),
  label TEXT NOT NULL,
  value NUMERIC(5,2) NOT NULL DEFAULT 0,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, demographic_type, label)
);

-- Enable RLS
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtag_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_demographics ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to view/manage data in workspaces they organize
CREATE POLICY "social_media_accounts_select" ON public.social_media_accounts 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.organizer_id = auth.uid())
  OR auth.uid() IS NOT NULL
);

CREATE POLICY "social_media_accounts_insert" ON public.social_media_accounts 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.organizer_id = auth.uid())
);

CREATE POLICY "social_media_accounts_update" ON public.social_media_accounts 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.organizer_id = auth.uid())
);

CREATE POLICY "social_media_accounts_delete" ON public.social_media_accounts 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.organizer_id = auth.uid())
);

CREATE POLICY "hashtag_tracking_select" ON public.hashtag_tracking 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.organizer_id = auth.uid())
  OR auth.uid() IS NOT NULL
);

CREATE POLICY "hashtag_tracking_insert" ON public.hashtag_tracking 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.organizer_id = auth.uid())
);

CREATE POLICY "hashtag_tracking_update" ON public.hashtag_tracking 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.organizer_id = auth.uid())
);

CREATE POLICY "hashtag_tracking_delete" ON public.hashtag_tracking 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.organizer_id = auth.uid())
);

CREATE POLICY "audience_demographics_select" ON public.audience_demographics 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.organizer_id = auth.uid())
  OR auth.uid() IS NOT NULL
);

CREATE POLICY "audience_demographics_insert" ON public.audience_demographics 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.organizer_id = auth.uid())
);

CREATE POLICY "audience_demographics_update" ON public.audience_demographics 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.organizer_id = auth.uid())
);

CREATE POLICY "audience_demographics_delete" ON public.audience_demographics 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.organizer_id = auth.uid())
);

-- Indexes for performance
CREATE INDEX idx_social_media_accounts_workspace ON public.social_media_accounts(workspace_id);
CREATE INDEX idx_hashtag_tracking_workspace ON public.hashtag_tracking(workspace_id);
CREATE INDEX idx_audience_demographics_workspace_type ON public.audience_demographics(workspace_id, demographic_type);