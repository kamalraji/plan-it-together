-- =====================================================
-- PHASE 10: A/B TESTING FRAMEWORK & PRIVACY CONTROLS
-- =====================================================

-- 1. A/B Test Experiments Table
CREATE TABLE IF NOT EXISTS public.ai_matching_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Experiment configuration
  experiment_type TEXT NOT NULL DEFAULT 'matching_algorithm',
  variants JSONB NOT NULL DEFAULT '[]'::JSONB,
  traffic_allocation JSONB NOT NULL DEFAULT '{"control": 50, "variant": 50}'::JSONB,
  
  -- Targeting
  target_audience TEXT DEFAULT 'all', -- 'all', 'new_users', 'premium', 'specific_events'
  target_config JSONB DEFAULT '{}'::JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Results
  winner_variant TEXT,
  results_summary JSONB,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. User experiment assignments
CREATE TABLE IF NOT EXISTS public.ai_experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  experiment_id UUID NOT NULL REFERENCES ai_matching_experiments(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, experiment_id)
);

CREATE INDEX idx_experiment_assignments_user ON public.ai_experiment_assignments(user_id);
CREATE INDEX idx_experiment_assignments_experiment ON public.ai_experiment_assignments(experiment_id, variant);

-- 3. AI Matching Privacy Settings
CREATE TABLE IF NOT EXISTS public.ai_matching_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  
  -- Core privacy controls
  ai_matching_enabled BOOLEAN DEFAULT true,
  show_in_recommendations BOOLEAN DEFAULT true,
  allow_ai_insights BOOLEAN DEFAULT true,
  
  -- Visibility controls
  hide_from_users TEXT[] DEFAULT '{}', -- Specific user IDs to hide from
  only_show_to_mutual_interests BOOLEAN DEFAULT false,
  
  -- Data controls
  include_bio_in_matching BOOLEAN DEFAULT true,
  include_skills_in_matching BOOLEAN DEFAULT true,
  include_interests_in_matching BOOLEAN DEFAULT true,
  include_activity_in_matching BOOLEAN DEFAULT true,
  
  -- Consent tracking
  consent_given_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_privacy_enabled ON public.ai_matching_privacy_settings(user_id) WHERE ai_matching_enabled = true;

-- Enable RLS
ALTER TABLE public.ai_matching_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_matching_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Experiments: Admin only for management, users can view active
CREATE POLICY "Admins manage experiments"
ON public.ai_matching_experiments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view running experiments"
ON public.ai_matching_experiments FOR SELECT
TO authenticated
USING (status = 'running');

-- Assignments: Users see their own
CREATE POLICY "Users view own experiment assignments"
ON public.ai_experiment_assignments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System manages assignments"
ON public.ai_experiment_assignments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Privacy: Users manage their own settings
CREATE POLICY "Users manage own privacy settings"
ON public.ai_matching_privacy_settings FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Function to get user's experiment variant
CREATE OR REPLACE FUNCTION public.get_user_experiment_variant(
  target_user_id UUID,
  experiment_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exp_record RECORD;
  existing_variant TEXT;
  new_variant TEXT;
  random_val NUMERIC;
  cumulative_pct NUMERIC := 0;
  variant_key TEXT;
  variant_pct NUMERIC;
BEGIN
  -- Get the experiment
  SELECT * INTO exp_record
  FROM ai_matching_experiments
  WHERE name = experiment_name AND status = 'running'
  LIMIT 1;
  
  IF exp_record IS NULL THEN
    RETURN 'control'; -- Default to control if no experiment
  END IF;
  
  -- Check for existing assignment
  SELECT variant INTO existing_variant
  FROM ai_experiment_assignments
  WHERE user_id = target_user_id AND experiment_id = exp_record.id;
  
  IF existing_variant IS NOT NULL THEN
    RETURN existing_variant;
  END IF;
  
  -- Assign new variant based on traffic allocation
  random_val := random() * 100;
  
  FOR variant_key, variant_pct IN SELECT * FROM jsonb_each_text(exp_record.traffic_allocation)
  LOOP
    cumulative_pct := cumulative_pct + variant_pct::NUMERIC;
    IF random_val <= cumulative_pct THEN
      new_variant := variant_key;
      EXIT;
    END IF;
  END LOOP;
  
  new_variant := COALESCE(new_variant, 'control');
  
  -- Save assignment
  INSERT INTO ai_experiment_assignments (user_id, experiment_id, variant)
  VALUES (target_user_id, exp_record.id, new_variant)
  ON CONFLICT (user_id, experiment_id) DO NOTHING;
  
  RETURN new_variant;
END;
$$;

-- 5. Function to check if user is eligible for AI matching
CREATE OR REPLACE FUNCTION public.check_ai_matching_eligibility(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  privacy_settings RECORD;
  result JSONB;
BEGIN
  SELECT * INTO privacy_settings
  FROM ai_matching_privacy_settings
  WHERE user_id = target_user_id;
  
  IF privacy_settings IS NULL THEN
    -- Default: fully eligible
    RETURN jsonb_build_object(
      'eligible', true,
      'show_in_recommendations', true,
      'allow_insights', true,
      'data_sources', jsonb_build_object(
        'bio', true,
        'skills', true,
        'interests', true,
        'activity', true
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'eligible', privacy_settings.ai_matching_enabled,
    'show_in_recommendations', privacy_settings.show_in_recommendations,
    'allow_insights', privacy_settings.allow_ai_insights,
    'hidden_from', privacy_settings.hide_from_users,
    'mutual_only', privacy_settings.only_show_to_mutual_interests,
    'data_sources', jsonb_build_object(
      'bio', privacy_settings.include_bio_in_matching,
      'skills', privacy_settings.include_skills_in_matching,
      'interests', privacy_settings.include_interests_in_matching,
      'activity', privacy_settings.include_activity_in_matching
    )
  );
END;
$$;

-- 6. Function to get privacy-filtered match candidates
CREATE OR REPLACE FUNCTION public.get_privacy_filtered_candidates(
  requesting_user_id UUID,
  candidate_ids UUID[]
)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  filtered_ids UUID[];
BEGIN
  SELECT array_agg(c.id)
  INTO filtered_ids
  FROM unnest(candidate_ids) AS c(id)
  LEFT JOIN ai_matching_privacy_settings ps ON c.id = ps.user_id
  WHERE 
    -- User has AI matching enabled (or no settings = enabled)
    (ps.user_id IS NULL OR ps.ai_matching_enabled = true)
    -- User allows being shown in recommendations
    AND (ps.user_id IS NULL OR ps.show_in_recommendations = true)
    -- Requesting user is not in hide list
    AND (ps.user_id IS NULL OR NOT (requesting_user_id = ANY(ps.hide_from_users)))
    -- Handle mutual interests requirement
    AND (
      ps.user_id IS NULL 
      OR ps.only_show_to_mutual_interests = false
      OR EXISTS (
        SELECT 1 FROM user_follows uf1
        JOIN user_follows uf2 ON uf1.follower_id = uf2.following_id AND uf1.following_id = uf2.follower_id
        WHERE uf1.follower_id = requesting_user_id AND uf1.following_id = c.id
      )
    );
  
  RETURN COALESCE(filtered_ids, '{}'::UUID[]);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_experiment_variant(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_ai_matching_eligibility(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_privacy_filtered_candidates(UUID, UUID[]) TO authenticated;