-- Create table for deadline extension requests
CREATE TABLE public.checklist_deadline_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.workspace_checklists(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  current_due_date TIMESTAMP WITH TIME ZONE,
  requested_due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  justification TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checklist_deadline_extensions ENABLE ROW LEVEL SECURITY;

-- Policies for deadline extensions
CREATE POLICY "Users can view extension requests for their workspaces"
ON public.checklist_deadline_extensions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_checklists wc
    JOIN public.workspace_team_members wtm ON wtm.workspace_id = wc.workspace_id
    WHERE wc.id = checklist_id AND wtm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.workspace_checklists wc
    JOIN public.workspace_team_members wtm ON wtm.workspace_id = wc.delegated_from_workspace_id
    WHERE wc.id = checklist_id AND wtm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.workspace_checklists wc
    JOIN public.workspaces w ON w.id = wc.workspace_id
    WHERE wc.id = checklist_id AND w.organizer_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.workspace_checklists wc
    JOIN public.workspaces w ON w.id = wc.delegated_from_workspace_id
    WHERE wc.id = checklist_id AND w.organizer_id = auth.uid()
  )
);

CREATE POLICY "Members can create extension requests for their checklists"
ON public.checklist_deadline_extensions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_checklists wc
    JOIN public.workspace_team_members wtm ON wtm.workspace_id = wc.workspace_id
    WHERE wc.id = checklist_id AND wtm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.workspace_checklists wc
    JOIN public.workspaces w ON w.id = wc.workspace_id
    WHERE wc.id = checklist_id AND w.organizer_id = auth.uid()
  )
);

CREATE POLICY "Parent workspace members can update extension requests"
ON public.checklist_deadline_extensions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_checklists wc
    JOIN public.workspace_team_members wtm ON wtm.workspace_id = wc.delegated_from_workspace_id
    WHERE wc.id = checklist_id AND wtm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.workspace_checklists wc
    JOIN public.workspaces w ON w.id = wc.delegated_from_workspace_id
    WHERE wc.id = checklist_id AND w.organizer_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_checklist_deadline_extensions_updated_at
BEFORE UPDATE ON public.checklist_deadline_extensions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();