-- Migration: Add link_url column to spark_posts
-- Description: Support link preview posts
-- Date: 2026-01-21

ALTER TABLE public.spark_posts 
ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Add documentation comment
COMMENT ON COLUMN public.spark_posts.link_url IS 'URL for link preview posts';