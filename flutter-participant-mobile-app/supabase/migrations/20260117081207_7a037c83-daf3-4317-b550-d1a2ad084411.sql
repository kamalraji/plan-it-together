-- Add cover_image_url to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Create saved_events table
CREATE TABLE public.saved_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_events
CREATE POLICY "Users can view own saved events" ON public.saved_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved events" ON public.saved_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved events" ON public.saved_events
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own saved events" ON public.saved_events
  FOR UPDATE USING (auth.uid() = user_id);