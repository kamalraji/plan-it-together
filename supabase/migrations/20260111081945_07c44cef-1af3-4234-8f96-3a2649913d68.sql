-- Content Approval Workflow Table
CREATE TABLE public.content_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  current_stage TEXT NOT NULL DEFAULT 'submitted',
  priority TEXT DEFAULT 'medium',
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_committee TEXT,
  target_platforms TEXT[] DEFAULT '{}',
  scheduled_publish_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approval Stage History
CREATE TABLE public.content_approval_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL REFERENCES public.content_approvals(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_name TEXT,
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social API Credentials
CREATE TABLE public.workspace_social_api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  credential_type TEXT NOT NULL,
  encrypted_credentials JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, platform)
);

-- Social Media Post Queue
CREATE TABLE public.social_post_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  social_post_id UUID REFERENCES public.workspace_social_posts(id) ON DELETE CASCADE,
  approval_id UUID REFERENCES public.content_approvals(id),
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  external_post_id TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Sync Log
CREATE TABLE public.social_analytics_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_approval_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_social_api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_analytics_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_approvals
CREATE POLICY "Workspace members can view content approvals"
  ON public.content_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = content_approvals.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'active'
    )
  );

CREATE POLICY "Workspace members can create content approvals"
  ON public.content_approvals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = content_approvals.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'active'
    )
  );

CREATE POLICY "Workspace leads can update content approvals"
  ON public.content_approvals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = content_approvals.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'active'
      AND wtm.role IN ('owner', 'manager', 'lead')
    )
  );

-- RLS Policies for content_approval_stages
CREATE POLICY "Workspace members can view approval stages"
  ON public.content_approval_stages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.content_approvals ca
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = ca.workspace_id
      WHERE ca.id = content_approval_stages.approval_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'active'
    )
  );

CREATE POLICY "Reviewers can insert approval stages"
  ON public.content_approval_stages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.content_approvals ca
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = ca.workspace_id
      WHERE ca.id = content_approval_stages.approval_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'active'
      AND wtm.role IN ('owner', 'manager', 'lead')
    )
  );

-- RLS Policies for social_api_credentials
CREATE POLICY "Workspace managers can manage API credentials"
  ON public.workspace_social_api_credentials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_social_api_credentials.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'active'
      AND wtm.role IN ('owner', 'manager')
    )
  );

-- RLS Policies for social_post_queue
CREATE POLICY "Workspace members can view post queue"
  ON public.social_post_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = social_post_queue.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'active'
    )
  );

CREATE POLICY "Workspace leads can manage post queue"
  ON public.social_post_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = social_post_queue.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'active'
      AND wtm.role IN ('owner', 'manager', 'lead')
    )
  );

-- RLS Policies for analytics sync log
CREATE POLICY "Workspace members can view sync logs"
  ON public.social_analytics_sync_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = social_analytics_sync_log.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'active'
    )
  );

-- Create indexes
CREATE INDEX idx_content_approvals_workspace ON public.content_approvals(workspace_id);
CREATE INDEX idx_content_approvals_stage ON public.content_approvals(current_stage);
CREATE INDEX idx_approval_stages_approval ON public.content_approval_stages(approval_id);
CREATE INDEX idx_social_post_queue_workspace ON public.social_post_queue(workspace_id);
CREATE INDEX idx_social_post_queue_status ON public.social_post_queue(status, scheduled_for);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_content_approvals_updated_at
  BEFORE UPDATE ON public.content_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_api_credentials_updated_at
  BEFORE UPDATE ON public.workspace_social_api_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_post_queue_updated_at
  BEFORE UPDATE ON public.social_post_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();