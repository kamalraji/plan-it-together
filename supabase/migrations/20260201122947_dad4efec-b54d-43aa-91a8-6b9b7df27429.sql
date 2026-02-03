-- Create workspace_templates table for storing reusable workspace structures
CREATE TABLE public.workspace_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  industry_type TEXT,
  event_type TEXT,
  complexity TEXT CHECK (complexity IN ('SIMPLE', 'MODERATE', 'COMPLEX')),
  event_size_min INT DEFAULT 0,
  event_size_max INT DEFAULT 10000,
  effectiveness DECIMAL(3,2) DEFAULT 0.85,
  usage_count INT DEFAULT 0,
  structure JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_templates ENABLE ROW LEVEL SECURITY;

-- Public templates are viewable by everyone
CREATE POLICY "Public templates are viewable by everyone"
ON public.workspace_templates
FOR SELECT
USING (is_public = true);

-- Authenticated users can view all templates
CREATE POLICY "Authenticated users can view all templates"
ON public.workspace_templates
FOR SELECT
TO authenticated
USING (true);

-- Only template creator can update their templates
CREATE POLICY "Users can update own templates"
ON public.workspace_templates
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Authenticated users can create templates
CREATE POLICY "Authenticated users can create templates"
ON public.workspace_templates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Create index for faster lookups
CREATE INDEX idx_workspace_templates_industry ON public.workspace_templates(industry_type);
CREATE INDEX idx_workspace_templates_event_type ON public.workspace_templates(event_type);
CREATE INDEX idx_workspace_templates_public ON public.workspace_templates(is_public);

-- Create trigger for updated_at
CREATE TRIGGER update_workspace_templates_updated_at
BEFORE UPDATE ON public.workspace_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();