-- 1) Add owner_id to events for per-event ownership
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS owner_id uuid;

-- 2) Backfill owner_id for existing org-owned events using the organization owner
UPDATE public.events e
SET owner_id = o.owner_id
FROM public.organizations o
WHERE e.organization_id = o.id
  AND e.owner_id IS NULL;

-- 3) Create RLS policy to let event owners fully manage their own events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'events'
      AND policyname = 'Event owners manage own events'
  ) THEN
    CREATE POLICY "Event owners manage own events"
    ON public.events
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());
  END IF;
END$$;

-- 4) Create RLS policy to let workspace owners fully manage their own workspaces
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspaces'
      AND policyname = 'Workspace owners manage own workspaces'
  ) THEN
    CREATE POLICY "Workspace owners manage own workspaces"
    ON public.workspaces
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (organizer_id = auth.uid())
    WITH CHECK (organizer_id = auth.uid());
  END IF;
END$$;