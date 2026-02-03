-- Create article_ratings table for knowledge base article feedback
CREATE TABLE IF NOT EXISTS public.article_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(article_id, user_id)
);

-- Enable RLS
ALTER TABLE public.article_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can view article ratings (for aggregation)
CREATE POLICY "Anyone can view article ratings"
ON public.article_ratings FOR SELECT TO public
USING (true);

-- Authenticated users can rate articles
CREATE POLICY "Authenticated users can rate articles"
ON public.article_ratings FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own ratings
CREATE POLICY "Users can update own ratings"
ON public.article_ratings FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete own ratings"
ON public.article_ratings FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_article_ratings_article ON public.article_ratings(article_id);
CREATE INDEX IF NOT EXISTS idx_article_ratings_user ON public.article_ratings(user_id);