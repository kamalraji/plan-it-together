-- =====================================================
-- Certificate Delegation System - Flexible Permissions
-- =====================================================

-- 1. Create certificate_delegation table for granular permissions
CREATE TABLE public.certificate_delegation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  delegated_workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Granular permission flags
  can_design_templates BOOLEAN DEFAULT false,
  can_define_criteria BOOLEAN DEFAULT false,
  can_generate BOOLEAN DEFAULT false,
  can_distribute BOOLEAN DEFAULT false,
  
  -- Metadata
  delegated_at TIMESTAMPTZ DEFAULT now(),
  delegated_by UUID,
  notes TEXT,
  
  UNIQUE(root_workspace_id, delegated_workspace_id)
);

-- Indexes
CREATE INDEX idx_certificate_delegation_root ON certificate_delegation(root_workspace_id);
CREATE INDEX idx_certificate_delegation_delegated ON certificate_delegation(delegated_workspace_id);

-- RLS Policies
ALTER TABLE certificate_delegation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Root owners can manage delegation"
  ON certificate_delegation FOR ALL
  USING (public.is_workspace_owner(root_workspace_id))
  WITH CHECK (public.is_workspace_owner(root_workspace_id));

CREATE POLICY "Delegated workspace members can view their delegation"
  ON certificate_delegation FOR SELECT
  USING (public.has_workspace_access(delegated_workspace_id));

-- 2. Create certificate_templates table
CREATE TABLE public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('COMPLETION', 'MERIT', 'APPRECIATION')),
  
  -- Design Elements
  background_url TEXT,
  logo_url TEXT,
  signature_url TEXT,
  
  -- Branding Configuration (primaryColor, secondaryColor, fontFamily, borderStyle, layout)
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Content Configuration (title, subtitle, bodyText, footerText, signatureName, signatureTitle)
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Indexes
CREATE INDEX idx_certificate_templates_workspace ON certificate_templates(workspace_id);
CREATE INDEX idx_certificate_templates_event ON certificate_templates(event_id);

-- Add template_id to certificates table
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES certificate_templates(id);

-- 3. Create security function for granular certificate permissions
CREATE OR REPLACE FUNCTION public.has_certificate_permission(
  _workspace_id UUID,
  _permission TEXT,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is workspace owner or manager (always allowed for their workspace)
  IF public.has_workspace_management_access(_workspace_id, _user_id) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user's workspace has been delegated this permission from a ROOT workspace
  RETURN EXISTS (
    SELECT 1 
    FROM certificate_delegation cd
    JOIN workspace_team_members wtm ON wtm.workspace_id = cd.delegated_workspace_id
    WHERE wtm.user_id = _user_id
      AND wtm.status = 'ACTIVE'
      AND cd.delegated_workspace_id = _workspace_id
      AND CASE _permission
        WHEN 'design' THEN cd.can_design_templates
        WHEN 'criteria' THEN cd.can_define_criteria
        WHEN 'generate' THEN cd.can_generate
        WHEN 'distribute' THEN cd.can_distribute
        ELSE FALSE
      END
  );
END;
$$;

-- 4. RLS Policies for certificate_templates
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Certificate template management"
  ON certificate_templates FOR ALL
  USING (
    public.has_workspace_management_access(workspace_id) OR
    public.has_certificate_permission(workspace_id, 'design')
  )
  WITH CHECK (
    public.has_workspace_management_access(workspace_id) OR
    public.has_certificate_permission(workspace_id, 'design')
  );

CREATE POLICY "Workspace members can view templates"
  ON certificate_templates FOR SELECT
  USING (public.has_workspace_access(workspace_id));

-- 5. Trigger for updated_at on certificate_templates
CREATE TRIGGER set_certificate_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Create storage bucket for certificate assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificate-assets', 'certificate-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for certificate assets
CREATE POLICY "Authenticated users can upload certificate assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificate-assets' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Public can view certificate assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificate-assets');

CREATE POLICY "Authenticated users can update certificate assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'certificate-assets' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete certificate assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'certificate-assets' AND
    auth.role() = 'authenticated'
  );