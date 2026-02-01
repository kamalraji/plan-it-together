-- Create A/B Testing table for Marketing Committee
CREATE TABLE public.workspace_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.workspace_campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  test_type TEXT NOT NULL DEFAULT 'content', -- content, subject, timing, audience
  status TEXT NOT NULL DEFAULT 'draft', -- draft, running, paused, completed, cancelled
  variant_a JSONB NOT NULL DEFAULT '{}',
  variant_b JSONB NOT NULL DEFAULT '{}',
  variant_a_metrics JSONB DEFAULT '{"impressions": 0, "clicks": 0, "conversions": 0}',
  variant_b_metrics JSONB DEFAULT '{"impressions": 0, "clicks": 0, "conversions": 0}',
  sample_size INTEGER DEFAULT 100,
  current_sample INTEGER DEFAULT 0,
  winner TEXT, -- 'a', 'b', 'tie', or null
  confidence_level NUMERIC(5,2),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_ab_tests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view A/B tests in their workspace"
ON public.workspace_ab_tests FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can create A/B tests"
ON public.workspace_ab_tests FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update A/B tests"
ON public.workspace_ab_tests FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete A/B tests"
ON public.workspace_ab_tests FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- Create indexes
CREATE INDEX idx_workspace_ab_tests_workspace ON public.workspace_ab_tests(workspace_id);
CREATE INDEX idx_workspace_ab_tests_campaign ON public.workspace_ab_tests(campaign_id);
CREATE INDEX idx_workspace_ab_tests_status ON public.workspace_ab_tests(status);

-- Create trigger for updated_at
CREATE TRIGGER set_workspace_ab_tests_updated_at
BEFORE UPDATE ON public.workspace_ab_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();