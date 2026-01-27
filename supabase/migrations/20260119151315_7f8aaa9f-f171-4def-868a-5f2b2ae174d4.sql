-- Add 'vendor' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

-- Create role_change_audit table for comprehensive audit logging
CREATE TABLE IF NOT EXISTS public.role_change_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    target_user_id UUID,
    action TEXT NOT NULL, -- 'role_assigned', 'role_removed', 'permission_denied', 'role_check'
    role_type TEXT NOT NULL, -- 'app_role', 'workspace_role', 'organization_role'
    old_value TEXT,
    new_value TEXT,
    resource_type TEXT, -- 'workspace', 'organization', 'event', etc.
    resource_id UUID,
    reason TEXT, -- For permission denials
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_role_change_audit_user_id ON public.role_change_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_role_change_audit_target_user_id ON public.role_change_audit(target_user_id);
CREATE INDEX IF NOT EXISTS idx_role_change_audit_action ON public.role_change_audit(action);
CREATE INDEX IF NOT EXISTS idx_role_change_audit_created_at ON public.role_change_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_change_audit_resource ON public.role_change_audit(resource_type, resource_id);

-- Enable RLS
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view role audit logs"
ON public.role_change_audit
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert via service role only (no direct inserts from clients)
CREATE POLICY "Service role can insert audit logs"
ON public.role_change_audit
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create function to log role changes (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.log_role_change(
    p_user_id UUID,
    p_target_user_id UUID,
    p_action TEXT,
    p_role_type TEXT,
    p_old_value TEXT DEFAULT NULL,
    p_new_value TEXT DEFAULT NULL,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.role_change_audit (
        user_id,
        target_user_id,
        action,
        role_type,
        old_value,
        new_value,
        resource_type,
        resource_id,
        reason,
        metadata
    ) VALUES (
        p_user_id,
        p_target_user_id,
        p_action,
        p_role_type,
        p_old_value,
        p_new_value,
        p_resource_type,
        p_resource_id,
        p_reason,
        p_metadata
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;

-- Create trigger function to auto-log user_roles changes
CREATE OR REPLACE FUNCTION public.trigger_log_user_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_role_change(
            COALESCE(auth.uid(), NEW.user_id),
            NEW.user_id,
            'role_assigned',
            'app_role',
            NULL,
            NEW.role::TEXT,
            NULL,
            NULL,
            'Role assigned via user_roles table',
            '{}'::JSONB
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM public.log_role_change(
            COALESCE(auth.uid(), NEW.user_id),
            NEW.user_id,
            'role_updated',
            'app_role',
            OLD.role::TEXT,
            NEW.role::TEXT,
            NULL,
            NULL,
            'Role updated via user_roles table',
            '{}'::JSONB
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.log_role_change(
            COALESCE(auth.uid(), OLD.user_id),
            OLD.user_id,
            'role_removed',
            'app_role',
            OLD.role::TEXT,
            NULL,
            NULL,
            NULL,
            'Role removed via user_roles table',
            '{}'::JSONB
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Attach trigger to user_roles table
DROP TRIGGER IF EXISTS log_user_role_changes ON public.user_roles;
CREATE TRIGGER log_user_role_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_log_user_role_change();

-- Create trigger function to auto-log workspace_team_members role changes
CREATE OR REPLACE FUNCTION public.trigger_log_workspace_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_role_change(
            COALESCE(auth.uid(), NEW.user_id),
            NEW.user_id,
            'role_assigned',
            'workspace_role',
            NULL,
            NEW.role,
            'workspace',
            NEW.workspace_id,
            'Member added to workspace',
            jsonb_build_object('workspace_id', NEW.workspace_id)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
        PERFORM public.log_role_change(
            COALESCE(auth.uid(), NEW.user_id),
            NEW.user_id,
            'role_updated',
            'workspace_role',
            OLD.role,
            NEW.role,
            'workspace',
            NEW.workspace_id,
            'Workspace role changed',
            jsonb_build_object('workspace_id', NEW.workspace_id)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.log_role_change(
            COALESCE(auth.uid(), OLD.user_id),
            OLD.user_id,
            'role_removed',
            'workspace_role',
            OLD.role,
            NULL,
            'workspace',
            OLD.workspace_id,
            'Member removed from workspace',
            jsonb_build_object('workspace_id', OLD.workspace_id)
        );
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

-- Attach trigger to workspace_team_members table
DROP TRIGGER IF EXISTS log_workspace_role_changes ON public.workspace_team_members;
CREATE TRIGGER log_workspace_role_changes
AFTER INSERT OR UPDATE OR DELETE ON public.workspace_team_members
FOR EACH ROW
EXECUTE FUNCTION public.trigger_log_workspace_role_change();