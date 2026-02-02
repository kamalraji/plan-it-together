-- Add remaining RLS policies that may not exist yet (using DROP IF EXISTS pattern)

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Admins can create invite links" ON public.group_invite_links;
DROP POLICY IF EXISTS "Admins can update invite links" ON public.group_invite_links;
DROP POLICY IF EXISTS "Admins can delete invite links" ON public.group_invite_links;

-- Recreate policies
CREATE POLICY "Admins can create invite links"
ON public.group_invite_links FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_group_members cgm
    WHERE cgm.group_id = group_invite_links.group_id
    AND cgm.user_id = auth.uid()
    AND cgm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can update invite links"
ON public.group_invite_links FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_group_members cgm
    WHERE cgm.group_id = group_invite_links.group_id
    AND cgm.user_id = auth.uid()
    AND cgm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can delete invite links"
ON public.group_invite_links FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_group_members cgm
    WHERE cgm.group_id = group_invite_links.group_id
    AND cgm.user_id = auth.uid()
    AND cgm.role IN ('owner', 'admin')
  )
);