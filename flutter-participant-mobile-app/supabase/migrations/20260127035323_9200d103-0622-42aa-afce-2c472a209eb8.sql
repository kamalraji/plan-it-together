-- =============================================
-- Fix vector dimension mismatch in get_embedding_similarities
-- =============================================
CREATE OR REPLACE FUNCTION public.get_embedding_similarities(
  query_user_id UUID,
  candidate_ids UUID[]
)
RETURNS TABLE(user_id UUID, similarity FLOAT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  query_embedding vector(128);
BEGIN
  SELECT pe.user_embedding INTO query_embedding
  FROM profile_embeddings pe
  WHERE pe.user_id = query_user_id;
  
  IF query_embedding IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    pe.user_id,
    GREATEST(0, LEAST(100, 100.0 * (1.0 - (pe.user_embedding <=> query_embedding) / 2.0)))::FLOAT as similarity
  FROM profile_embeddings pe
  WHERE pe.user_id = ANY(candidate_ids)
    AND pe.user_embedding IS NOT NULL;
END;
$$;

-- =============================================
-- New Table: ai_match_impressions
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_match_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  experiment_id UUID REFERENCES ai_matching_experiments(id),
  variant TEXT,
  context TEXT NOT NULL,
  event_id UUID,
  match_user_ids UUID[] NOT NULL,
  match_scores INT[] NOT NULL,
  avg_score FLOAT NOT NULL,
  weights_config JSONB NOT NULL,
  processing_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_match_impressions_user ON ai_match_impressions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_impressions_experiment ON ai_match_impressions(experiment_id, variant);

-- Enable RLS
ALTER TABLE public.ai_match_impressions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own impressions"
ON public.ai_match_impressions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert impressions"
ON public.ai_match_impressions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all impressions"
ON public.ai_match_impressions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- New RPC: get_experiment_weights
-- =============================================
CREATE OR REPLACE FUNCTION public.get_experiment_weights(
  target_user_id UUID,
  context TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exp_name TEXT;
  variant TEXT;
  exp_record RECORD;
  variant_config JSONB;
BEGIN
  -- Determine experiment name based on context
  exp_name := CASE context 
    WHEN 'zone' THEN 'zone_weights_v1'
    ELSE 'pulse_weights_v1'
  END;
  
  -- Get user's variant assignment
  variant := public.get_user_experiment_variant(target_user_id, exp_name);
  
  -- Get experiment config
  SELECT * INTO exp_record
  FROM ai_matching_experiments
  WHERE name = exp_name AND status = 'running';
  
  IF exp_record IS NULL THEN
    -- Return default weights when no experiment running
    RETURN jsonb_build_object(
      'experiment_id', NULL,
      'variant', 'control',
      'weights', CASE context
        WHEN 'zone' THEN '{"embedding":0.25,"behavioral":0.15,"overlap":0.20,"session":0.30,"freshness":0.10}'
        ELSE '{"embedding":0.40,"behavioral":0.30,"overlap":0.20,"session":0.00,"freshness":0.10}'
      END::JSONB
    );
  END IF;
  
  -- Extract variant weights from experiment config
  variant_config := exp_record.variants->variant->'weights';
  
  RETURN jsonb_build_object(
    'experiment_id', exp_record.id,
    'variant', variant,
    'weights', COALESCE(variant_config, '{"embedding":0.40,"behavioral":0.30,"overlap":0.20,"session":0.00,"freshness":0.10}'::JSONB)
  );
END;
$$;

-- =============================================
-- Add unique constraint on experiment name for future upserts
-- =============================================
ALTER TABLE public.ai_matching_experiments 
ADD CONSTRAINT ai_matching_experiments_name_unique UNIQUE (name);

-- =============================================
-- Seed Initial A/B Experiments (only if not exists)
-- =============================================
INSERT INTO ai_matching_experiments (name, description, experiment_type, variants, traffic_allocation, status)
SELECT 
  'pulse_weights_v1',
  'Test embedding vs behavioral weighting for Pulse discovery',
  'matching_weights',
  '{
    "control": {"weights": {"embedding": 0.40, "behavioral": 0.30, "overlap": 0.20, "session": 0.00, "freshness": 0.10}},
    "high_embedding": {"weights": {"embedding": 0.55, "behavioral": 0.20, "overlap": 0.15, "session": 0.00, "freshness": 0.10}},
    "high_behavioral": {"weights": {"embedding": 0.25, "behavioral": 0.50, "overlap": 0.15, "session": 0.00, "freshness": 0.10}}
  }'::jsonb,
  '{"control": 34, "high_embedding": 33, "high_behavioral": 33}'::jsonb,
  'running'
WHERE NOT EXISTS (SELECT 1 FROM ai_matching_experiments WHERE name = 'pulse_weights_v1');

INSERT INTO ai_matching_experiments (name, description, experiment_type, variants, traffic_allocation, status)
SELECT 
  'zone_weights_v1',
  'Test session overlap importance for Zone networking',
  'matching_weights',
  '{
    "control": {"weights": {"embedding": 0.25, "behavioral": 0.15, "overlap": 0.20, "session": 0.30, "freshness": 0.10}},
    "high_session": {"weights": {"embedding": 0.15, "behavioral": 0.10, "overlap": 0.15, "session": 0.50, "freshness": 0.10}}
  }'::jsonb,
  '{"control": 50, "high_session": 50}'::jsonb,
  'running'
WHERE NOT EXISTS (SELECT 1 FROM ai_matching_experiments WHERE name = 'zone_weights_v1');