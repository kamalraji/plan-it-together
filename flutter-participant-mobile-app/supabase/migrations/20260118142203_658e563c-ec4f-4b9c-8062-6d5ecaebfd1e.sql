-- Add media columns to spark_posts table
ALTER TABLE public.spark_posts 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS gif_url TEXT,
ADD COLUMN IF NOT EXISTS poll_id UUID REFERENCES public.vibe_games(id);

-- Add index for poll lookup
CREATE INDEX IF NOT EXISTS idx_spark_posts_poll_id ON public.spark_posts(poll_id) WHERE poll_id IS NOT NULL;