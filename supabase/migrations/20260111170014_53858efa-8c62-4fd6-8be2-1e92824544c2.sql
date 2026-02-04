-- Create catering headcount confirmations table
CREATE TABLE public.catering_headcount_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  meal_schedule_id UUID REFERENCES public.catering_meal_schedule(id) ON DELETE SET NULL,
  meal_name TEXT NOT NULL,
  meal_date DATE NOT NULL,
  meal_type TEXT NOT NULL DEFAULT 'lunch',
  expected_count INTEGER NOT NULL DEFAULT 0,
  confirmed_count INTEGER,
  confirmation_deadline TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID,
  confirmed_by_name TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.catering_headcount_confirmations ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_headcount_workspace ON public.catering_headcount_confirmations(workspace_id);
CREATE INDEX idx_headcount_date ON public.catering_headcount_confirmations(meal_date);
CREATE INDEX idx_headcount_status ON public.catering_headcount_confirmations(status);

-- Create RLS policies
CREATE POLICY "Workspace members can view headcount confirmations"
ON public.catering_headcount_confirmations
FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can create headcount confirmations"
ON public.catering_headcount_confirmations
FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update headcount confirmations"
ON public.catering_headcount_confirmations
FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete headcount confirmations"
ON public.catering_headcount_confirmations
FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- Create updated_at trigger
CREATE TRIGGER update_catering_headcount_updated_at
  BEFORE UPDATE ON public.catering_headcount_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();