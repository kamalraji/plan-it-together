-- =============================================
-- FLUTTER APP BRIDGE MIGRATION
-- Phase 1: Create Missing Tables & Columns
-- =============================================

-- 1.1 Create messages table for DM/Chat functionality
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  content TEXT NOT NULL DEFAULT '',
  attachments JSONB DEFAULT '[]',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_channel ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.messages(sent_at DESC);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1.2 Add missing columns to user_profiles (portfolio features)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS portfolio_layout TEXT DEFAULT 'STACKED',
ADD COLUMN IF NOT EXISTS portfolio_accent_color TEXT,
ADD COLUMN IF NOT EXISTS portfolio_sections TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS organization TEXT,
ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- 1.3 Add missing columns to registrations
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS form_responses JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL;

-- =============================================
-- Phase 2: Create RPC Functions
-- =============================================

-- Increment ticket sold count
CREATE OR REPLACE FUNCTION public.increment_ticket_sold_count(ticket_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.ticket_tiers 
  SET sold_count = sold_count + quantity 
  WHERE id = ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Decrement ticket sold count
CREATE OR REPLACE FUNCTION public.decrement_ticket_sold_count(ticket_id UUID, quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.ticket_tiers 
  SET sold_count = GREATEST(sold_count - quantity, 0)
  WHERE id = ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- Phase 3: RLS Policies for Participant Access
-- =============================================

-- 3.1 Events policies
DROP POLICY IF EXISTS "Participants can view public events" ON public.events;
CREATE POLICY "Participants can view public events"
ON public.events FOR SELECT
USING (
  visibility = 'PUBLIC' 
  AND status IN ('PUBLISHED', 'ONGOING', 'COMPLETED')
);

-- 3.2 Registrations policies
DROP POLICY IF EXISTS "Users can view own registrations" ON public.registrations;
CREATE POLICY "Users can view own registrations"
ON public.registrations FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own registrations" ON public.registrations;
CREATE POLICY "Users can create own registrations"
ON public.registrations FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own registrations" ON public.registrations;
CREATE POLICY "Users can update own registrations"
ON public.registrations FOR UPDATE
USING (user_id = auth.uid());

-- 3.3 User Profiles policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.user_profiles;
CREATE POLICY "Anyone can view profiles"
ON public.user_profiles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- 3.4 Impact Profiles policies
DROP POLICY IF EXISTS "Authenticated users can view impact profiles" ON public.impact_profiles;
CREATE POLICY "Authenticated users can view impact profiles"
ON public.impact_profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can manage own impact profile" ON public.impact_profiles;
CREATE POLICY "Users can manage own impact profile"
ON public.impact_profiles FOR ALL
USING (user_id = auth.uid());

-- 3.5 Connections policies
DROP POLICY IF EXISTS "Users can view own connections" ON public.connections;
CREATE POLICY "Users can view own connections"
ON public.connections FOR SELECT
USING (requester_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Users can send connection requests" ON public.connections;
CREATE POLICY "Users can send connection requests"
ON public.connections FOR INSERT
WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "Users can respond to connection requests" ON public.connections;
CREATE POLICY "Users can respond to connection requests"
ON public.connections FOR UPDATE
USING (receiver_id = auth.uid() OR requester_id = auth.uid());

-- 3.6 Messages policies
DROP POLICY IF EXISTS "Users can view messages in accessible channels" ON public.messages;
CREATE POLICY "Users can view messages in accessible channels"
ON public.messages FOR SELECT
TO authenticated
USING (
  channel_id LIKE '%' || auth.uid()::text || '%'
  OR sender_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages"
ON public.messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());

-- 3.7 Circles policies
DROP POLICY IF EXISTS "View public circles" ON public.circles;
CREATE POLICY "View public circles"
ON public.circles FOR SELECT
USING (is_public = true OR is_private = false);

DROP POLICY IF EXISTS "Members can view private circles" ON public.circles;
CREATE POLICY "Members can view private circles"
ON public.circles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM circle_members cm
    WHERE cm.circle_id = id AND cm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create circles" ON public.circles;
CREATE POLICY "Users can create circles"
ON public.circles FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- 3.8 Circle Members policies
DROP POLICY IF EXISTS "Users can view circle members" ON public.circle_members;
CREATE POLICY "Users can view circle members"
ON public.circle_members FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can join circles" ON public.circle_members;
CREATE POLICY "Users can join circles"
ON public.circle_members FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can leave circles" ON public.circle_members;
CREATE POLICY "Users can leave circles"
ON public.circle_members FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 3.9 Circle Messages policies
DROP POLICY IF EXISTS "Members can view circle messages" ON public.circle_messages;
CREATE POLICY "Members can view circle messages"
ON public.circle_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM circle_members cm
    WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can send circle messages" ON public.circle_messages;
CREATE POLICY "Members can send circle messages"
ON public.circle_messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM circle_members cm
    WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid()
  )
);

-- 3.10 Spark Posts policies
DROP POLICY IF EXISTS "View active spark posts" ON public.spark_posts;
CREATE POLICY "View active spark posts"
ON public.spark_posts FOR SELECT
USING (status = 'ACTIVE');

DROP POLICY IF EXISTS "Users can create spark posts" ON public.spark_posts;
CREATE POLICY "Users can create spark posts"
ON public.spark_posts FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own spark posts" ON public.spark_posts;
CREATE POLICY "Users can update own spark posts"
ON public.spark_posts FOR UPDATE
TO authenticated
USING (author_id = auth.uid());

-- 3.11 Notifications policies
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

-- 3.12 Ticket Tiers (read-only for participants)
DROP POLICY IF EXISTS "Anyone can view active ticket tiers" ON public.ticket_tiers;
CREATE POLICY "Anyone can view active ticket tiers"
ON public.ticket_tiers FOR SELECT
USING (is_active = true);

-- 3.13 Badges policies
DROP POLICY IF EXISTS "Anyone can view badges" ON public.badges;
CREATE POLICY "Anyone can view badges"
ON public.badges FOR SELECT
USING (true);

-- =============================================
-- Phase 4: Enable Realtime
-- =============================================

-- Enable REPLICA IDENTITY for full row data
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.impact_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.circle_messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =============================================
-- Phase 5: Storage Policies for Avatars
-- =============================================

-- Policy for avatar uploads
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
);

-- Policy for avatar updates
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Policy for avatar deletes
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');