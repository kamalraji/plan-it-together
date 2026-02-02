-- =============================================
-- CIRCLE ENHANCEMENT SCHEMA MIGRATION
-- =============================================

-- 1. Circle Invite Links Table
CREATE TABLE IF NOT EXISTS public.circle_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  link_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Circle Invitations Table (for pending direct invites)
CREATE TABLE IF NOT EXISTS public.circle_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_id UUID,
  invitee_email TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT invitee_required CHECK (invitee_id IS NOT NULL OR invitee_email IS NOT NULL)
);

-- 3. Circle Message Reactions Table
CREATE TABLE IF NOT EXISTS public.circle_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.circle_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- 4. Extend circle_messages table
ALTER TABLE public.circle_messages 
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.circle_messages(id),
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sender_name TEXT,
  ADD COLUMN IF NOT EXISTS sender_avatar TEXT;

-- 5. Extend circle_members table
ALTER TABLE public.circle_members 
  ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS muted_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invited_by UUID;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_circle_invite_links_circle_id ON public.circle_invite_links(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_invite_links_link_code ON public.circle_invite_links(link_code);
CREATE INDEX IF NOT EXISTS idx_circle_invitations_circle_id ON public.circle_invitations(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_invitations_invitee_id ON public.circle_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_circle_invitations_status ON public.circle_invitations(status);
CREATE INDEX IF NOT EXISTS idx_circle_message_reactions_message_id ON public.circle_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_circle_messages_reply_to_id ON public.circle_messages(reply_to_id);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on new tables
ALTER TABLE public.circle_invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_message_reactions ENABLE ROW LEVEL SECURITY;

-- Circle Invite Links Policies
CREATE POLICY "Circle members can view invite links"
  ON public.circle_invite_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.circle_members cm 
      WHERE cm.circle_id = circle_invite_links.circle_id 
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Circle admins can create invite links"
  ON public.circle_invite_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.circle_members cm 
      WHERE cm.circle_id = circle_invite_links.circle_id 
      AND cm.user_id = auth.uid()
      AND cm.role IN ('ADMIN', 'MODERATOR')
    )
  );

CREATE POLICY "Circle admins can update invite links"
  ON public.circle_invite_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.circle_members cm 
      WHERE cm.circle_id = circle_invite_links.circle_id 
      AND cm.user_id = auth.uid()
      AND cm.role IN ('ADMIN', 'MODERATOR')
    )
  );

CREATE POLICY "Circle admins can delete invite links"
  ON public.circle_invite_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.circle_members cm 
      WHERE cm.circle_id = circle_invite_links.circle_id 
      AND cm.user_id = auth.uid()
      AND cm.role = 'ADMIN'
    )
  );

-- Anyone can view invite link by code (for joining)
CREATE POLICY "Anyone can view active invite links by code"
  ON public.circle_invite_links FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Circle Invitations Policies
CREATE POLICY "Users can view invitations they sent or received"
  ON public.circle_invitations FOR SELECT
  USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

CREATE POLICY "Circle admins can create invitations"
  ON public.circle_invitations FOR INSERT
  WITH CHECK (
    inviter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.circle_members cm 
      WHERE cm.circle_id = circle_invitations.circle_id 
      AND cm.user_id = auth.uid()
      AND cm.role IN ('ADMIN', 'MODERATOR')
    )
  );

CREATE POLICY "Invitees can update their invitations"
  ON public.circle_invitations FOR UPDATE
  USING (invitee_id = auth.uid());

CREATE POLICY "Inviters can delete their invitations"
  ON public.circle_invitations FOR DELETE
  USING (inviter_id = auth.uid());

-- Circle Message Reactions Policies
CREATE POLICY "Circle members can view reactions"
  ON public.circle_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.circle_messages cm
      JOIN public.circle_members mem ON mem.circle_id = cm.circle_id
      WHERE cm.id = circle_message_reactions.message_id
      AND mem.user_id = auth.uid()
    )
  );

CREATE POLICY "Circle members can add reactions"
  ON public.circle_message_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.circle_messages cm
      JOIN public.circle_members mem ON mem.circle_id = cm.circle_id
      WHERE cm.id = circle_message_reactions.message_id
      AND mem.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their own reactions"
  ON public.circle_message_reactions FOR DELETE
  USING (user_id = auth.uid());

-- =============================================
-- RPC FUNCTIONS
-- =============================================

-- Function to increment invite link use count
CREATE OR REPLACE FUNCTION public.increment_circle_invite_use_count(p_link_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link circle_invite_links%ROWTYPE;
BEGIN
  SELECT * INTO v_link 
  FROM circle_invite_links 
  WHERE link_code = p_link_code 
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF v_link.max_uses IS NOT NULL AND v_link.use_count >= v_link.max_uses THEN
    RETURN false;
  END IF;
  
  UPDATE circle_invite_links 
  SET use_count = use_count + 1 
  WHERE id = v_link.id;
  
  RETURN true;
END;
$$;