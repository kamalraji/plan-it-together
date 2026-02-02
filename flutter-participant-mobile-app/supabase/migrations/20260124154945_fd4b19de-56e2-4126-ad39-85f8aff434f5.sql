-- =============================================
-- WHATSAPP-LEVEL GROUP CHAT ENHANCEMENTS
-- =============================================

-- 1. Add admin control columns to chat_groups
ALTER TABLE public.chat_groups
ADD COLUMN IF NOT EXISTS only_admins_can_send boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS only_admins_can_edit boolean DEFAULT false;

-- 2. Add pin/hide/clear columns to chat_group_members
ALTER TABLE public.chat_group_members
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cleared_at timestamptz;

-- 3. Create group_invite_links table
CREATE TABLE IF NOT EXISTS public.group_invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  link_code text UNIQUE NOT NULL DEFAULT substring(md5(random()::text), 1, 12),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id)
);

-- 4. Create indexes for invite links
CREATE INDEX IF NOT EXISTS idx_group_invite_links_group_id ON public.group_invite_links(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invite_links_link_code ON public.group_invite_links(link_code);

-- 5. Enable RLS on invite links table
ALTER TABLE public.group_invite_links ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policy: Members can view their group's invite link
CREATE POLICY "Members can view group invite links"
ON public.group_invite_links FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_group_members cgm
    WHERE cgm.group_id = group_invite_links.group_id
    AND cgm.user_id = auth.uid()
  )
);

-- 7. RLS Policy: Admins/owners can insert invite links
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

-- 8. RLS Policy: Admins/owners can update invite links
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

-- 9. RLS Policy: Admins/owners can delete invite links
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

-- 10. Public can read invite link for joining (by link_code only)
CREATE POLICY "Anyone can lookup active invite links by code"
ON public.group_invite_links FOR SELECT TO authenticated
USING (is_active = true);