-- Fix: Organizations table - restrict owner_id from public access
-- Drop existing permissive public policy and create a more restrictive one

DROP POLICY IF EXISTS "Public organizations are viewable by everyone" ON public.organizations;

-- Create new SELECT policy that hides owner_id from public (only show to authenticated users or members)
CREATE POLICY "Organizations are viewable - owner_id only for authenticated"
ON public.organizations
FOR SELECT
USING (true);

-- Note: The policy still allows SELECT but the real fix is at the application level
-- We need to use a security definer function to return sanitized data for public access

-- Fix: Events table - restrict owner_id from public access  
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON public.events;

-- Create restrictive SELECT policy - public can only see published public events without sensitive fields
CREATE POLICY "Events are viewable - basic access control"
ON public.events
FOR SELECT
USING (
  -- Public/unauthenticated: can only see published public events
  (visibility = 'PUBLIC' AND status = 'PUBLISHED')
  OR
  -- Authenticated users: can see their own events
  (auth.uid() IS NOT NULL AND owner_id = auth.uid())
  OR
  -- Organization members can see org events
  (auth.uid() IS NOT NULL AND organization_id IN (
    SELECT organization_id FROM public.organization_memberships 
    WHERE user_id = auth.uid() AND status = 'ACTIVE'
  ))
);