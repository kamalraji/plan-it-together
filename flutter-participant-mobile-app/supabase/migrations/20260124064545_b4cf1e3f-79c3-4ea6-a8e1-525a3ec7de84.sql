-- =====================================================
-- Phase 2: Fix chat_groups SELECT policy to include creator
-- =====================================================
DROP POLICY IF EXISTS "Members can view their groups" ON public.chat_groups;

CREATE POLICY "Members and creators can view groups" ON public.chat_groups
FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR is_public = TRUE
  OR EXISTS (
    SELECT 1 FROM public.chat_group_members cgm
    WHERE cgm.group_id = id AND cgm.user_id = auth.uid()
  )
);

-- =====================================================
-- Phase 3: Atomic group creation RPC (SECURITY DEFINER)
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_chat_group(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_icon_url TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT FALSE,
  p_max_members INTEGER DEFAULT 100,
  p_member_ids UUID[] DEFAULT '{}'::UUID[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_group_id UUID;
  v_group RECORD;
  v_member_id UUID;
BEGIN
  -- Validate authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Validate name
  IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 THEN
    RAISE EXCEPTION 'Group name is required';
  END IF;
  
  -- Create the group with member_count = 0 (trigger will handle counting)
  INSERT INTO public.chat_groups (
    name,
    description,
    icon_url,
    is_public,
    max_members,
    created_by,
    member_count
  ) VALUES (
    TRIM(p_name),
    p_description,
    p_icon_url,
    p_is_public,
    p_max_members,
    v_user_id,
    0  -- Start at 0, trigger increments
  )
  RETURNING id INTO v_group_id;
  
  -- Add creator as owner
  INSERT INTO public.chat_group_members (
    group_id,
    user_id,
    role,
    joined_at
  ) VALUES (
    v_group_id,
    v_user_id,
    'owner',
    NOW()
  );
  
  -- Add additional members (if any), excluding creator
  IF p_member_ids IS NOT NULL AND array_length(p_member_ids, 1) > 0 THEN
    FOREACH v_member_id IN ARRAY p_member_ids
    LOOP
      -- Skip if it's the creator (already added as owner)
      IF v_member_id != v_user_id THEN
        INSERT INTO public.chat_group_members (
          group_id,
          user_id,
          role,
          invited_by,
          joined_at
        ) VALUES (
          v_group_id,
          v_member_id,
          'member',
          v_user_id,
          NOW()
        )
        ON CONFLICT (group_id, user_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  -- Fetch and return the created group
  SELECT * INTO v_group FROM public.chat_groups WHERE id = v_group_id;
  
  RETURN json_build_object(
    'id', v_group.id,
    'name', v_group.name,
    'description', v_group.description,
    'icon_url', v_group.icon_url,
    'is_public', v_group.is_public,
    'max_members', v_group.max_members,
    'member_count', v_group.member_count,
    'created_by', v_group.created_by,
    'created_at', v_group.created_at,
    'updated_at', v_group.updated_at
  );
END;
$$;

-- =====================================================
-- Phase 4: Fix member_count default to 0
-- =====================================================
ALTER TABLE public.chat_groups 
ALTER COLUMN member_count SET DEFAULT 0;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_chat_group TO authenticated;