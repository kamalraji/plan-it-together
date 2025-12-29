-- 1) Ensure events automatically record the creating user as owner
CREATE OR REPLACE FUNCTION public.set_event_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to create event';
  END IF;

  -- If owner_id not explicitly provided, default to current user
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_event_owner_before_insert ON public.events;
CREATE TRIGGER set_event_owner_before_insert
BEFORE INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.set_event_owner();


-- 2) Ensure workspaces automatically record the creating user as organizer (owner)
CREATE OR REPLACE FUNCTION public.set_workspace_organizer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to create workspace';
  END IF;

  -- If organizer_id not explicitly provided, default to current user
  IF NEW.organizer_id IS NULL THEN
    NEW.organizer_id := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_workspace_organizer_before_insert ON public.workspaces;
CREATE TRIGGER set_workspace_organizer_before_insert
BEFORE INSERT ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.set_workspace_organizer();


-- 3) Refine workspace RLS so only owners and admins can manage all workspaces
-- Remove the broad organizers policy and replace it with an admins-only policy
DROP POLICY IF EXISTS "Organizers manage workspaces" ON public.workspaces;

CREATE POLICY "Admins manage all workspaces"
ON public.workspaces
AS PERMISSIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Keep existing owner-based policies ("Workspace owner can read own workspace" and
-- "Workspace owners manage own workspaces") intact, so creators always retain control.