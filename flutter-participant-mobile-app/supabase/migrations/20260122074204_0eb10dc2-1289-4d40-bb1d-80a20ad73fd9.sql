-- =============================================
-- COMMENT SYSTEM ENHANCEMENTS
-- Adds tables for likes, reactions, reports and atomic toggle function
-- =============================================

-- Add enhanced columns to spark_comments (if not already present)
ALTER TABLE public.spark_comments ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
ALTER TABLE public.spark_comments ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE public.spark_comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.spark_comments ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.spark_comments ADD COLUMN IF NOT EXISTS pinned_by UUID;
ALTER TABLE public.spark_comments ADD COLUMN IF NOT EXISTS mentions TEXT[] DEFAULT '{}';

-- Comment likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.spark_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Comment reactions table
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.spark_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id, emoji)
);

-- Comment reports table
CREATE TABLE IF NOT EXISTS public.comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.spark_comments(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON public.comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON public.comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_pinned ON public.spark_comments(post_id, is_pinned);

-- Atomic toggle like RPC function
CREATE OR REPLACE FUNCTION public.toggle_comment_like(p_comment_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing UUID;
  v_new_count INT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  SELECT id INTO v_existing FROM public.comment_likes 
  WHERE comment_id = p_comment_id AND user_id = v_user_id;
  
  IF v_existing IS NOT NULL THEN
    DELETE FROM public.comment_likes WHERE id = v_existing;
    UPDATE public.spark_comments SET like_count = GREATEST(0, like_count - 1) 
    WHERE id = p_comment_id RETURNING like_count INTO v_new_count;
    RETURN json_build_object('liked', false, 'count', COALESCE(v_new_count, 0));
  ELSE
    INSERT INTO public.comment_likes (comment_id, user_id) VALUES (p_comment_id, v_user_id);
    UPDATE public.spark_comments SET like_count = COALESCE(like_count, 0) + 1 
    WHERE id = p_comment_id RETURNING like_count INTO v_new_count;
    RETURN json_build_object('liked', true, 'count', COALESCE(v_new_count, 1));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Increment/decrement helpers for fallback
CREATE OR REPLACE FUNCTION public.increment_comment_like_count(p_comment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.spark_comments SET like_count = COALESCE(like_count, 0) + 1 WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.decrement_comment_like_count(p_comment_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.spark_comments SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1) WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS Policies
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;

-- Comment likes policies
CREATE POLICY "Users can view all comment likes" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Comment reactions policies
CREATE POLICY "Users can view all reactions" ON public.comment_reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert own reactions" ON public.comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- Comment reports policies
CREATE POLICY "Users can insert reports" ON public.comment_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON public.comment_reports FOR SELECT USING (auth.uid() = reporter_id);