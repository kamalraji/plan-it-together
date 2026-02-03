-- =============================================
-- Content Committee Database Schema
-- =============================================

-- 1. Enhance workspace_content_items with missing columns
ALTER TABLE workspace_content_items 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reviewer_id uuid,
ADD COLUMN IF NOT EXISTS reviewer_name text,
ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS published_at timestamptz,
ADD COLUMN IF NOT EXISTS scheduled_publish_date timestamptz,
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS word_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_word_count integer DEFAULT 1000;

-- 2. Create workspace_content_reviews table for review workflow
CREATE TABLE IF NOT EXISTS workspace_content_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  content_item_id uuid REFERENCES workspace_content_items(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid,
  reviewer_name text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'revision_requested')),
  feedback text,
  score integer CHECK (score >= 1 AND score <= 5),
  assigned_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Create workspace_content_templates table for reusable templates
CREATE TABLE IF NOT EXISTS workspace_content_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  category text DEFAULT 'general',
  content_type text DEFAULT 'article' CHECK (content_type IN ('article', 'social_post', 'email', 'press_release', 'blog', 'announcement')),
  template_structure jsonb DEFAULT '{}',
  sample_content text,
  thumbnail_url text,
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_by uuid,
  created_by_name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 4. Create workspace_scheduled_content table for calendar/scheduling
CREATE TABLE IF NOT EXISTS workspace_scheduled_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  content_item_id uuid REFERENCES workspace_content_items(id) ON DELETE SET NULL,
  title text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('twitter', 'instagram', 'linkedin', 'facebook', 'blog', 'email', 'website')),
  scheduled_date date NOT NULL,
  scheduled_time time,
  status text DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'published', 'cancelled')),
  content_preview text,
  media_urls text[] DEFAULT '{}',
  assigned_to uuid,
  assigned_name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 5. Enable RLS on all new tables
ALTER TABLE workspace_content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_scheduled_content ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for workspace_content_reviews
CREATE POLICY "Users can view content reviews in their workspaces"
ON workspace_content_reviews FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can create content reviews in their workspaces"
ON workspace_content_reviews FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can update content reviews in their workspaces"
ON workspace_content_reviews FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can delete content reviews in their workspaces"
ON workspace_content_reviews FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- 7. RLS Policies for workspace_content_templates
CREATE POLICY "Users can view content templates in their workspaces"
ON workspace_content_templates FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can create content templates in their workspaces"
ON workspace_content_templates FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can update content templates in their workspaces"
ON workspace_content_templates FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can delete content templates in their workspaces"
ON workspace_content_templates FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- 8. RLS Policies for workspace_scheduled_content
CREATE POLICY "Users can view scheduled content in their workspaces"
ON workspace_scheduled_content FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can create scheduled content in their workspaces"
ON workspace_scheduled_content FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can update scheduled content in their workspaces"
ON workspace_scheduled_content FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can delete scheduled content in their workspaces"
ON workspace_scheduled_content FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- 9. Create updated_at triggers
CREATE TRIGGER update_workspace_content_reviews_updated_at
BEFORE UPDATE ON workspace_content_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_content_templates_updated_at
BEFORE UPDATE ON workspace_content_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_scheduled_content_updated_at
BEFORE UPDATE ON workspace_scheduled_content
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_reviews_workspace ON workspace_content_reviews(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_reviews_content_item ON workspace_content_reviews(content_item_id);
CREATE INDEX IF NOT EXISTS idx_content_reviews_status ON workspace_content_reviews(status);
CREATE INDEX IF NOT EXISTS idx_content_templates_workspace ON workspace_content_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_templates_type ON workspace_content_templates(content_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_workspace ON workspace_scheduled_content(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_date ON workspace_scheduled_content(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_platform ON workspace_scheduled_content(platform);