-- 1. Normalize all existing status values to uppercase
UPDATE workspace_team_members
SET status = 'ACTIVE'
WHERE status = 'active';

-- 2. Add CHECK constraint to enforce uppercase values going forward
ALTER TABLE workspace_team_members
ADD CONSTRAINT workspace_team_members_status_check
CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'));

-- 3. (Defensive) Update RLS function to be case-insensitive
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
    AND UPPER(status) = 'ACTIVE'
  );
$$;