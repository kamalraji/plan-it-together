-- 1) Workspace tasks table
CREATE TABLE IF NOT EXISTS public.workspace_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'TODO',
  priority text NOT NULL DEFAULT 'MEDIUM',
  due_date timestamptz,
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers manage workspace tasks"
ON public.workspace_tasks
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'organizer'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'organizer'::app_role)
);

-- 2) Workspace team members table
CREATE TABLE IF NOT EXISTS public.workspace_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'ACTIVE',
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz
);

ALTER TABLE public.workspace_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers manage workspace team"
ON public.workspace_team_members
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'organizer'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'organizer'::app_role)
);

CREATE POLICY "Members read workspace team"
ON public.workspace_team_members
FOR SELECT
USING (
  user_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'organizer'::app_role)
);

-- 3) updated_at trigger for tasks
CREATE OR REPLACE FUNCTION public.set_workspace_tasks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_workspace_tasks_updated_at
BEFORE UPDATE ON public.workspace_tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_workspace_tasks_updated_at();