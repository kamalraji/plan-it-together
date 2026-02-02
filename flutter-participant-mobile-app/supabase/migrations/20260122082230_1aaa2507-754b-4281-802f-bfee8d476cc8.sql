-- =============================================
-- FOLLOWERS SYSTEM MIGRATION
-- Instagram/Twitter-style with Private Account Support
-- =============================================

-- Step 1: Drop existing connections tables (CAREFUL - DATA LOSS)
DROP TABLE IF EXISTS public.connections CASCADE;
DROP TABLE IF EXISTS public.connection_requests CASCADE;

-- Step 2: Create followers table
CREATE TABLE public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ACCEPTED' CHECK (status IN ('PENDING', 'ACCEPTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Step 3: Add is_private column to impact_profiles
ALTER TABLE public.impact_profiles
ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

-- Step 4: Create performance indexes
CREATE INDEX idx_followers_follower_accepted 
  ON public.followers(follower_id) 
  WHERE status = 'ACCEPTED';

CREATE INDEX idx_followers_following_accepted 
  ON public.followers(following_id) 
  WHERE status = 'ACCEPTED';

CREATE INDEX idx_followers_pending 
  ON public.followers(following_id, status) 
  WHERE status = 'PENDING';

CREATE INDEX idx_followers_created_at 
  ON public.followers(created_at DESC);

-- Step 5: Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies

-- Users can see their own follow relationships
CREATE POLICY "Users can view own follow relationships"
  ON public.followers FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Users can follow others
CREATE POLICY "Users can follow others"
  ON public.followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow (delete their own follows)
CREATE POLICY "Users can unfollow"
  ON public.followers FOR DELETE
  USING (auth.uid() = follower_id);

-- Users can remove their followers
CREATE POLICY "Users can remove followers"
  ON public.followers FOR DELETE
  USING (auth.uid() = following_id);

-- Users can accept/decline follow requests (update status)
CREATE POLICY "Users can respond to follow requests"
  ON public.followers FOR UPDATE
  USING (auth.uid() = following_id);

-- Step 7: Create notification trigger for new followers

CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    avatar_url,
    action_url,
    read
  )
  SELECT 
    NEW.following_id,
    CASE WHEN NEW.status = 'PENDING' THEN 'FOLLOW_REQUEST' ELSE 'NEW_FOLLOWER' END,
    CASE WHEN NEW.status = 'PENDING' 
      THEN (SELECT full_name FROM public.impact_profiles WHERE user_id = NEW.follower_id) || ' wants to follow you'
      ELSE (SELECT full_name FROM public.impact_profiles WHERE user_id = NEW.follower_id) || ' started following you'
    END,
    CASE WHEN NEW.status = 'PENDING' 
      THEN 'Tap to accept or decline' 
      ELSE 'Tap to view their profile' 
    END,
    (SELECT avatar_url FROM public.impact_profiles WHERE user_id = NEW.follower_id),
    '/profile/' || NEW.follower_id,
    false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_notify_new_follower ON public.followers;
CREATE TRIGGER trigger_notify_new_follower
  AFTER INSERT ON public.followers
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();

-- Step 8: Create notification trigger for accepted follow requests

CREATE OR REPLACE FUNCTION notify_follow_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'PENDING' AND NEW.status = 'ACCEPTED' THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      avatar_url,
      action_url,
      read
    )
    SELECT 
      NEW.follower_id,
      'FOLLOW_ACCEPTED',
      (SELECT full_name FROM public.impact_profiles WHERE user_id = NEW.following_id) || ' accepted your follow request',
      'You can now see their posts',
      (SELECT avatar_url FROM public.impact_profiles WHERE user_id = NEW.following_id),
      '/profile/' || NEW.following_id,
      false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_notify_follow_accepted ON public.followers;
CREATE TRIGGER trigger_notify_follow_accepted
  AFTER UPDATE ON public.followers
  FOR EACH ROW
  WHEN (OLD.status = 'PENDING' AND NEW.status = 'ACCEPTED')
  EXECUTE FUNCTION notify_follow_accepted();

-- Step 9: Helper functions

CREATE OR REPLACE FUNCTION get_follower_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.followers
    WHERE following_id = target_user_id
      AND status = 'ACCEPTED'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_following_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.followers
    WHERE follower_id = target_user_id
      AND status = 'ACCEPTED'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_following(follower UUID, target UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.followers
    WHERE follower_id = follower
      AND following_id = target
      AND status = 'ACCEPTED'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION are_mutual_followers(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    is_following(user_a, user_b) AND is_following(user_b, user_a)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Step 10: Grant permissions
GRANT ALL ON public.followers TO authenticated;
GRANT EXECUTE ON FUNCTION get_follower_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_following_count TO authenticated;
GRANT EXECUTE ON FUNCTION is_following TO authenticated;
GRANT EXECUTE ON FUNCTION are_mutual_followers TO authenticated;