-- Create tech check sections table
CREATE TABLE public.workspace_tech_check_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT DEFAULT 'Settings',
  order_index INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tech check items table
CREATE TABLE public.workspace_tech_check_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.workspace_tech_check_sections(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  checked BOOLEAN DEFAULT false,
  assignee_id UUID REFERENCES auth.users(id),
  checked_at TIMESTAMPTZ,
  checked_by UUID REFERENCES auth.users(id),
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workspace_tech_check_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_tech_check_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for sections
CREATE POLICY "Workspace team can view tech check sections"
  ON public.workspace_tech_check_sections FOR SELECT
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can insert tech check sections"
  ON public.workspace_tech_check_sections FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can update tech check sections"
  ON public.workspace_tech_check_sections FOR UPDATE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can delete tech check sections"
  ON public.workspace_tech_check_sections FOR DELETE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

-- RLS policies for items
CREATE POLICY "Workspace team can view tech check items"
  ON public.workspace_tech_check_items FOR SELECT
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can insert tech check items"
  ON public.workspace_tech_check_items FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can update tech check items"
  ON public.workspace_tech_check_items FOR UPDATE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

CREATE POLICY "Workspace team can delete tech check items"
  ON public.workspace_tech_check_items FOR DELETE
  USING (public.has_workspace_access(workspace_id, auth.uid()));

-- Indexes for performance
CREATE INDEX idx_tech_check_sections_workspace ON public.workspace_tech_check_sections(workspace_id);
CREATE INDEX idx_tech_check_items_section ON public.workspace_tech_check_items(section_id);
CREATE INDEX idx_tech_check_items_workspace ON public.workspace_tech_check_items(workspace_id);
CREATE INDEX idx_tech_check_items_assignee ON public.workspace_tech_check_items(assignee_id);

-- Trigger for updated_at
CREATE TRIGGER update_tech_check_sections_updated_at
  BEFORE UPDATE ON public.workspace_tech_check_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tech_check_items_updated_at
  BEFORE UPDATE ON public.workspace_tech_check_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();