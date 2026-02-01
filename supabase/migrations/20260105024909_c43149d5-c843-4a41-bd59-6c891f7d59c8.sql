-- Create workspace time entries table
CREATE TABLE public.workspace_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.workspace_tasks(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  hours NUMERIC(5,2) NOT NULL CHECK (hours >= 0 AND hours <= 24),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace resource requests table
CREATE TABLE public.workspace_resource_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requesting_workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  target_workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.workspace_resources(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  start_date DATE,
  end_date DATE,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
  review_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_resource_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for time entries
CREATE POLICY "Users can view time entries in their workspaces"
ON public.workspace_time_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_time_entries.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
  )
);

CREATE POLICY "Users can create their own time entries"
ON public.workspace_time_entries FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_time_entries.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
  )
);

CREATE POLICY "Users can update their own time entries"
ON public.workspace_time_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own draft time entries"
ON public.workspace_time_entries FOR DELETE
USING (auth.uid() = user_id AND status = 'draft');

-- RLS policies for resource requests
CREATE POLICY "Users can view resource requests for their workspaces"
ON public.workspace_resource_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE (wtm.workspace_id = workspace_resource_requests.requesting_workspace_id
           OR wtm.workspace_id = workspace_resource_requests.target_workspace_id)
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
  )
);

CREATE POLICY "Users can create resource requests from their workspaces"
ON public.workspace_resource_requests FOR INSERT
WITH CHECK (
  auth.uid() = requested_by AND
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_resource_requests.requesting_workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
  )
);

CREATE POLICY "Target workspace leads can update resource requests"
ON public.workspace_resource_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_resource_requests.target_workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
    AND wtm.role IN ('lead', 'coordinator')
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_workspace_time_entries_updated_at
BEFORE UPDATE ON public.workspace_time_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_resource_requests_updated_at
BEFORE UPDATE ON public.workspace_resource_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_workspace_time_entries_workspace ON public.workspace_time_entries(workspace_id);
CREATE INDEX idx_workspace_time_entries_user ON public.workspace_time_entries(user_id);
CREATE INDEX idx_workspace_time_entries_date ON public.workspace_time_entries(date);
CREATE INDEX idx_workspace_resource_requests_requesting ON public.workspace_resource_requests(requesting_workspace_id);
CREATE INDEX idx_workspace_resource_requests_target ON public.workspace_resource_requests(target_workspace_id);
CREATE INDEX idx_workspace_resource_requests_status ON public.workspace_resource_requests(status);