-- Fix the broken RLS policy for chat_groups SELECT
-- The policy incorrectly references cgm.id instead of chat_groups.id

DROP POLICY IF EXISTS "Members and creators can view groups" ON public.chat_groups;

CREATE POLICY "Members and creators can view groups"
ON public.chat_groups
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR is_public = true
  OR EXISTS (
    SELECT 1 FROM chat_group_members cgm
    WHERE cgm.group_id = chat_groups.id
    AND cgm.user_id = auth.uid()
  )
);