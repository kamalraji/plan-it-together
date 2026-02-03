-- Fix overly permissive RLS policy on workspace_voice_sessions
-- The "System can update voice sessions" policy allows anyone to update any voice session
-- This should be restricted to workspace members who are in the session

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can update voice sessions" ON public.workspace_voice_sessions;

-- Create a proper policy that allows workspace members to update sessions
-- Users must be a member of the workspace that owns the voice channel
CREATE POLICY "Workspace members can update voice sessions"
ON public.workspace_voice_sessions
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM workspace_voice_channels wvc
    JOIN workspace_team_members wtm ON wtm.workspace_id = wvc.workspace_id
    WHERE wvc.id = workspace_voice_sessions.voice_channel_id
    AND wtm.user_id = (SELECT auth.uid())
    AND wtm.status = 'ACTIVE'
  )
);

-- Add a DELETE policy so workspace admins can delete sessions if needed
CREATE POLICY "Workspace managers can delete voice sessions"
ON public.workspace_voice_sessions
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM workspace_voice_channels wvc
    JOIN workspace_team_members wtm ON wtm.workspace_id = wvc.workspace_id
    WHERE wvc.id = workspace_voice_sessions.voice_channel_id
    AND wtm.user_id = (SELECT auth.uid())
    AND wtm.role IN ('MANAGER', 'LEAD', 'OWNER', 'ADMIN')
    AND wtm.status = 'ACTIVE'
  )
);