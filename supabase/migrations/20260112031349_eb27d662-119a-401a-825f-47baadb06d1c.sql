-- Fix user_profiles_public_exposure: Ensure all policies are scoped to authenticated users only
-- This prevents any anonymous access attempts

-- Drop and recreate the UPDATE policy to explicitly require authentication
DROP POLICY IF EXISTS "Users manage own profile update" ON user_profiles;

CREATE POLICY "Users manage own profile update"
ON user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Ensure the SELECT policy is also explicitly authenticated (should already be, but reinforce)
DROP POLICY IF EXISTS "Users view own profile" ON user_profiles;

CREATE POLICY "Users view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- The "Admins view all profiles" policy is already correctly scoped to authenticated

-- Note: Public portfolio access is handled via get_public_portfolio() security definer function
-- which only returns non-PII fields (excludes phone, email)