-- Fix admin_audit_logs RLS: restrict INSERT to service role only
DROP POLICY IF EXISTS "Service role can insert audit logs" ON admin_audit_logs;

-- Create restrictive policy (only service role can insert via edge functions)
CREATE POLICY "Only service role can insert audit logs" 
ON admin_audit_logs FOR INSERT 
TO service_role
WITH CHECK (true);

-- Fix event_page_views RLS: add validation for published events only
DROP POLICY IF EXISTS "Anyone can insert page views" ON event_page_views;

-- Create policy that validates event_id exists and is published
CREATE POLICY "Anyone can insert page views for valid published events" 
ON event_page_views FOR INSERT 
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events 
    WHERE id = event_id 
    AND status = 'PUBLISHED'
  )
);