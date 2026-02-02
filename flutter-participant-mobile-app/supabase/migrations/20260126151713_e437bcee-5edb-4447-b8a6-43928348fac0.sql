-- Create material download analytics table for rich tracking
CREATE TABLE public.material_download_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES session_materials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_id UUID NOT NULL,
  session_id UUID,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_country TEXT,
  referrer TEXT,
  device_type TEXT -- 'mobile', 'tablet', 'desktop'
);

-- Indexes for analytics queries
CREATE INDEX idx_material_analytics_material ON material_download_analytics(material_id);
CREATE INDEX idx_material_analytics_event ON material_download_analytics(event_id);
CREATE INDEX idx_material_analytics_user ON material_download_analytics(user_id);
CREATE INDEX idx_material_analytics_time ON material_download_analytics(downloaded_at DESC);
CREATE INDEX idx_material_analytics_device ON material_download_analytics(device_type);

-- Enable RLS
ALTER TABLE public.material_download_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own download history
CREATE POLICY "Users can view own downloads"
ON public.material_download_analytics
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Organizers/Admins can view all downloads for their events
CREATE POLICY "Organizers can view event downloads"
ON public.material_download_analytics
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'organizer')
);

-- Service role can insert (edge function uses service role)
-- INSERT is implicitly allowed for service_role, no policy needed

-- Add comment for documentation
COMMENT ON TABLE public.material_download_analytics IS 'Rich analytics for session material downloads';