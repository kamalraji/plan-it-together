-- Create id_card_templates table for storing ID card designs
CREATE TABLE id_card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  card_type TEXT DEFAULT 'attendee', -- 'attendee', 'vip', 'staff', 'speaker', 'volunteer'
  design JSONB NOT NULL DEFAULT '{}',
  dimensions JSONB DEFAULT '{"width": 85.6, "height": 53.98, "unit": "mm"}', -- Standard CR80 card
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_id_card_templates_event_id ON id_card_templates(event_id);
CREATE INDEX idx_id_card_templates_workspace_id ON id_card_templates(workspace_id);

-- Enable RLS
ALTER TABLE id_card_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Workspace members can view templates"
  ON id_card_templates FOR SELECT
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can insert templates"
  ON id_card_templates FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can update templates"
  ON id_card_templates FOR UPDATE
  USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace members can delete templates"
  ON id_card_templates FOR DELETE
  USING (public.has_workspace_access(workspace_id));

-- Add updated_at trigger
CREATE TRIGGER update_id_card_templates_updated_at
  BEFORE UPDATE ON id_card_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();