-- Create workspace_venue_walkthroughs table for scheduled venue inspection tours
CREATE TABLE public.workspace_venue_walkthroughs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scheduled_date DATE,
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'scheduled',
  route_areas TEXT[],
  lead_name TEXT,
  lead_id UUID,
  attendees TEXT[],
  notes TEXT,
  findings JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_venue_walkthroughs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view walkthroughs in their workspaces"
ON public.workspace_venue_walkthroughs
FOR SELECT
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can create walkthroughs in their workspaces"
ON public.workspace_venue_walkthroughs
FOR INSERT
WITH CHECK (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can update walkthroughs in their workspaces"
ON public.workspace_venue_walkthroughs
FOR UPDATE
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Users can delete walkthroughs in their workspaces"
ON public.workspace_venue_walkthroughs
FOR DELETE
USING (public.has_workspace_access(workspace_id));

-- Create indexes
CREATE INDEX idx_venue_walkthroughs_workspace ON public.workspace_venue_walkthroughs(workspace_id);
CREATE INDEX idx_venue_walkthroughs_status ON public.workspace_venue_walkthroughs(status);
CREATE INDEX idx_venue_walkthroughs_scheduled ON public.workspace_venue_walkthroughs(scheduled_date);

-- Create updated_at trigger
CREATE TRIGGER set_workspace_venue_walkthroughs_updated_at
  BEFORE UPDATE ON public.workspace_venue_walkthroughs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();