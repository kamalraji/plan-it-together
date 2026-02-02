-- =============================================
-- FEATURE 1: Comment Threads Enhancement
-- =============================================

-- Add threading support to spark_comments
ALTER TABLE spark_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES spark_comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS author_name TEXT,
ADD COLUMN IF NOT EXISTS author_avatar TEXT,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- Index for efficient thread queries
CREATE INDEX IF NOT EXISTS idx_spark_comments_parent ON spark_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_spark_comments_post ON spark_comments(post_id, created_at);

-- Function to increment comment count on spark_posts
CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE spark_posts 
  SET comment_count = COALESCE(comment_count, 0) + 1 
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for comment count
DROP TRIGGER IF EXISTS on_comment_insert ON spark_comments;
CREATE TRIGGER on_comment_insert
AFTER INSERT ON spark_comments
FOR EACH ROW EXECUTE FUNCTION increment_comment_count();

-- =============================================
-- FEATURE 2: Push Notifications Triggers
-- =============================================

-- Trigger function to notify on spark reactions
CREATE OR REPLACE FUNCTION notify_spark_reaction()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  reactor_name TEXT;
  reactor_avatar TEXT;
BEGIN
  -- Get the post author
  SELECT author_id INTO post_author_id FROM spark_posts WHERE id = NEW.post_id;
  
  -- Get reactor info
  SELECT full_name, avatar_url INTO reactor_name, reactor_avatar 
  FROM impact_profiles WHERE user_id = NEW.user_id;
  
  -- Don't notify if reacting to own post
  IF post_author_id IS NOT NULL AND post_author_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, avatar_url, action_url, category)
    VALUES (
      post_author_id,
      'SPARK_REACTION',
      COALESCE(reactor_name, 'Someone') || ' sparked your post',
      'Someone loved what you shared!',
      reactor_avatar,
      '/spark/' || NEW.post_id,
      'social'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger for spark reactions
DROP TRIGGER IF EXISTS on_spark_reaction_notify ON spark_reactions;
CREATE TRIGGER on_spark_reaction_notify
AFTER INSERT ON spark_reactions
FOR EACH ROW EXECUTE FUNCTION notify_spark_reaction();

-- Trigger function for high-match online alerts
CREATE OR REPLACE FUNCTION notify_high_match_online()
RETURNS TRIGGER AS $$
DECLARE
  connection_record RECORD;
BEGIN
  -- Only trigger when coming online (false -> true)
  IF OLD.is_online = FALSE AND NEW.is_online = TRUE THEN
    -- Find accepted connections with this user
    FOR connection_record IN
      SELECT c.requester_id, c.receiver_id, c.match_score
      FROM connections c
      WHERE c.status = 'ACCEPTED'
        AND (c.requester_id = NEW.user_id OR c.receiver_id = NEW.user_id)
        AND COALESCE(c.match_score, 0) >= 70
    LOOP
      -- Notify the other person
      IF connection_record.requester_id = NEW.user_id THEN
        INSERT INTO notifications (user_id, type, title, message, avatar_url, action_url, category)
        VALUES (
          connection_record.receiver_id,
          'HIGH_MATCH_ONLINE',
          NEW.full_name || ' is online!',
          'Your ' || COALESCE(connection_record.match_score, 0) || '% match just came online',
          NEW.avatar_url,
          '/profile/' || NEW.user_id,
          'social'
        );
      ELSE
        INSERT INTO notifications (user_id, type, title, message, avatar_url, action_url, category)
        VALUES (
          connection_record.requester_id,
          'HIGH_MATCH_ONLINE',
          NEW.full_name || ' is online!',
          'Your ' || COALESCE(connection_record.match_score, 0) || '% match just came online',
          NEW.avatar_url,
          '/profile/' || NEW.user_id,
          'social'
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger for high-match online
DROP TRIGGER IF EXISTS on_high_match_online_notify ON impact_profiles;
CREATE TRIGGER on_high_match_online_notify
AFTER UPDATE ON impact_profiles
FOR EACH ROW EXECUTE FUNCTION notify_high_match_online();

-- =============================================
-- FEATURE 3: Discover People Daily Picks
-- =============================================

-- Create daily_discovers table
CREATE TABLE IF NOT EXISTS public.daily_discovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  discovered_user_id UUID NOT NULL,
  match_score INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  viewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, discovered_user_id, date)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_daily_discovers_user_date 
ON daily_discovers(user_id, date);

-- Enable RLS
ALTER TABLE daily_discovers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own daily discovers" ON daily_discovers;
CREATE POLICY "Users can view own daily discovers"
ON daily_discovers FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily discovers" ON daily_discovers;
CREATE POLICY "Users can insert own daily discovers"
ON daily_discovers FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily discovers" ON daily_discovers;
CREATE POLICY "Users can update own daily discovers"
ON daily_discovers FOR UPDATE
USING (auth.uid() = user_id);