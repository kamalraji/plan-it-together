-- =============================================
-- Fix RLS Policies: Add Workspace Team Members Access
-- =============================================

-- Drop existing management policies for event_sessions
DROP POLICY IF EXISTS "Event owners can manage sessions" ON public.event_sessions;

-- Recreate with workspace team member access
CREATE POLICY "Event owners and workspace team can manage sessions"
  ON public.event_sessions FOR ALL
  USING (
    -- Event owner
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_sessions.event_id
      AND e.owner_id = auth.uid()
    )
    OR
    -- Workspace team member linked to event
    EXISTS (
      SELECT 1 FROM public.workspaces w
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = w.id
      WHERE w.event_id = event_sessions.event_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
  );

-- Drop existing management policies for event_announcements
DROP POLICY IF EXISTS "Event owners can manage announcements" ON public.event_announcements;

-- Recreate with workspace team member access
CREATE POLICY "Event owners and workspace team can manage announcements"
  ON public.event_announcements FOR ALL
  USING (
    -- Event owner
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_announcements.event_id
      AND e.owner_id = auth.uid()
    )
    OR
    -- Workspace team member linked to event
    EXISTS (
      SELECT 1 FROM public.workspaces w
      JOIN public.workspace_team_members wtm ON wtm.workspace_id = w.id
      WHERE w.event_id = event_announcements.event_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
  );