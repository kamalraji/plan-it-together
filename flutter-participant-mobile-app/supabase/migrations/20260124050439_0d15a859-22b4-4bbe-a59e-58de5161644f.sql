-- Fix chat_group_members RLS policies that cause infinite recursion

-- Drop broken policies
DROP POLICY IF EXISTS "Owners and admins can add members" ON chat_group_members;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON chat_group_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON chat_group_members;

-- Create corrected INSERT policy
CREATE POLICY "Owners and admins can add members" ON chat_group_members
FOR INSERT TO authenticated
WITH CHECK (
  -- Allow user to add themselves as owner (group creation)
  ((user_id = auth.uid()) AND (role = 'owner'))
  OR
  -- Allow existing owners/admins to add other members
  (EXISTS (
    SELECT 1 FROM chat_group_members existing
    WHERE existing.group_id = chat_group_members.group_id
      AND existing.user_id = auth.uid()
      AND existing.role IN ('owner', 'admin')
  ))
);

-- Create corrected DELETE policy
CREATE POLICY "Owners and admins can remove members" ON chat_group_members
FOR DELETE TO authenticated
USING (
  -- Users can remove themselves
  (user_id = auth.uid())
  OR
  -- Owners/admins can remove others
  (EXISTS (
    SELECT 1 FROM chat_group_members existing
    WHERE existing.group_id = chat_group_members.group_id
      AND existing.user_id = auth.uid()
      AND existing.role IN ('owner', 'admin')
  ))
);

-- Create corrected UPDATE policy
CREATE POLICY "Owners and admins can update members" ON chat_group_members
FOR UPDATE TO authenticated
USING (
  (user_id = auth.uid())
  OR
  (EXISTS (
    SELECT 1 FROM chat_group_members existing
    WHERE existing.group_id = chat_group_members.group_id
      AND existing.user_id = auth.uid()
      AND existing.role IN ('owner', 'admin')
  ))
)
WITH CHECK (
  (user_id = auth.uid())
  OR
  (EXISTS (
    SELECT 1 FROM chat_group_members existing
    WHERE existing.group_id = chat_group_members.group_id
      AND existing.user_id = auth.uid()
      AND existing.role IN ('owner', 'admin')
  ))
);