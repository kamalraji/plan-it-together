-- Content Asset Library for workspace content management
CREATE TABLE public.workspace_content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'document', 'audio')),
  category TEXT,
  url TEXT NOT NULL,
  size_bytes BIGINT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sponsorship Benefits Matrix for event sponsor tier management
CREATE TABLE public.sponsorship_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  benefit TEXT NOT NULL,
  tier_platinum BOOLEAN DEFAULT false,
  tier_gold BOOLEAN DEFAULT false,
  tier_silver BOOLEAN DEFAULT false,
  tier_bronze BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_benefits ENABLE ROW LEVEL SECURITY;

-- RLS policies for workspace_content_assets
CREATE POLICY "Workspace members can view content assets"
  ON public.workspace_content_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_content_assets.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create content assets"
  ON public.workspace_content_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_content_assets.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Asset creators and workspace managers can update"
  ON public.workspace_content_assets FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_content_assets.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.role IN ('LEAD', 'MANAGER')
    )
  );

CREATE POLICY "Asset creators and workspace managers can delete"
  ON public.workspace_content_assets FOR DELETE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_content_assets.workspace_id
      AND wtm.user_id = auth.uid()
      AND wtm.role IN ('LEAD', 'MANAGER')
    )
  );

-- RLS policies for sponsorship_benefits
CREATE POLICY "Event workspace members can view sponsorship benefits"
  ON public.sponsorship_benefits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = w.id
      WHERE w.event_id = sponsorship_benefits.event_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Event organizers can manage sponsorship benefits"
  ON public.sponsorship_benefits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = w.id
      WHERE w.event_id = sponsorship_benefits.event_id
      AND w.workspace_type = 'ROOT'
      AND wtm.user_id = auth.uid()
      AND wtm.role IN ('LEAD', 'MANAGER')
    )
  );

-- Indexes for performance
CREATE INDEX idx_workspace_content_assets_workspace ON public.workspace_content_assets(workspace_id);
CREATE INDEX idx_workspace_content_assets_type ON public.workspace_content_assets(type);
CREATE INDEX idx_sponsorship_benefits_event ON public.sponsorship_benefits(event_id);

-- Updated_at trigger for workspace_content_assets
CREATE TRIGGER update_workspace_content_assets_updated_at
  BEFORE UPDATE ON public.workspace_content_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Updated_at trigger for sponsorship_benefits
CREATE TRIGGER update_sponsorship_benefits_updated_at
  BEFORE UPDATE ON public.sponsorship_benefits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();