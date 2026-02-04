-- Create Social Media Committee tables with RLS

-- 1. Social Posts Management
CREATE TABLE public.workspace_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  platform TEXT NOT NULL,
  post_type TEXT DEFAULT 'image',
  media_urls TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft',
  engagement_likes INTEGER DEFAULT 0,
  engagement_comments INTEGER DEFAULT 0,
  engagement_shares INTEGER DEFAULT 0,
  engagement_saves INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Hashtag Performance Tracking
CREATE TABLE public.workspace_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  uses_count INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  trend TEXT DEFAULT 'stable',
  is_primary BOOLEAN DEFAULT FALSE,
  category TEXT,
  last_tracked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, tag)
);

-- 3. Connected Social Platforms
CREATE TABLE public.workspace_social_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  display_name TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  is_connected BOOLEAN DEFAULT TRUE,
  profile_url TEXT,
  avatar_url TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, platform)
);

-- 4. Engagement Analytics Reports
CREATE TABLE public.workspace_engagement_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  platform TEXT NOT NULL,
  total_followers INTEGER DEFAULT 0,
  follower_growth INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_saves INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  top_performing_post_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, report_date, platform)
);

-- Enable RLS on all tables
ALTER TABLE public.workspace_social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_social_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_engagement_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_social_posts
CREATE POLICY "Users can view social posts in their workspace"
  ON public.workspace_social_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members
      WHERE workspace_id = workspace_social_posts.workspace_id
      AND user_id = auth.uid()
      AND status = 'ACTIVE'
    )
  );

CREATE POLICY "Users can manage social posts in their workspace"
  ON public.workspace_social_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members
      WHERE workspace_id = workspace_social_posts.workspace_id
      AND user_id = auth.uid()
      AND status = 'ACTIVE'
    )
  );

-- RLS Policies for workspace_hashtags
CREATE POLICY "Users can view hashtags in their workspace"
  ON public.workspace_hashtags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members
      WHERE workspace_id = workspace_hashtags.workspace_id
      AND user_id = auth.uid()
      AND status = 'ACTIVE'
    )
  );

CREATE POLICY "Users can manage hashtags in their workspace"
  ON public.workspace_hashtags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members
      WHERE workspace_id = workspace_hashtags.workspace_id
      AND user_id = auth.uid()
      AND status = 'ACTIVE'
    )
  );

-- RLS Policies for workspace_social_platforms
CREATE POLICY "Users can view platforms in their workspace"
  ON public.workspace_social_platforms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members
      WHERE workspace_id = workspace_social_platforms.workspace_id
      AND user_id = auth.uid()
      AND status = 'ACTIVE'
    )
  );

CREATE POLICY "Users can manage platforms in their workspace"
  ON public.workspace_social_platforms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members
      WHERE workspace_id = workspace_social_platforms.workspace_id
      AND user_id = auth.uid()
      AND status = 'ACTIVE'
    )
  );

-- RLS Policies for workspace_engagement_reports
CREATE POLICY "Users can view engagement reports in their workspace"
  ON public.workspace_engagement_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members
      WHERE workspace_id = workspace_engagement_reports.workspace_id
      AND user_id = auth.uid()
      AND status = 'ACTIVE'
    )
  );

CREATE POLICY "Users can manage engagement reports in their workspace"
  ON public.workspace_engagement_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members
      WHERE workspace_id = workspace_engagement_reports.workspace_id
      AND user_id = auth.uid()
      AND status = 'ACTIVE'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_social_posts_workspace ON public.workspace_social_posts(workspace_id);
CREATE INDEX idx_social_posts_status ON public.workspace_social_posts(status);
CREATE INDEX idx_social_posts_scheduled ON public.workspace_social_posts(scheduled_for);
CREATE INDEX idx_hashtags_workspace ON public.workspace_hashtags(workspace_id);
CREATE INDEX idx_platforms_workspace ON public.workspace_social_platforms(workspace_id);
CREATE INDEX idx_engagement_workspace_date ON public.workspace_engagement_reports(workspace_id, report_date);

-- Trigger for updated_at
CREATE TRIGGER update_workspace_social_posts_updated_at
  BEFORE UPDATE ON public.workspace_social_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_hashtags_updated_at
  BEFORE UPDATE ON public.workspace_hashtags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_social_platforms_updated_at
  BEFORE UPDATE ON public.workspace_social_platforms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();