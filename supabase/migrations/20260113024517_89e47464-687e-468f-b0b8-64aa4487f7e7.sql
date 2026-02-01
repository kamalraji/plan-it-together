-- Create workspace_invoices table for invoice management
CREATE TABLE public.workspace_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_id UUID REFERENCES public.catering_vendors(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  payment_terms TEXT,
  notes TEXT,
  attachment_url TEXT,
  created_by UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workspace_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view invoices for workspaces they have access to"
  ON public.workspace_invoices FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can insert invoices for workspaces they have access to"
  ON public.workspace_invoices FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can update invoices for workspaces they have access to"
  ON public.workspace_invoices FOR UPDATE
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can delete invoices for workspaces they have access to"
  ON public.workspace_invoices FOR DELETE
  USING (public.has_workspace_access(workspace_id));

-- Updated_at trigger
CREATE TRIGGER set_workspace_invoices_updated_at
  BEFORE UPDATE ON public.workspace_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for faster queries
CREATE INDEX idx_workspace_invoices_workspace_id ON public.workspace_invoices(workspace_id);
CREATE INDEX idx_workspace_invoices_status ON public.workspace_invoices(status);
CREATE INDEX idx_workspace_invoices_due_date ON public.workspace_invoices(due_date);
CREATE INDEX idx_workspace_invoices_vendor_id ON public.workspace_invoices(vendor_id);