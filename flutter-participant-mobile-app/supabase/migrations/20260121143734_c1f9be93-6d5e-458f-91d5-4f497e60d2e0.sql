-- Create profile_change_history table to track profile changes
CREATE TABLE public.profile_change_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_profile_change_history_user_id ON public.profile_change_history(user_id);
CREATE INDEX idx_profile_change_history_field_name ON public.profile_change_history(field_name);
CREATE INDEX idx_profile_change_history_changed_at ON public.profile_change_history(changed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.profile_change_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own change history
CREATE POLICY "Users can view their own change history" 
ON public.profile_change_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own change history (via service)
CREATE POLICY "Users can insert their own change history" 
ON public.profile_change_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE public.profile_change_history IS 'Tracks changes to user profiles including usernames, avatars, and other fields';