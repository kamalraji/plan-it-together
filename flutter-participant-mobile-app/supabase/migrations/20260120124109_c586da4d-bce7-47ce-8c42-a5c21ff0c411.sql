-- Add missing columns to profile_visibility_settings
ALTER TABLE public.profile_visibility_settings 
ADD COLUMN IF NOT EXISTS show_activity_status boolean DEFAULT true;

-- Add additional search/discovery columns
ALTER TABLE public.profile_visibility_settings 
ADD COLUMN IF NOT EXISTS show_in_nearby boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_in_suggestions boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_messages_from text DEFAULT 'everyone',
ADD COLUMN IF NOT EXISTS show_social_links boolean DEFAULT true;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_visibility_user_id 
ON public.profile_visibility_settings(user_id);

-- Ensure RLS is enabled
ALTER TABLE public.profile_visibility_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own visibility settings" ON public.profile_visibility_settings;
DROP POLICY IF EXISTS "Users can insert own visibility settings" ON public.profile_visibility_settings;
DROP POLICY IF EXISTS "Users can update own visibility settings" ON public.profile_visibility_settings;

-- Create RLS policies
CREATE POLICY "Users can view own visibility settings" 
ON public.profile_visibility_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visibility settings" 
ON public.profile_visibility_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visibility settings" 
ON public.profile_visibility_settings 
FOR UPDATE 
USING (auth.uid() = user_id);