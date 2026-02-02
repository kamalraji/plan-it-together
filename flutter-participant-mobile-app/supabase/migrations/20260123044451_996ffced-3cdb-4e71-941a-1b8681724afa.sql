
-- Fix overly permissive RLS policy on vibe_games
-- Replace WITH CHECK (true) with proper authorization

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can create games" ON public.vibe_games;

-- Create a proper policy that checks if user can manage the event
-- Users can create games only for events they own or are workspace managers for
CREATE POLICY "Users can create games for their events"
ON public.vibe_games
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user owns the event
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.owner_id = auth.uid()
  )
  OR
  -- Allow if user is a workspace manager for the event
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.workspaces w ON w.event_id = e.id
    JOIN public.workspace_team_members wtm ON wtm.workspace_id = w.id
    WHERE e.id = event_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD', 'OPERATIONS_MANAGER', 'CONTENT_MANAGER')
  )
  OR
  -- Allow games without event_id (standalone games) - user becomes implicit owner
  event_id IS NULL
);

-- Add UPDATE policy (missing - games should be updatable by creators)
CREATE POLICY "Users can update games for their events"
ON public.vibe_games
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.workspaces w ON w.event_id = e.id
    JOIN public.workspace_team_members wtm ON wtm.workspace_id = w.id
    WHERE e.id = event_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD', 'OPERATIONS_MANAGER', 'CONTENT_MANAGER')
  )
  OR
  event_id IS NULL
);

-- Add DELETE policy (missing - games should be deletable by creators)
CREATE POLICY "Users can delete games for their events"
ON public.vibe_games
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id AND e.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.workspaces w ON w.event_id = e.id
    JOIN public.workspace_team_members wtm ON wtm.workspace_id = w.id
    WHERE e.id = event_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
      AND wtm.role IN ('OWNER', 'MANAGER', 'LEAD', 'OPERATIONS_MANAGER', 'CONTENT_MANAGER')
  )
  OR
  event_id IS NULL
);
