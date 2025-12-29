-- Create workspaces table for organizing event-specific collaboration spaces
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  organizer_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Organizers and admins can manage all workspaces
CREATE POLICY "Organizers manage workspaces"
ON public.workspaces
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'organizer'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'organizer'::app_role)
);

-- Optional: workspace owner (organizer_id) can read their own workspace even if role changes
CREATE POLICY "Workspace owner can read own workspace"
ON public.workspaces
FOR SELECT
USING (organizer_id = auth.uid());

-- Keep updated_at in sync on updates
CREATE OR REPLACE FUNCTION public.set_workspaces_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.set_workspaces_updated_at();