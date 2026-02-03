-- ============================================================
-- PHASE 4: Recreate remaining RLS policies
-- ============================================================

-- workspace_tasks
CREATE POLICY "Organizers manage workspace tasks" ON workspace_tasks
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR public.has_workspace_access(workspace_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR public.has_workspace_access(workspace_id)
);

-- workspace_team_members
CREATE POLICY "Organizers manage workspace team" ON workspace_team_members
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR public.is_workspace_owner(workspace_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR public.is_workspace_owner(workspace_id)
);

CREATE POLICY "Members read workspace team" ON workspace_team_members
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR public.has_workspace_access(workspace_id)
);

-- workspaces
CREATE POLICY "Admins manage all workspaces" ON workspaces
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- workspace_settings
CREATE POLICY "Organizers can manage workspace settings" ON workspace_settings
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR public.is_workspace_owner(workspace_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR public.is_workspace_owner(workspace_id)
);

-- vendors
CREATE POLICY "Admins can view all vendors" ON vendors
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid());

CREATE POLICY "Admins can update all vendors" ON vendors
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid());

-- vendor_services
CREATE POLICY "Admins can manage all services" ON vendor_services
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_services.vendor_id AND v.user_id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_services.vendor_id AND v.user_id = auth.uid())
);

-- vendor_bookings
CREATE POLICY "Admins can manage all bookings" ON vendor_bookings
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_bookings.vendor_id AND v.user_id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_bookings.vendor_id AND v.user_id = auth.uid())
);

-- onboarding_checklist
CREATE POLICY "Admins can view all onboarding checklists" ON onboarding_checklist
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid());

-- admin_audit_logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_logs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- system_settings
CREATE POLICY "Admins can view system settings" ON system_settings
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update system settings" ON system_settings
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert system settings" ON system_settings
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- catering_menu_items
CREATE POLICY "Workspace organizers can manage menu items" ON catering_menu_items
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR public.has_workspace_access(workspace_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR public.has_workspace_access(workspace_id)
);

-- catering_vendors
CREATE POLICY "Workspace organizers can manage vendors" ON catering_vendors
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR public.has_workspace_access(workspace_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'organizer'::app_role)
  OR public.has_workspace_access(workspace_id)
);

CREATE POLICY "Workspace leads can view catering vendors" ON catering_vendors
FOR SELECT TO authenticated
USING (public.has_workspace_access(workspace_id));

CREATE POLICY "Workspace managers can manage catering vendors" ON catering_vendors
FOR ALL TO authenticated
USING (public.has_workspace_management_access(workspace_id))
WITH CHECK (public.has_workspace_management_access(workspace_id));