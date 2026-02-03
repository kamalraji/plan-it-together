-- Document Collaboration Tables

-- Workspace Documents (Notion-style pages)
CREATE TABLE workspace_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_document_id UUID REFERENCES workspace_documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB DEFAULT '{}',
  cover_image_url TEXT,
  icon TEXT,
  is_published BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Collaborators (who can view/edit)
CREATE TABLE document_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES workspace_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Versions (for history)
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES workspace_documents(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  version_number INTEGER NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Comments
CREATE TABLE document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES workspace_documents(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES document_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  selection_range JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE workspace_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

-- Document policies
CREATE POLICY "Users can view documents in their workspaces" ON workspace_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_documents.workspace_id
      AND wtm.user_id = auth.uid()
    )
    OR is_published = true
  );

CREATE POLICY "Users can create documents in their workspaces" ON workspace_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_team_members wtm
      WHERE wtm.workspace_id = workspace_documents.workspace_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Document creators and admins can update" ON workspace_documents
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM document_collaborators dc
      WHERE dc.document_id = workspace_documents.id
      AND dc.user_id = auth.uid()
      AND dc.permission IN ('edit', 'admin')
    )
  );

CREATE POLICY "Document creators can delete" ON workspace_documents
  FOR DELETE USING (created_by = auth.uid());

-- Collaborator policies
CREATE POLICY "Users can view collaborators" ON document_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_documents wd
      JOIN workspace_team_members wtm ON wtm.workspace_id = wd.workspace_id
      WHERE wd.id = document_collaborators.document_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Document admins can manage collaborators" ON document_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_documents wd
      WHERE wd.id = document_collaborators.document_id
      AND wd.created_by = auth.uid()
    )
  );

-- Version policies
CREATE POLICY "Users can view document versions" ON document_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_documents wd
      JOIN workspace_team_members wtm ON wtm.workspace_id = wd.workspace_id
      WHERE wd.id = document_versions.document_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions" ON document_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_documents wd
      JOIN workspace_team_members wtm ON wtm.workspace_id = wd.workspace_id
      WHERE wd.id = document_versions.document_id
      AND wtm.user_id = auth.uid()
    )
  );

-- Comment policies
CREATE POLICY "Users can view document comments" ON document_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_documents wd
      JOIN workspace_team_members wtm ON wtm.workspace_id = wd.workspace_id
      WHERE wd.id = document_comments.document_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments" ON document_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_documents wd
      JOIN workspace_team_members wtm ON wtm.workspace_id = wd.workspace_id
      WHERE wd.id = document_comments.document_id
      AND wtm.user_id = auth.uid()
    )
  );

CREATE POLICY "Comment creators can update/delete" ON document_comments
  FOR ALL USING (created_by = auth.uid());

-- Indexes for performance
CREATE INDEX idx_workspace_documents_workspace ON workspace_documents(workspace_id);
CREATE INDEX idx_workspace_documents_parent ON workspace_documents(parent_document_id);
CREATE INDEX idx_document_collaborators_document ON document_collaborators(document_id);
CREATE INDEX idx_document_collaborators_user ON document_collaborators(user_id);
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_comments_document ON document_comments(document_id);

-- Trigger for updated_at
CREATE TRIGGER update_workspace_documents_updated_at
  BEFORE UPDATE ON workspace_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();