-- Workspace activities for Event Community Workspace timeline

-- 1) Enum for activity type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_activity_type') THEN
    CREATE TYPE public.workspace_activity_type AS ENUM ('task', 'communication', 'team', 'template');
  END IF;
END $$;

-- 2) Activity table (no FK to auth.users to avoid coupling per guidelines)
CREATE TABLE IF NOT EXISTS public.workspace_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  type workspace_activity_type NOT NULL,
  title text NOT NULL,
  description text,
  actor_id uuid,
  actor_name text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_activities ENABLE ROW LEVEL SECURITY;

-- 3) RLS policies: organizers/admins write, staff/volunteers can read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'workspace_activities' AND policyname = 'Workspace activity readers'
  ) THEN
    CREATE POLICY "Workspace activity readers"
    ON public.workspace_activities
    FOR SELECT
    TO authenticated
    USING (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'organizer'::app_role)
      OR has_role(auth.uid(), 'volunteer'::app_role)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'workspace_activities' AND policyname = 'Workspace activity writers'
  ) THEN
    CREATE POLICY "Workspace activity writers"
    ON public.workspace_activities
    FOR INSERT
    TO authenticated
    WITH CHECK (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'organizer'::app_role)
    );
  END IF;
END $$;