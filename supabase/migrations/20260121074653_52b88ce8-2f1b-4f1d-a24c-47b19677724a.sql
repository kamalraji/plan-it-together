-- Create event_drafts table for auto-save functionality
CREATE TABLE public.event_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique index that handles NULL event_id properly
CREATE UNIQUE INDEX event_drafts_user_org_event_idx 
ON public.event_drafts (user_id, organization_id, COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Enable RLS
ALTER TABLE public.event_drafts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own drafts
CREATE POLICY "Users can view their own event drafts"
ON public.event_drafts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own event drafts"
ON public.event_drafts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event drafts"
ON public.event_drafts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event drafts"
ON public.event_drafts FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_event_drafts_updated_at
BEFORE UPDATE ON public.event_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check event slug availability
CREATE OR REPLACE FUNCTION public.check_event_slug_availability(
  _slug TEXT,
  _organization_id UUID,
  _event_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  slug_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.events 
    WHERE lower(branding->>'customSlug') = lower(_slug)
    AND organization_id = _organization_id
    AND (_event_id IS NULL OR id != _event_id)
  ) INTO slug_exists;
  
  RETURN json_build_object(
    'available', NOT slug_exists,
    'message', CASE WHEN slug_exists THEN 'This slug is already in use' ELSE 'Slug is available' END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;