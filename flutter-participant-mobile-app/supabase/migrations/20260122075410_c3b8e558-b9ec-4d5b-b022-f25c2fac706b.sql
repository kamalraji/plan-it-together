-- =====================================================
-- SparkService Infrastructure Fixes
-- Adds missing RPC functions and enhances spark_comments
-- =====================================================

-- 1. Create increment_spark_count RPC (CRITICAL - currently missing)
CREATE OR REPLACE FUNCTION public.increment_spark_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.spark_posts 
  SET spark_count = spark_count + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create decrement_spark_count RPC (for un-spark support)
CREATE OR REPLACE FUNCTION public.decrement_spark_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.spark_posts 
  SET spark_count = GREATEST(0, spark_count - 1) 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Add missing columns to spark_comments for enhanced features
ALTER TABLE public.spark_comments 
ADD COLUMN IF NOT EXISTS author_name TEXT,
ADD COLUMN IF NOT EXISTS author_avatar TEXT,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.spark_comments(id),
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pinned_by UUID,
ADD COLUMN IF NOT EXISTS mentions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_author_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS author_badge TEXT;

-- 4. Performance indexes for comment queries
CREATE INDEX IF NOT EXISTS idx_spark_comments_parent ON public.spark_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_spark_comments_pinned ON public.spark_comments(post_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_spark_comments_post_created ON public.spark_comments(post_id, created_at DESC);

-- 5. Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.increment_spark_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_spark_count(UUID) TO authenticated;