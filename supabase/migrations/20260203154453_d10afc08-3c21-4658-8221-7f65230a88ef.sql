-- Fix overly permissive notification_queue RLS policy
-- The current policy allows ALL operations for PUBLIC role with USING (true)
-- This is a security risk - notification queue should only be managed by service_role

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can manage notification queue" ON public.notification_queue;

-- Create proper restrictive policies

-- Service role (backend) can manage all notifications
CREATE POLICY "Service role can manage notification queue"
ON public.notification_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can only INSERT their own notifications  
CREATE POLICY "Users can create own notifications"
ON public.notification_queue
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- Users can view their own pending notifications
CREATE POLICY "Users can view own notifications"
ON public.notification_queue
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- Users can update their own notifications (e.g., mark as processed)
CREATE POLICY "Users can update own notifications"
ON public.notification_queue
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);