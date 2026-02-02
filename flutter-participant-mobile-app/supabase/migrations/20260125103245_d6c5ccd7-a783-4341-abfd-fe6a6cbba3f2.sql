-- Cleanup: Remove redundant old RLS policy from messages table
-- The new 'messages_select_participants' policy already provides comprehensive access control

DROP POLICY IF EXISTS "Users can view messages in their groups" ON public.messages;