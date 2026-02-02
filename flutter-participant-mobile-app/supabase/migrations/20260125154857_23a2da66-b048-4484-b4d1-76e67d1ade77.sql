-- =====================================================
-- Phase 5: Session Materials Table + Missing Functions
-- =====================================================

-- Session Materials (only if not exists)
CREATE TABLE IF NOT EXISTS public.session_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT,
  download_count INT DEFAULT 0,
  is_downloadable BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes (IF NOT EXISTS for safety)
CREATE INDEX IF NOT EXISTS idx_session_materials_session ON public.session_materials(session_id);
CREATE INDEX IF NOT EXISTS idx_session_materials_event ON public.session_materials(event_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_session_materials_updated_at ON public.session_materials;
CREATE TRIGGER update_session_materials_updated_at
  BEFORE UPDATE ON public.session_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.session_materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can view session materials" ON public.session_materials;
DROP POLICY IF EXISTS "Organizers can manage session materials" ON public.session_materials;

-- RLS Policies
CREATE POLICY "Authenticated users can view session materials"
ON public.session_materials FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Organizers can manage session materials"
ON public.session_materials FOR ALL
TO authenticated
USING (public.can_manage_zone_content(event_id))
WITH CHECK (public.can_manage_zone_content(event_id));

-- Helper function for download count
CREATE OR REPLACE FUNCTION public.increment_material_download(p_material_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE session_materials
  SET download_count = download_count + 1
  WHERE id = p_material_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_material_download TO authenticated;

-- Helper function for streak update (IF NOT EXISTS pattern)
CREATE OR REPLACE FUNCTION public.update_icebreaker_streak(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_streak RECORD;
  v_new_streak INT;
BEGIN
  SELECT * INTO v_streak
  FROM event_icebreaker_streaks
  WHERE event_id = p_event_id AND user_id = p_user_id;
  
  IF v_streak IS NULL THEN
    INSERT INTO event_icebreaker_streaks (event_id, user_id, current_streak, longest_streak, last_answered_date)
    VALUES (p_event_id, p_user_id, 1, 1, v_today);
    RETURN 1;
  END IF;
  
  IF v_streak.last_answered_date = v_today THEN
    RETURN v_streak.current_streak;
  END IF;
  
  IF v_streak.last_answered_date = v_today - INTERVAL '1 day' THEN
    v_new_streak := v_streak.current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;
  
  UPDATE event_icebreaker_streaks
  SET 
    current_streak = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    last_answered_date = v_today
  WHERE event_id = p_event_id AND user_id = p_user_id;
  
  RETURN v_new_streak;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_icebreaker_streak TO authenticated;