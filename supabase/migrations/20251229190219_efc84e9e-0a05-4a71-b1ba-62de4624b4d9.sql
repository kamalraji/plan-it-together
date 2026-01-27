-- 1) Add parent_workspace_id for hierarchical workspaces
ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS parent_workspace_id uuid NULL REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- 2) Table to store per-user, per-role workspace view preferences
CREATE TABLE IF NOT EXISTS public.workspace_role_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role_scope text NOT NULL,
  last_active_tab text NOT NULL DEFAULT 'overview',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id, role_scope)
);

-- Enable RLS on workspace_role_views
ALTER TABLE public.workspace_role_views ENABLE ROW LEVEL SECURITY;

-- Policy: users manage their own role views
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspace_role_views'
      AND policyname = 'Users manage their own workspace role views'
  ) THEN
    CREATE POLICY "Users manage their own workspace role views"
    ON public.workspace_role_views
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 3) Generic updated_at trigger function for workspace_role_views
CREATE OR REPLACE FUNCTION public.set_workspace_role_views_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_workspace_role_views_updated_at ON public.workspace_role_views;
CREATE TRIGGER set_workspace_role_views_updated_at
BEFORE UPDATE ON public.workspace_role_views
FOR EACH ROW
EXECUTE FUNCTION public.set_workspace_role_views_updated_at();