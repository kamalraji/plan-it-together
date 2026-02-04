-- =============================================
-- IMPACT HUB TABLES SCHEMA (Production Reference)
-- Last Updated: 2026-01-15
-- =============================================
-- This file contains all Impact Hub feature tables.
-- These tables are already created in Supabase.

-- =============================================
-- PHASE 1: IMPACT PROFILES & CONNECTIONS
-- =============================================

-- Impact Profiles Table
CREATE TABLE IF NOT EXISTS public.impact_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  organization TEXT,
  headline TEXT NOT NULL DEFAULT '',
  looking_for TEXT[] NOT NULL DEFAULT '{}',
  interests TEXT[] NOT NULL DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  relationship_status TEXT NOT NULL DEFAULT 'OPEN_TO_CONNECT',
  education_status TEXT NOT NULL DEFAULT 'PROFESSIONAL',
  impact_score INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  badges TEXT[] NOT NULL DEFAULT '{}',
  vibe_emoji TEXT NOT NULL DEFAULT '🚀',
  current_event_id UUID,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- DEPRECATED: Connections Table
-- This table has been replaced by the "followers" table.
-- See lib/supabase/followers_migration.sql for the new schema.
-- The code below is kept for reference only - DO NOT USE.
-- =============================================
-- CREATE TABLE IF NOT EXISTS public.connections (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
--   connection_type TEXT NOT NULL DEFAULT 'NETWORKING',
--   match_score INTEGER DEFAULT 0,
--   message TEXT,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
--   responded_at TIMESTAMPTZ,
--   UNIQUE(requester_id, receiver_id)
-- );
--
-- NEW: See followers_migration.sql for the followers table schema:
-- public.followers (follower_id, following_id, status, created_at, accepted_at)

-- Profile Skips Table
CREATE TABLE IF NOT EXISTS public.profile_skips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skipped_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, skipped_user_id)
);

-- Saved Profiles Table
CREATE TABLE IF NOT EXISTS public.saved_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, saved_user_id)
);

-- =============================================
-- PHASE 2: CIRCLES (GROUP NETWORKING)
-- =============================================

-- Circles Table
CREATE TABLE IF NOT EXISTS public.circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '👥',
  type TEXT NOT NULL DEFAULT 'USER_CREATED',
  category TEXT NOT NULL DEFAULT 'INTEREST',
  member_count INTEGER NOT NULL DEFAULT 0,
  is_private BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  max_members INTEGER,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Circle Members Table
CREATE TABLE IF NOT EXISTS public.circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

-- Circle Messages Table
CREATE TABLE IF NOT EXISTS public.circle_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update member_count trigger
CREATE OR REPLACE FUNCTION public.update_circle_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.circles SET member_count = member_count + 1 WHERE id = NEW.circle_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.circles SET member_count = member_count - 1 WHERE id = OLD.circle_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_circle_member_count ON public.circle_members;
CREATE TRIGGER trigger_update_circle_member_count
  AFTER INSERT OR DELETE ON public.circle_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_circle_member_count();

-- =============================================
-- PHASE 3: SPARK BOARD (MICRO-CONTENT)
-- =============================================

-- Spark Posts Table
CREATE TABLE IF NOT EXISTS public.spark_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  author_avatar TEXT,
  type TEXT NOT NULL CHECK (type IN ('IDEA', 'SEEKING', 'OFFERING', 'QUESTION', 'ANNOUNCEMENT')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  spark_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Spark Reactions Table
CREATE TABLE IF NOT EXISTS public.spark_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.spark_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'SPARK',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, type)
);

-- Spark Comments Table
CREATE TABLE IF NOT EXISTS public.spark_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.spark_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RPC Function: increment_spark_count
CREATE OR REPLACE FUNCTION public.increment_spark_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.spark_posts 
  SET spark_count = spark_count + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- PHASE 4: VIBE & GAMIFICATION
-- =============================================

-- Badges Table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('NETWORKING', 'COMMUNITY', 'CONTRIBUTION', 'SPECIAL')),
  points_required INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'COMMON' CHECK (rarity IN ('COMMON', 'RARE', 'EPIC', 'LEGENDARY'))
);

-- User Badges Table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Vibe Games Table
CREATE TABLE IF NOT EXISTS public.vibe_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('QUICK_MATCH', 'TRIVIA', 'ICEBREAKER', 'POLL')),
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER,
  expires_at TIMESTAMPTZ NOT NULL,
  participant_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vibe Responses Table
CREATE TABLE IF NOT EXISTS public.vibe_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.vibe_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response INTEGER NOT NULL,
  option_index INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- Trivia Responses Table
CREATE TABLE IF NOT EXISTS public.trivia_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.vibe_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- Impact Leaderboard Table
CREATE TABLE IF NOT EXISTS public.impact_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID,
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- =============================================
-- PHASE 5: SPACES (AUDIO ROOMS)
-- =============================================

-- Spaces Table
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_live BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Space Speakers Table
CREATE TABLE IF NOT EXISTS public.space_speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_muted BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(space_id, user_id)
);

-- Space Audience Table
CREATE TABLE IF NOT EXISTS public.space_audience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(space_id, user_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_impact_profiles_user ON public.impact_profiles(user_id);
-- DEPRECATED: connections table removed - see followers_migration.sql
-- CREATE INDEX IF NOT EXISTS idx_connections_requester ON public.connections(requester_id);
-- CREATE INDEX IF NOT EXISTS idx_connections_receiver ON public.connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_circles_event ON public.circles(event_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON public.circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_messages_circle ON public.circle_messages(circle_id);
CREATE INDEX IF NOT EXISTS idx_spark_posts_author ON public.spark_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_spark_posts_event ON public.spark_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_spark_reactions_post ON public.spark_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_spark_comments_post ON public.spark_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_vibe_games_event ON public.vibe_games(event_id);
CREATE INDEX IF NOT EXISTS idx_spaces_created_by ON public.spaces(created_by);

-- =============================================
-- SEED DATA: DEFAULT BADGES
-- =============================================
INSERT INTO public.badges (name, description, icon, category, points_required, rarity) VALUES
  ('Friendly Networker', 'Build relationships with 5 participants', '🤝', 'NETWORKING', 50, 'COMMON'),
  ('Spark Starter', 'Create your first Spark post', '✨', 'CONTRIBUTION', 10, 'COMMON'),
  ('Quiz Whiz', 'Answer a trivia correctly', '🧠', 'SPECIAL', 25, 'RARE'),
  ('Social Butterfly', 'Join 10 circles', '🦋', 'COMMUNITY', 100, 'RARE'),
  ('Influencer', 'Get 100 sparks on posts', '🌟', 'CONTRIBUTION', 500, 'EPIC'),
  ('Event Champion', 'Attend 10 events', '🏆', 'SPECIAL', 1000, 'LEGENDARY')
ON CONFLICT DO NOTHING;
