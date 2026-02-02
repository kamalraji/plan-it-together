-- Create table for tracking post shares
CREATE TABLE public.post_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  sharer_id UUID NOT NULL,
  destination_type TEXT NOT NULL, -- 'dm', 'group', 'channel', 'external'
  destination_id TEXT, -- nullable for external shares
  destination_name TEXT, -- cached name for analytics
  platform TEXT, -- 'twitter', 'linkedin', 'whatsapp', 'telegram', 'copy_link', 'native_share', 'in_app'
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups by post
CREATE INDEX idx_post_shares_post_id ON public.post_shares(post_id);
CREATE INDEX idx_post_shares_sharer_id ON public.post_shares(sharer_id);
CREATE INDEX idx_post_shares_shared_at ON public.post_shares(shared_at DESC);

-- Create composite index for analytics queries
CREATE INDEX idx_post_shares_analytics ON public.post_shares(post_id, destination_type, platform);

-- Add share_count column to spark_posts for denormalized quick access
ALTER TABLE public.spark_posts ADD COLUMN IF NOT EXISTS share_count INTEGER NOT NULL DEFAULT 0;

-- Create function to increment share count
CREATE OR REPLACE FUNCTION public.increment_post_share_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.spark_posts 
  SET share_count = share_count + 1 
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-increment share count
CREATE TRIGGER trigger_increment_share_count
AFTER INSERT ON public.post_shares
FOR EACH ROW
EXECUTE FUNCTION public.increment_post_share_count();

-- Enable RLS
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

-- Users can view their own shares
CREATE POLICY "Users can view their own shares"
ON public.post_shares
FOR SELECT
USING (auth.uid() = sharer_id);

-- Post authors can view all shares of their posts
CREATE POLICY "Authors can view shares of their posts"
ON public.post_shares
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.spark_posts 
    WHERE spark_posts.id = post_shares.post_id 
    AND spark_posts.author_id = auth.uid()
  )
);

-- Users can insert their own shares
CREATE POLICY "Users can create shares"
ON public.post_shares
FOR INSERT
WITH CHECK (auth.uid() = sharer_id);