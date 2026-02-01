-- Create volunteer_shifts table for managing shift schedules
CREATE TABLE public.volunteer_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  required_volunteers INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create volunteer_assignments table for tracking volunteer-to-shift assignments
CREATE TABLE public.volunteer_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID NOT NULL REFERENCES public.volunteer_shifts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'confirmed', 'checked_in', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shift_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_volunteer_shifts_workspace_id ON public.volunteer_shifts(workspace_id);
CREATE INDEX idx_volunteer_shifts_date ON public.volunteer_shifts(date);
CREATE INDEX idx_volunteer_assignments_shift_id ON public.volunteer_assignments(shift_id);
CREATE INDEX idx_volunteer_assignments_user_id ON public.volunteer_assignments(user_id);

-- Enable RLS
ALTER TABLE public.volunteer_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for volunteer_shifts (workspace members can view, owners/managers can modify)
CREATE POLICY "Workspace members can view shifts"
ON public.volunteer_shifts FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace owners can insert shifts"
ON public.volunteer_shifts FOR INSERT
WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Workspace owners can update shifts"
ON public.volunteer_shifts FOR UPDATE
USING (public.is_workspace_owner(workspace_id));

CREATE POLICY "Workspace owners can delete shifts"
ON public.volunteer_shifts FOR DELETE
USING (public.is_workspace_owner(workspace_id));

-- RLS policies for volunteer_assignments
CREATE POLICY "Workspace members can view assignments"
ON public.volunteer_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.volunteer_shifts vs
    WHERE vs.id = shift_id
    AND public.has_workspace_access(vs.workspace_id)
  )
);

CREATE POLICY "Workspace owners can insert assignments"
ON public.volunteer_assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.volunteer_shifts vs
    WHERE vs.id = shift_id
    AND public.is_workspace_owner(vs.workspace_id)
  )
);

CREATE POLICY "Workspace owners can update assignments"
ON public.volunteer_assignments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.volunteer_shifts vs
    WHERE vs.id = shift_id
    AND public.is_workspace_owner(vs.workspace_id)
  )
);

CREATE POLICY "Workspace owners can delete assignments"
ON public.volunteer_assignments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.volunteer_shifts vs
    WHERE vs.id = shift_id
    AND public.is_workspace_owner(vs.workspace_id)
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_volunteer_shifts_updated_at
BEFORE UPDATE ON public.volunteer_shifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_volunteer_assignments_updated_at
BEFORE UPDATE ON public.volunteer_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();