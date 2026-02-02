-- Create chat_groups table
CREATE TABLE public.chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  created_by UUID NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  max_members INTEGER DEFAULT 100,
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_group_members table
CREATE TABLE public.chat_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  nickname TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID,
  is_muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  UNIQUE(group_id, user_id)
);

-- Create indexes
CREATE INDEX idx_chat_groups_created_by ON public.chat_groups(created_by);
CREATE INDEX idx_chat_group_members_group_id ON public.chat_group_members(group_id);
CREATE INDEX idx_chat_group_members_user_id ON public.chat_group_members(user_id);
CREATE INDEX idx_chat_group_members_role ON public.chat_group_members(role);

-- Enable RLS
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_groups
CREATE POLICY "Members can view their groups"
ON public.chat_groups FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE group_id = chat_groups.id AND user_id = auth.uid()
  ) OR is_public = TRUE
);

CREATE POLICY "Authenticated users can create groups"
ON public.chat_groups FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners and admins can update groups"
ON public.chat_groups FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE group_id = chat_groups.id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Only owners can delete groups"
ON public.chat_groups FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE group_id = chat_groups.id 
    AND user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- RLS Policies for chat_group_members
CREATE POLICY "Members can view group members"
ON public.chat_group_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_group_members cgm
    WHERE cgm.group_id = chat_group_members.group_id AND cgm.user_id = auth.uid()
  )
);

CREATE POLICY "Owners and admins can add members"
ON public.chat_group_members FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow creator to add themselves as owner
  (user_id = auth.uid() AND role = 'owner')
  OR
  -- Allow admins/owners to add other members
  EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE group_id = chat_group_members.group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Owners and admins can update members"
ON public.chat_group_members FOR UPDATE
TO authenticated
USING (
  -- Members can update their own mute settings
  user_id = auth.uid()
  OR
  -- Admins/owners can update other members
  EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE group_id = chat_group_members.group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Owners and admins can remove members"
ON public.chat_group_members FOR DELETE
TO authenticated
USING (
  -- Members can leave (remove themselves)
  user_id = auth.uid()
  OR
  -- Admins/owners can remove others
  EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE group_id = chat_group_members.group_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Trigger to update member_count
CREATE OR REPLACE FUNCTION public.update_chat_group_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.chat_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.chat_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_chat_group_member_count
AFTER INSERT OR DELETE ON public.chat_group_members
FOR EACH ROW EXECUTE FUNCTION public.update_chat_group_member_count();

-- Trigger to update updated_at
CREATE TRIGGER update_chat_groups_updated_at
BEFORE UPDATE ON public.chat_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();