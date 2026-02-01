-- Create email_templates table for reusable reminder templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'reminder' CHECK (category IN ('reminder', 'confirmation', 'update', 'custom')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  include_qr_code BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Workspace team members can manage templates
CREATE POLICY "Workspace team can view templates"
  ON public.email_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = email_templates.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace team can create templates"
  ON public.email_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = email_templates.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace team can update templates"
  ON public.email_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = email_templates.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace team can delete templates"
  ON public.email_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_team_members wtm
      WHERE wtm.workspace_id = email_templates.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_email_templates_workspace ON public.email_templates(workspace_id);
CREATE INDEX idx_email_templates_category ON public.email_templates(category);

-- Function to count attendees not checked in for an event
CREATE OR REPLACE FUNCTION public.count_not_checked_in(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result INTEGER;
BEGIN
  SELECT COUNT(DISTINCT r.id)
  INTO result
  FROM registrations r
  WHERE r.event_id = p_event_id
    AND r.status = 'CONFIRMED'
    AND NOT EXISTS (
      SELECT 1 FROM attendance_records ar
      WHERE ar.registration_id = r.id
    );
  
  RETURN COALESCE(result, 0);
END;
$$;