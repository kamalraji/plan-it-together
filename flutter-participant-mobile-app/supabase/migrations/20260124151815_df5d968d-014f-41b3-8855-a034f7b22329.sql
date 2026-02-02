-- Fix the circular RLS policy on chat_group_members that prevents groups from loading
-- The existing policy has a recursive self-reference that causes empty results

-- Drop all existing SELECT policies on chat_group_members to start fresh
DROP POLICY IF EXISTS "Members can view group members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.chat_group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.chat_group_members;

-- Create a simple, non-recursive policy
-- Users can see membership rows if:
-- 1. It's their own row (no sub-query needed), OR
-- 2. The group is public or they created it (sub-query on different table)
CREATE POLICY "Members can view group members"
ON public.chat_group_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.chat_groups cg
    WHERE cg.id = chat_group_members.group_id
    AND (cg.is_public = true OR cg.created_by = auth.uid())
  )
);