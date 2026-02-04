-- ============================================================
-- COMPREHENSIVE MIGRATION: Remove unused app_role enum values
-- ============================================================

-- PHASE 1: Drop ALL policies that depend on has_role function
-- (Must be done before we can modify the enum type)

-- user_roles policies
DROP POLICY IF EXISTS "Users can select any user if they are an admin" ON user_roles;
DROP POLICY IF EXISTS "Users can update any user if they are an admin" ON user_roles;
DROP POLICY IF EXISTS "Users can insert if they are an admin" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can update if they are an admin" ON user_roles;
DROP POLICY IF EXISTS "Users can delete if they are an admin" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;

-- registrations
DROP POLICY IF EXISTS "Organizers view registrations" ON registrations;

-- workspace_activities
DROP POLICY IF EXISTS "Workspace activity writers" ON workspace_activities;
DROP POLICY IF EXISTS "Workspace activity readers" ON workspace_activities;

-- rubrics
DROP POLICY IF EXISTS "Organizers manage rubrics" ON rubrics;

-- submissions
DROP POLICY IF EXISTS "Organizers manage submissions" ON submissions;
DROP POLICY IF EXISTS "Participants create submissions" ON submissions;

-- scores
DROP POLICY IF EXISTS "Organizers read scores" ON scores;
DROP POLICY IF EXISTS "Judges manage own scores" ON scores;

-- judge_assignments
DROP POLICY IF EXISTS "Organizers manage judge assignments" ON judge_assignments;

-- notifications
DROP POLICY IF EXISTS "Admins view all notifications" ON notifications;

-- organizations
DROP POLICY IF EXISTS "Organizers can insert their own organizations" ON organizations;
DROP POLICY IF EXISTS "Admins view all organizations" ON organizations;

-- events
DROP POLICY IF EXISTS "Admins manage all events" ON events;
DROP POLICY IF EXISTS "Organizers create personal events" ON events;

-- workspace_tasks
DROP POLICY IF EXISTS "Organizers manage workspace tasks" ON workspace_tasks;

-- workspace_team_members
DROP POLICY IF EXISTS "Organizers manage workspace team" ON workspace_team_members;
DROP POLICY IF EXISTS "Members read workspace team" ON workspace_team_members;

-- workspaces
DROP POLICY IF EXISTS "Admins manage all workspaces" ON workspaces;

-- workspace_settings
DROP POLICY IF EXISTS "Organizers can manage workspace settings" ON workspace_settings;

-- vendors
DROP POLICY IF EXISTS "Admins can view all vendors" ON vendors;
DROP POLICY IF EXISTS "Admins can update all vendors" ON vendors;

-- vendor_services
DROP POLICY IF EXISTS "Admins can manage all services" ON vendor_services;

-- vendor_bookings
DROP POLICY IF EXISTS "Admins can manage all bookings" ON vendor_bookings;

-- onboarding_checklist
DROP POLICY IF EXISTS "Admins can view all onboarding checklists" ON onboarding_checklist;

-- admin_audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_logs;

-- system_settings
DROP POLICY IF EXISTS "Admins can view system settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can update system settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can insert system settings" ON system_settings;

-- catering_menu_items
DROP POLICY IF EXISTS "Workspace organizers can manage menu items" ON catering_menu_items;

-- catering_vendors
DROP POLICY IF EXISTS "Workspace organizers can manage vendors" ON catering_vendors;
DROP POLICY IF EXISTS "Workspace leads can view catering vendors" ON catering_vendors;
DROP POLICY IF EXISTS "Workspace managers can manage catering vendors" ON catering_vendors;

-- catering_inventory
DROP POLICY IF EXISTS "Workspace organizers can manage inventory" ON catering_inventory;

-- catering_meal_schedule
DROP POLICY IF EXISTS "Workspace organizers can manage meal schedule" ON catering_meal_schedule;

-- catering_dietary_requirements
DROP POLICY IF EXISTS "Workspace organizers can manage dietary requirements" ON catering_dietary_requirements;

-- workspace_budgets
DROP POLICY IF EXISTS "Workspace managers can view budget" ON workspace_budgets;

-- workspace_speakers
DROP POLICY IF EXISTS "Workspace leads can view speakers" ON workspace_speakers;
DROP POLICY IF EXISTS "Workspace managers can manage speakers" ON workspace_speakers;

-- registration_attendees
DROP POLICY IF EXISTS "Admins view all attendees" ON registration_attendees;

-- user_profiles
DROP POLICY IF EXISTS "Admins view all profiles" ON user_profiles;

-- workspace_audit_logs
DROP POLICY IF EXISTS "Workspace owners and managers view audit logs" ON workspace_audit_logs;

-- workspace_social_api_credentials
DROP POLICY IF EXISTS "Workspace owners can manage API credentials" ON workspace_social_api_credentials;

-- attendance_records
DROP POLICY IF EXISTS "Staff see attendance" ON attendance_records;
DROP POLICY IF EXISTS "Staff insert attendance" ON attendance_records;

-- storage.objects (vendor-documents bucket)
DROP POLICY IF EXISTS "Admins view all vendor documents" ON storage.objects;