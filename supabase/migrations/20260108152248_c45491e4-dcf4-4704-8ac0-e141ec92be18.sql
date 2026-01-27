-- =====================================================
-- Workspace Access Control Migration
-- =====================================================

-- 1. Create workspace_invitations table
CREATE TABLE public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  invited_by UUID NOT NULL,
  token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')),
  custom_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ
);

-- 2. Create workspace_access_requests table
CREATE TABLE public.workspace_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  requested_role TEXT,
  message TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by UUID,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique constraint for pending requests
CREATE UNIQUE INDEX workspace_access_requests_pending_unique 
ON public.workspace_access_requests(workspace_id, user_id) 
WHERE status = 'PENDING';

-- 3. Create security definer functions for access checks

-- Check if user is workspace owner
CREATE OR REPLACE FUNCTION public.is_workspace_owner(
  _workspace_id UUID,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspaces
    WHERE id = _workspace_id AND organizer_id = _user_id
  );
$$;

-- Check if user is active workspace team member
CREATE OR REPLACE FUNCTION public.is_workspace_member(
  _workspace_id UUID,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_team_members
    WHERE workspace_id = _workspace_id
    AND user_id = _user_id
    AND status = 'ACTIVE'
  );
$$;

-- Check if user has any access to workspace (owner OR member)
CREATE OR REPLACE FUNCTION public.has_workspace_access(
  _workspace_id UUID,
  _user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_workspace_owner(_workspace_id, _user_id) OR
    public.is_workspace_member(_workspace_id, _user_id);
$$;

-- 4. Enable RLS on new tables
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_access_requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for workspace_invitations

-- Workspace owners can manage all invitations for their workspaces
CREATE POLICY "Workspace owners can manage invitations"
ON public.workspace_invitations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE workspaces.id = workspace_invitations.workspace_id
    AND workspaces.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE workspaces.id = workspace_invitations.workspace_id
    AND workspaces.organizer_id = auth.uid()
  )
);

-- Users can view invitations sent to their email
CREATE POLICY "Users can view their own invitations"
ON public.workspace_invitations
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 6. RLS Policies for workspace_access_requests

-- Users can create and view their own requests
CREATE POLICY "Users can manage their own access requests"
ON public.workspace_access_requests
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Workspace owners can view and manage all requests for their workspaces
CREATE POLICY "Workspace owners can manage access requests"
ON public.workspace_access_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE workspaces.id = workspace_access_requests.workspace_id
    AND workspaces.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE workspaces.id = workspace_access_requests.workspace_id
    AND workspaces.organizer_id = auth.uid()
  )
);

-- 7. Add RLS policy for team members to view their assigned workspaces
CREATE POLICY "Team members can view assigned workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  organizer_id = auth.uid() OR
  public.is_workspace_member(id, auth.uid())
);

-- 8. RLS policies for workspace_team_members - owners can manage their teams
CREATE POLICY "Workspace owners can manage team members"
ON public.workspace_team_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE workspaces.id = workspace_team_members.workspace_id
    AND workspaces.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE workspaces.id = workspace_team_members.workspace_id
    AND workspaces.organizer_id = auth.uid()
  )
);

-- Team members can view their own membership
CREATE POLICY "Team members can view their own membership"
ON public.workspace_team_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 9. Create indexes for performance
CREATE INDEX idx_workspace_invitations_workspace_id ON public.workspace_invitations(workspace_id);
CREATE INDEX idx_workspace_invitations_email ON public.workspace_invitations(email);
CREATE INDEX idx_workspace_invitations_status ON public.workspace_invitations(status);
CREATE INDEX idx_workspace_access_requests_workspace_id ON public.workspace_access_requests(workspace_id);
CREATE INDEX idx_workspace_access_requests_user_id ON public.workspace_access_requests(user_id);
CREATE INDEX idx_workspace_access_requests_status ON public.workspace_access_requests(status);

-- 10. Add trigger for updated_at on workspace_access_requests
CREATE TRIGGER update_workspace_access_requests_updated_at
BEFORE UPDATE ON public.workspace_access_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();