-- Eliminate mutual-recursion / policy-loop between chat_groups and chat_group_members
-- by using a SECURITY DEFINER helper for membership checks.

-- 1) Helper: membership check (bypasses RLS safely; returns boolean only)
CREATE OR REPLACE FUNCTION public.is_chat_group_member(_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_group_members m
    WHERE m.group_id = _group_id
      AND m.user_id = auth.uid()
  );
$$;

-- 2) chat_group_members SELECT policy: members can read membership rows of groups they belong to
DROP POLICY IF EXISTS "Members can view group members" ON public.chat_group_members;
CREATE POLICY "Members can view group members"
ON public.chat_group_members
FOR SELECT
TO authenticated
USING (public.is_chat_group_member(group_id));

-- 3) chat_groups SELECT policy: creators, public groups, or members can view
DROP POLICY IF EXISTS "Members and creators can view groups" ON public.chat_groups;
CREATE POLICY "Members and creators can view groups"
ON public.chat_groups
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR is_public = true
  OR public.is_chat_group_member(id)
);
