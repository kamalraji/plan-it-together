-- Create workspace_content_items table for content pipeline
CREATE TABLE public.workspace_content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'document',
  status TEXT NOT NULL DEFAULT 'draft',
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT NOT NULL DEFAULT 'medium',
  description TEXT,
  content_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace_speakers table for speaker management
CREATE TABLE public.workspace_speakers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT,
  bio TEXT,
  email TEXT,
  phone TEXT,
  session_title TEXT,
  session_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  travel_arranged BOOLEAN DEFAULT false,
  accommodation_arranged BOOLEAN DEFAULT false,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace_media_assets table for media management
CREATE TABLE public.workspace_media_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'photo',
  file_url TEXT,
  thumbnail_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploader_name TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.workspace_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_media_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_content_items
CREATE POLICY "Users can view content items for their workspaces"
ON public.workspace_content_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_content_items.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
  )
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_content_items.workspace_id
    AND w.organizer_id = auth.uid()
  )
);

CREATE POLICY "Team members can manage content items"
ON public.workspace_content_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_content_items.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
  )
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_content_items.workspace_id
    AND w.organizer_id = auth.uid()
  )
);

-- RLS Policies for workspace_speakers
CREATE POLICY "Users can view speakers for their workspaces"
ON public.workspace_speakers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_speakers.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
  )
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_speakers.workspace_id
    AND w.organizer_id = auth.uid()
  )
);

CREATE POLICY "Team members can manage speakers"
ON public.workspace_speakers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_speakers.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
  )
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_speakers.workspace_id
    AND w.organizer_id = auth.uid()
  )
);

-- RLS Policies for workspace_media_assets
CREATE POLICY "Users can view media assets for their workspaces"
ON public.workspace_media_assets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_media_assets.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
  )
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_media_assets.workspace_id
    AND w.organizer_id = auth.uid()
  )
);

CREATE POLICY "Team members can manage media assets"
ON public.workspace_media_assets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspace_team_members wtm
    WHERE wtm.workspace_id = workspace_media_assets.workspace_id
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'ACTIVE'
  )
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_media_assets.workspace_id
    AND w.organizer_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_workspace_content_items_workspace ON public.workspace_content_items(workspace_id);
CREATE INDEX idx_workspace_content_items_status ON public.workspace_content_items(status);
CREATE INDEX idx_workspace_speakers_workspace ON public.workspace_speakers(workspace_id);
CREATE INDEX idx_workspace_speakers_status ON public.workspace_speakers(status);
CREATE INDEX idx_workspace_media_assets_workspace ON public.workspace_media_assets(workspace_id);
CREATE INDEX idx_workspace_media_assets_type ON public.workspace_media_assets(type);

-- Create triggers for updated_at
CREATE TRIGGER update_workspace_content_items_updated_at
BEFORE UPDATE ON public.workspace_content_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_speakers_updated_at
BEFORE UPDATE ON public.workspace_speakers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_media_assets_updated_at
BEFORE UPDATE ON public.workspace_media_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();