-- ============================================================
-- PHASE 3: Recreate ALL RLS policies with new enum
-- ============================================================

-- user_roles policies
CREATE POLICY "Users can view their own roles" ON user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can select any user roles" ON user_roles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any user roles" ON user_roles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert user roles" ON user_roles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete user roles" ON user_roles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- registrations
CREATE POLICY "Organizers view registrations" ON registrations
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR user_id = auth.uid()
);

-- workspace_activities (updated - no volunteer role)
CREATE POLICY "Workspace activity readers" ON workspace_activities
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR public.has_workspace_access(workspace_id::uuid)
);

CREATE POLICY "Workspace activity writers" ON workspace_activities
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR public.has_workspace_access(workspace_id::uuid)
);

-- rubrics
CREATE POLICY "Organizers manage rubrics" ON rubrics
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
);

-- submissions
CREATE POLICY "Organizers manage submissions" ON submissions
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR submitted_by = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR submitted_by = auth.uid()
);

CREATE POLICY "Participants create submissions" ON submissions
FOR INSERT TO authenticated
WITH CHECK (submitted_by = auth.uid());

-- scores (updated - no judge role, use judge_id)
CREATE POLICY "Judges manage own scores" ON scores
FOR ALL TO authenticated
USING (
  judge_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  judge_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Organizers read scores" ON scores
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
);

-- judge_assignments
CREATE POLICY "Organizers manage judge assignments" ON judge_assignments
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
);

-- notifications
CREATE POLICY "Admins view all notifications" ON notifications
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR user_id = auth.uid()
);

-- organizations
CREATE POLICY "Organizers can insert their own organizations" ON organizations
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'organizer'::app_role)
  AND owner_id = auth.uid()
);

CREATE POLICY "Admins view all organizations" ON organizations
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM organization_memberships om
    WHERE om.organization_id = organizations.id
    AND om.user_id = auth.uid()
    AND om.status = 'ACTIVE'
  )
);

-- events
CREATE POLICY "Admins manage all events" ON events
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Organizers create personal events" ON events
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'organizer'::app_role)
  AND owner_id = auth.uid()
);