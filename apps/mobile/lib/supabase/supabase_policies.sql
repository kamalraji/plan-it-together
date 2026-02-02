-- =============================================
-- ROW LEVEL SECURITY POLICIES (Production Reference)
-- Last Updated: 2026-01-15
-- =============================================
-- This file contains all RLS policies for the application.
-- These policies are already applied in Supabase.

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

-- Core Tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Impact Hub Tables
ALTER TABLE public.impact_profiles ENABLE ROW LEVEL SECURITY;
-- NOTE: public.connections is DEPRECATED - use public.followers instead
-- ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;  -- Legacy, see followers_migration.sql
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;  -- New follower system
ALTER TABLE public.profile_skips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spark_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spark_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spark_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vibe_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_audience ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CORE TABLE POLICIES
-- =============================================

-- Organizations Policies
CREATE POLICY "Allow authenticated users to view organizations"
  ON public.organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert organizations"
  ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update organizations"
  ON public.organizations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete organizations"
  ON public.organizations FOR DELETE TO authenticated USING (true);

-- User Profiles Policies
CREATE POLICY "Allow users to view all profiles"
  ON public.user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow users to insert own profile"
  ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update own profile"
  ON public.user_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete own profile"
  ON public.user_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Events Policies
CREATE POLICY "Allow everyone to view published events"
  ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert events"
  ON public.events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update events"
  ON public.events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete events"
  ON public.events FOR DELETE TO authenticated USING (true);

-- Ticket Tiers Policies
CREATE POLICY "Allow everyone to view ticket tiers"
  ON public.ticket_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert ticket tiers"
  ON public.ticket_tiers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update ticket tiers"
  ON public.ticket_tiers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete ticket tiers"
  ON public.ticket_tiers FOR DELETE TO authenticated USING (true);

-- Registrations Policies
CREATE POLICY "Allow users to view own registrations"
  ON public.registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to create registrations"
  ON public.registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update own registrations"
  ON public.registrations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to delete own registrations"
  ON public.registrations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- IMPACT HUB POLICIES
-- =============================================

-- Impact Profiles Policies
CREATE POLICY "Users can view all impact profiles"
  ON public.impact_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own impact profile"
  ON public.impact_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own impact profile"
  ON public.impact_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own impact profile"
  ON public.impact_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- FOLLOWERS POLICIES (replaces deprecated Connections)
-- =============================================
-- NOTE: The old "connections" table is DEPRECATED.
-- All new code should use the "followers" table with unidirectional follows.
-- See lib/supabase/followers_migration.sql for the migration script.

-- @deprecated Legacy Connections Policies - DO NOT USE for new code
-- These policies are kept for backwards compatibility only
-- CREATE POLICY "Users can view own connections" ON public.connections ...
-- CREATE POLICY "Users can create connection requests" ON public.connections ...
-- CREATE POLICY "Receiver can update connection status" ON public.connections ...
-- CREATE POLICY "Requester can delete pending connections" ON public.connections ...

-- Followers Table Policies (Current System)
CREATE POLICY "Users can view followers"
  ON public.followers FOR SELECT TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);
CREATE POLICY "Users can follow others"
  ON public.followers FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = follower_id AND follower_id != following_id);
CREATE POLICY "Users can unfollow"
  ON public.followers FOR DELETE TO authenticated 
  USING (auth.uid() = follower_id);
CREATE POLICY "Target can accept/decline follow requests"
  ON public.followers FOR UPDATE TO authenticated 
  USING (auth.uid() = following_id);

-- Profile Skips Policies
CREATE POLICY "Users can view own skips"
  ON public.profile_skips FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skips"
  ON public.profile_skips FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own skips"
  ON public.profile_skips FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Saved Profiles Policies
CREATE POLICY "Users can view own saved profiles"
  ON public.saved_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved profiles"
  ON public.saved_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved profiles"
  ON public.saved_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- CIRCLES POLICIES
-- =============================================

-- Circles Policies
CREATE POLICY "Users can view public circles"
  ON public.circles FOR SELECT TO authenticated 
  USING (is_public = true OR created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.circle_members WHERE circle_id = id AND user_id = auth.uid()
  ));
CREATE POLICY "Users can create circles"
  ON public.circles FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Circle creator can update"
  ON public.circles FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Circle creator can delete"
  ON public.circles FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Circle Members Policies
CREATE POLICY "Members can view circle members"
  ON public.circle_members FOR SELECT TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM public.circle_members cm WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.circles c WHERE c.id = circle_id AND c.is_public = true)
  );
CREATE POLICY "Users can join public circles"
  ON public.circle_members FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.circles c WHERE c.id = circle_id AND c.is_public = true
  ));
CREATE POLICY "Users can leave circles"
  ON public.circle_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Circle Messages Policies
CREATE POLICY "Members can view circle messages"
  ON public.circle_messages FOR SELECT TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM public.circle_members WHERE circle_id = circle_messages.circle_id AND user_id = auth.uid()
  ));
CREATE POLICY "Members can send circle messages"
  ON public.circle_messages FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.circle_members WHERE circle_id = circle_messages.circle_id AND user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own messages"
  ON public.circle_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- SPARK BOARD POLICIES
-- =============================================

-- Spark Posts Policies
CREATE POLICY "Users can view all spark posts"
  ON public.spark_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create spark posts"
  ON public.spark_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts"
  ON public.spark_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own posts"
  ON public.spark_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Spark Reactions Policies
CREATE POLICY "Users can view all reactions"
  ON public.spark_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add reactions"
  ON public.spark_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions"
  ON public.spark_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Spark Comments Policies
CREATE POLICY "Users can view all comments"
  ON public.spark_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add comments"
  ON public.spark_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments"
  ON public.spark_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- VIBE & GAMIFICATION POLICIES
-- =============================================

-- Badges Policies (public read)
CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT TO authenticated USING (true);

-- User Badges Policies
CREATE POLICY "Users can view all user badges"
  ON public.user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can award badges"
  ON public.user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Vibe Games Policies
CREATE POLICY "Users can view all games"
  ON public.vibe_games FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create games"
  ON public.vibe_games FOR INSERT TO authenticated WITH CHECK (true);

-- Vibe Responses Policies
CREATE POLICY "Users can view all responses"
  ON public.vibe_responses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can submit responses"
  ON public.vibe_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trivia Responses Policies
CREATE POLICY "Users can view own trivia responses"
  ON public.trivia_responses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can submit trivia responses"
  ON public.trivia_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Impact Leaderboard Policies
CREATE POLICY "Users can view leaderboard"
  ON public.impact_leaderboard FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own leaderboard entry"
  ON public.impact_leaderboard FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own score"
  ON public.impact_leaderboard FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- SPACES POLICIES
-- =============================================

-- Spaces Policies
CREATE POLICY "Users can view all spaces"
  ON public.spaces FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create spaces"
  ON public.spaces FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update space"
  ON public.spaces FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete space"
  ON public.spaces FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Space Speakers Policies
CREATE POLICY "Users can view space speakers"
  ON public.space_speakers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join as speaker"
  ON public.space_speakers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own speaker status"
  ON public.space_speakers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can leave as speaker"
  ON public.space_speakers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Space Audience Policies
CREATE POLICY "Users can view space audience"
  ON public.space_audience FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join as audience"
  ON public.space_audience FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave as audience"
  ON public.space_audience FOR DELETE TO authenticated USING (auth.uid() = user_id);
