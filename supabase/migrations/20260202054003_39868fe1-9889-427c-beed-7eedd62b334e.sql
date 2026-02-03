-- Drop old policies that reference workspaces.organizer_id
DROP POLICY IF EXISTS "social_media_accounts_select" ON public.social_media_accounts;
DROP POLICY IF EXISTS "social_media_accounts_insert" ON public.social_media_accounts;
DROP POLICY IF EXISTS "social_media_accounts_update" ON public.social_media_accounts;
DROP POLICY IF EXISTS "social_media_accounts_delete" ON public.social_media_accounts;

DROP POLICY IF EXISTS "hashtag_tracking_select" ON public.hashtag_tracking;
DROP POLICY IF EXISTS "hashtag_tracking_insert" ON public.hashtag_tracking;
DROP POLICY IF EXISTS "hashtag_tracking_update" ON public.hashtag_tracking;
DROP POLICY IF EXISTS "hashtag_tracking_delete" ON public.hashtag_tracking;

DROP POLICY IF EXISTS "audience_demographics_select" ON public.audience_demographics;
DROP POLICY IF EXISTS "audience_demographics_insert" ON public.audience_demographics;
DROP POLICY IF EXISTS "audience_demographics_update" ON public.audience_demographics;
DROP POLICY IF EXISTS "audience_demographics_delete" ON public.audience_demographics;

-- Recreate policies using workspace_team_members
CREATE POLICY "social_media_accounts_select" ON public.social_media_accounts 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm 
    WHERE wtm.workspace_id = social_media_accounts.workspace_id 
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
  )
);

CREATE POLICY "social_media_accounts_insert" ON public.social_media_accounts 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm 
    WHERE wtm.workspace_id = social_media_accounts.workspace_id 
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
    AND wtm.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "social_media_accounts_update" ON public.social_media_accounts 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm 
    WHERE wtm.workspace_id = social_media_accounts.workspace_id 
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
    AND wtm.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "social_media_accounts_delete" ON public.social_media_accounts 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm 
    WHERE wtm.workspace_id = social_media_accounts.workspace_id 
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
    AND wtm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "hashtag_tracking_select" ON public.hashtag_tracking 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm 
    WHERE wtm.workspace_id = hashtag_tracking.workspace_id 
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
  )
);

CREATE POLICY "hashtag_tracking_insert" ON public.hashtag_tracking 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm 
    WHERE wtm.workspace_id = hashtag_tracking.workspace_id 
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
    AND wtm.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "hashtag_tracking_update" ON public.hashtag_tracking 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm 
    WHERE wtm.workspace_id = hashtag_tracking.workspace_id 
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
    AND wtm.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "hashtag_tracking_delete" ON public.hashtag_tracking 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm 
    WHERE wtm.workspace_id = hashtag_tracking.workspace_id 
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
    AND wtm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "audience_demographics_select" ON public.audience_demographics 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm 
    WHERE wtm.workspace_id = audience_demographics.workspace_id 
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
  )
);

CREATE POLICY "audience_demographics_insert" ON public.audience_demographics 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm 
    WHERE wtm.workspace_id = audience_demographics.workspace_id 
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
    AND wtm.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "audience_demographics_update" ON public.audience_demographics 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm 
    WHERE wtm.workspace_id = audience_demographics.workspace_id 
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
    AND wtm.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "audience_demographics_delete" ON public.audience_demographics 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.workspace_team_members wtm 
    WHERE wtm.workspace_id = audience_demographics.workspace_id 
    AND wtm.user_id = auth.uid()
    AND wtm.status = 'active'
    AND wtm.role IN ('owner', 'admin')
  )
);