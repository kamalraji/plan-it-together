-- Create workspace_expenses table for tracking expense records
CREATE TABLE public.workspace_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL,
  submitted_by UUID NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_workspace_expenses_workspace_id ON public.workspace_expenses(workspace_id);
CREATE INDEX idx_workspace_expenses_status ON public.workspace_expenses(status);
CREATE INDEX idx_workspace_expenses_submitted_by ON public.workspace_expenses(submitted_by);
CREATE INDEX idx_workspace_expenses_category ON public.workspace_expenses(category);

-- Enable RLS
ALTER TABLE public.workspace_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Workspace members can view expenses
CREATE POLICY "Workspace members can view expenses"
ON public.workspace_expenses
FOR SELECT
USING (public.has_workspace_access(workspace_id));

-- RLS Policies: Workspace members can create expenses
CREATE POLICY "Workspace members can create expenses"
ON public.workspace_expenses
FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id) AND auth.uid() = submitted_by);

-- RLS Policies: Expense submitter or workspace owner can update
CREATE POLICY "Expense submitter or owner can update expenses"
ON public.workspace_expenses
FOR UPDATE
USING (
  public.has_workspace_access(workspace_id) AND 
  (auth.uid() = submitted_by OR public.is_workspace_owner(workspace_id))
);

-- RLS Policies: Workspace owner can delete expenses
CREATE POLICY "Workspace owner can delete expenses"
ON public.workspace_expenses
FOR DELETE
USING (public.is_workspace_owner(workspace_id));

-- Trigger for updated_at
CREATE TRIGGER update_workspace_expenses_updated_at
BEFORE UPDATE ON public.workspace_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();