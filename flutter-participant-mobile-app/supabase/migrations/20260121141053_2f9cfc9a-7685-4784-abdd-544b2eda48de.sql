-- Add missing columns to user_profiles table for profile features
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS cover_gradient_id text,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';