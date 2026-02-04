-- =============================================
-- Sponsorship Committee Tables Migration
-- =============================================

-- 1. Sponsor Proposals Pipeline Table
CREATE TABLE public.workspace_sponsor_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sponsor_id UUID REFERENCES public.workspace_sponsors(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  proposed_tier TEXT NOT NULL DEFAULT 'silver',
  proposed_value NUMERIC(12,2) DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'lead',
  stage_entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  proposal_document_url TEXT,
  notes TEXT,
  next_follow_up_date DATE,
  assigned_to UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Sponsor Deliverables Tracking Table
CREATE TABLE public.workspace_sponsor_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES public.workspace_sponsors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  due_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  proof_url TEXT,
  notes TEXT,
  assigned_to UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sponsor Benefits/Packages Table
CREATE TABLE public.workspace_sponsor_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  value_estimate NUMERIC(10,2),
  quantity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Sponsor Communications Log Table
CREATE TABLE public.workspace_sponsor_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES public.workspace_sponsors(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'email',
  subject TEXT NOT NULL,
  content TEXT,
  direction TEXT DEFAULT 'outbound',
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_email TEXT,
  attachments TEXT[],
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Enable RLS on all tables
-- =============================================
ALTER TABLE public.workspace_sponsor_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_sponsor_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_sponsor_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_sponsor_communications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for workspace_sponsor_proposals
-- =============================================
CREATE POLICY "Workspace members can view proposals"
  ON public.workspace_sponsor_proposals FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can insert proposals"
  ON public.workspace_sponsor_proposals FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update proposals"
  ON public.workspace_sponsor_proposals FOR UPDATE
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace owners can delete proposals"
  ON public.workspace_sponsor_proposals FOR DELETE
  USING (public.is_workspace_owner(workspace_id));

-- =============================================
-- RLS Policies for workspace_sponsor_deliverables
-- =============================================
CREATE POLICY "Workspace members can view deliverables"
  ON public.workspace_sponsor_deliverables FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can insert deliverables"
  ON public.workspace_sponsor_deliverables FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update deliverables"
  ON public.workspace_sponsor_deliverables FOR UPDATE
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace owners can delete deliverables"
  ON public.workspace_sponsor_deliverables FOR DELETE
  USING (public.is_workspace_owner(workspace_id));

-- =============================================
-- RLS Policies for workspace_sponsor_benefits
-- =============================================
CREATE POLICY "Workspace members can view benefits"
  ON public.workspace_sponsor_benefits FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can insert benefits"
  ON public.workspace_sponsor_benefits FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update benefits"
  ON public.workspace_sponsor_benefits FOR UPDATE
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace owners can delete benefits"
  ON public.workspace_sponsor_benefits FOR DELETE
  USING (public.is_workspace_owner(workspace_id));

-- =============================================
-- RLS Policies for workspace_sponsor_communications
-- =============================================
CREATE POLICY "Workspace members can view communications"
  ON public.workspace_sponsor_communications FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can insert communications"
  ON public.workspace_sponsor_communications FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update communications"
  ON public.workspace_sponsor_communications FOR UPDATE
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace owners can delete communications"
  ON public.workspace_sponsor_communications FOR DELETE
  USING (public.is_workspace_owner(workspace_id));

-- =============================================
-- Updated_at Triggers
-- =============================================
CREATE TRIGGER set_sponsor_proposals_updated_at
  BEFORE UPDATE ON public.workspace_sponsor_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_sponsor_deliverables_updated_at
  BEFORE UPDATE ON public.workspace_sponsor_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_sponsor_benefits_updated_at
  BEFORE UPDATE ON public.workspace_sponsor_benefits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_sponsor_communications_updated_at
  BEFORE UPDATE ON public.workspace_sponsor_communications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Performance Indexes
-- =============================================
CREATE INDEX idx_sponsor_proposals_workspace ON public.workspace_sponsor_proposals(workspace_id);
CREATE INDEX idx_sponsor_proposals_stage ON public.workspace_sponsor_proposals(stage);
CREATE INDEX idx_sponsor_proposals_sponsor ON public.workspace_sponsor_proposals(sponsor_id);

CREATE INDEX idx_sponsor_deliverables_workspace ON public.workspace_sponsor_deliverables(workspace_id);
CREATE INDEX idx_sponsor_deliverables_sponsor ON public.workspace_sponsor_deliverables(sponsor_id);
CREATE INDEX idx_sponsor_deliverables_status ON public.workspace_sponsor_deliverables(status);
CREATE INDEX idx_sponsor_deliverables_due_date ON public.workspace_sponsor_deliverables(due_date);

CREATE INDEX idx_sponsor_benefits_workspace ON public.workspace_sponsor_benefits(workspace_id);
CREATE INDEX idx_sponsor_benefits_tier ON public.workspace_sponsor_benefits(tier);

CREATE INDEX idx_sponsor_communications_workspace ON public.workspace_sponsor_communications(workspace_id);
CREATE INDEX idx_sponsor_communications_sponsor ON public.workspace_sponsor_communications(sponsor_id);
CREATE INDEX idx_sponsor_communications_type ON public.workspace_sponsor_communications(type);