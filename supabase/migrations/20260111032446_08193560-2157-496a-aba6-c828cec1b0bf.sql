-- Add missing columns to existing workspace_media_assets table
ALTER TABLE workspace_media_assets 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS event_segment TEXT,
ADD COLUMN IF NOT EXISTS is_exported BOOLEAN DEFAULT false;

-- Create workspace_shot_lists table
CREATE TABLE IF NOT EXISTS public.workspace_shot_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_segment TEXT,
  location TEXT,
  scheduled_time TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  shot_type TEXT DEFAULT 'photo' CHECK (shot_type IN ('photo', 'video', 'both')),
  camera_settings TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'captured', 'reviewed', 'published')),
  assigned_to UUID REFERENCES user_profiles(id),
  assignee_name TEXT,
  captured_asset_id UUID REFERENCES workspace_media_assets(id),
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create workspace_gallery_reviews table
CREATE TABLE IF NOT EXISTS public.workspace_gallery_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES workspace_media_assets(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES user_profiles(id),
  reviewer_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  usage_rights TEXT DEFAULT 'internal' CHECK (usage_rights IN ('internal', 'social', 'press', 'all')),
  is_featured BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(asset_id, reviewer_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_media_assets_category ON workspace_media_assets(category);
CREATE INDEX IF NOT EXISTS idx_media_assets_event_segment ON workspace_media_assets(event_segment);
CREATE INDEX IF NOT EXISTS idx_shot_lists_workspace ON workspace_shot_lists(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shot_lists_status ON workspace_shot_lists(status);
CREATE INDEX IF NOT EXISTS idx_shot_lists_assigned ON workspace_shot_lists(assigned_to);
CREATE INDEX IF NOT EXISTS idx_gallery_reviews_workspace ON workspace_gallery_reviews(workspace_id);
CREATE INDEX IF NOT EXISTS idx_gallery_reviews_status ON workspace_gallery_reviews(status);
CREATE INDEX IF NOT EXISTS idx_gallery_reviews_asset ON workspace_gallery_reviews(asset_id);

-- Enable RLS on new tables
ALTER TABLE workspace_shot_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_gallery_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_shot_lists
CREATE POLICY "Users can view shot lists in their workspaces"
ON workspace_shot_lists FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can insert shot lists in their workspaces"
ON workspace_shot_lists FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can update shot lists in their workspaces"
ON workspace_shot_lists FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can delete shot lists in their workspaces"
ON workspace_shot_lists FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- RLS Policies for workspace_gallery_reviews
CREATE POLICY "Users can view gallery reviews in their workspaces"
ON workspace_gallery_reviews FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can insert gallery reviews in their workspaces"
ON workspace_gallery_reviews FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can update gallery reviews in their workspaces"
ON workspace_gallery_reviews FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can delete gallery reviews in their workspaces"
ON workspace_gallery_reviews FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- Triggers for updated_at
CREATE TRIGGER update_workspace_shot_lists_updated_at
  BEFORE UPDATE ON workspace_shot_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_gallery_reviews_updated_at
  BEFORE UPDATE ON workspace_gallery_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for media assets (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-assets', 'media-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (using IF NOT EXISTS pattern via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload media assets' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can upload media assets"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'media-assets');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view media assets' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Anyone can view media assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'media-assets');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update media assets' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can update media assets"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'media-assets');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete media assets' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can delete media assets"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'media-assets');
  END IF;
END $$;