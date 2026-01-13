-- PHASE 5: Final remaining RLS policies

-- catering_inventory
CREATE POLICY "Workspace organizers can manage inventory" ON catering_inventory
FOR ALL TO authenticated
USING (public.has_workspace_access(workspace_id))
WITH CHECK (public.has_workspace_access(workspace_id));

-- catering_meal_schedule
CREATE POLICY "Workspace organizers can manage meal schedule" ON catering_meal_schedule
FOR ALL TO authenticated
USING (public.has_workspace_access(workspace_id))
WITH CHECK (public.has_workspace_access(workspace_id));

-- catering_dietary_requirements
CREATE POLICY "Workspace organizers can manage dietary requirements" ON catering_dietary_requirements
FOR ALL TO authenticated
USING (public.has_workspace_access(workspace_id))
WITH CHECK (public.has_workspace_access(workspace_id));

-- workspace_budgets
CREATE POLICY "Workspace managers can view budget" ON workspace_budgets
FOR SELECT TO authenticated
USING (public.has_workspace_management_access(workspace_id));

-- workspace_speakers
CREATE POLICY "Workspace leads can view speakers" ON workspace_speakers
FOR SELECT TO authenticated
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace managers can manage speakers" ON workspace_speakers
FOR ALL TO authenticated
USING (public.has_workspace_management_access(workspace_id))
WITH CHECK (public.has_workspace_management_access(workspace_id));

-- registration_attendees
CREATE POLICY "Admins view all attendees" ON registration_attendees
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM registrations r WHERE r.id = registration_attendees.registration_id AND r.user_id = auth.uid())
);

-- user_profiles
CREATE POLICY "Admins view all profiles" ON user_profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR id = auth.uid());

-- workspace_audit_logs
CREATE POLICY "Workspace owners and managers view audit logs" ON workspace_audit_logs
FOR SELECT TO authenticated
USING (public.has_workspace_management_access(workspace_id));

-- workspace_social_api_credentials
CREATE POLICY "Workspace owners can manage API credentials" ON workspace_social_api_credentials
FOR ALL TO authenticated
USING (public.is_workspace_owner(workspace_id))
WITH CHECK (public.is_workspace_owner(workspace_id));

-- attendance_records (updated - use workspace access via event)
CREATE POLICY "Staff see attendance" ON attendance_records
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.event_id = attendance_records.event_id
    AND public.has_workspace_access(w.id)
  )
);

CREATE POLICY "Staff insert attendance" ON attendance_records
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.event_id = attendance_records.event_id
    AND public.has_workspace_access(w.id)
  )
);

-- storage.objects for vendor-documents bucket
CREATE POLICY "Admins view all vendor documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'vendor-documents' AND public.has_role(auth.uid(), 'admin'::app_role));