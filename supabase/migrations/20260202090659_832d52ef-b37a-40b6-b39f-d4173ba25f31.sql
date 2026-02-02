-- Create approval_delegations table for OOO/deputy approval workflow
CREATE TABLE IF NOT EXISTS public.approval_delegations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delegator_id UUID NOT NULL,
  delegate_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent self-delegation
  CONSTRAINT no_self_delegation CHECK (delegator_id != delegate_id)
);

-- Create index for quick lookups
CREATE INDEX idx_approval_delegations_delegator ON public.approval_delegations(delegator_id, workspace_id, is_active);
CREATE INDEX idx_approval_delegations_delegate ON public.approval_delegations(delegate_id, workspace_id, is_active);

-- Enable RLS
ALTER TABLE public.approval_delegations ENABLE ROW LEVEL SECURITY;

-- Users can view delegations they created or are delegates for
CREATE POLICY "Users can view their delegations"
  ON public.approval_delegations
  FOR SELECT
  USING (auth.uid() = delegator_id OR auth.uid() = delegate_id);

-- Users can create delegations for themselves
CREATE POLICY "Users can create their own delegations"
  ON public.approval_delegations
  FOR INSERT
  WITH CHECK (auth.uid() = delegator_id);

-- Users can update their own delegations
CREATE POLICY "Users can update their own delegations"
  ON public.approval_delegations
  FOR UPDATE
  USING (auth.uid() = delegator_id);

-- Users can delete their own delegations
CREATE POLICY "Users can delete their own delegations"
  ON public.approval_delegations
  FOR DELETE
  USING (auth.uid() = delegator_id);

-- Add trigger for updated_at
CREATE TRIGGER update_approval_delegations_updated_at
  BEFORE UPDATE ON public.approval_delegations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();