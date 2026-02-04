-- Create unique index for event slug within organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_org_slug 
ON public.events (organization_id, slug) 
WHERE slug IS NOT NULL;

-- Create trigger to auto-generate event slug on insert/update
CREATE OR REPLACE FUNCTION public.events_auto_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL AND NEW.name IS NOT NULL THEN
    base_slug := public.generate_slug(NEW.name);
    final_slug := base_slug;
    
    WHILE EXISTS (
      SELECT 1 FROM public.events 
      WHERE organization_id = NEW.organization_id 
      AND slug = final_slug 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS events_auto_slug_trigger ON public.events;
CREATE TRIGGER events_auto_slug_trigger
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.events_auto_slug();

-- Add slug column to workspaces table
ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill existing workspaces with unique slugs
WITH numbered AS (
  SELECT id, name, event_id, parent_workspace_id,
    ROW_NUMBER() OVER (
      PARTITION BY event_id, COALESCE(parent_workspace_id, '00000000-0000-0000-0000-000000000000'::uuid), public.generate_slug(name) 
      ORDER BY created_at
    ) AS rn
  FROM public.workspaces
)
UPDATE public.workspaces w
SET slug = CASE 
  WHEN n.rn = 1 THEN public.generate_slug(n.name)
  ELSE public.generate_slug(n.name) || '-' || n.rn
END
FROM numbered n
WHERE w.id = n.id AND w.slug IS NULL;

-- Create unique index for workspace slug within event and parent
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_event_parent_slug 
ON public.workspaces (event_id, COALESCE(parent_workspace_id, '00000000-0000-0000-0000-000000000000'::uuid), slug)
WHERE slug IS NOT NULL;

-- Create trigger to auto-generate workspace slug
CREATE OR REPLACE FUNCTION public.workspaces_auto_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  parent_id UUID;
BEGIN
  IF NEW.slug IS NULL AND NEW.name IS NOT NULL THEN
    base_slug := public.generate_slug(NEW.name);
    final_slug := base_slug;
    parent_id := COALESCE(NEW.parent_workspace_id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    WHILE EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE event_id = NEW.event_id 
      AND COALESCE(parent_workspace_id, '00000000-0000-0000-0000-000000000000'::uuid) = parent_id
      AND slug = final_slug 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS workspaces_auto_slug_trigger ON public.workspaces;
CREATE TRIGGER workspaces_auto_slug_trigger
  BEFORE INSERT OR UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.workspaces_auto_slug();