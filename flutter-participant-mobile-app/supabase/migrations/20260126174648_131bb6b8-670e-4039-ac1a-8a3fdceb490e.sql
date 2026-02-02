-- Phase 2: Embedding Generation Infrastructure (Fixed)

-- 1. Create ANN index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_bio_ann 
ON public.profile_embeddings 
USING ivfflat (bio_embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_profile_embeddings_skills_ann 
ON public.profile_embeddings 
USING ivfflat (skills_embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_profile_embeddings_interests_ann 
ON public.profile_embeddings 
USING ivfflat (interests_embedding vector_cosine_ops) 
WITH (lists = 100);

-- 2. Create embedding job queue table for batch processing
CREATE TABLE IF NOT EXISTS public.embedding_job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  priority INT DEFAULT 5,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_embedding_queue_pending_user 
ON public.embedding_job_queue(user_id) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_embedding_queue_status_priority 
ON public.embedding_job_queue(status, priority, scheduled_at);

ALTER TABLE public.embedding_job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages embedding queue"
ON public.embedding_job_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Create function to queue embedding generation (using correct column: looking_for)
CREATE OR REPLACE FUNCTION public.queue_embedding_generation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_text TEXT;
  new_hash TEXT;
  existing_hash TEXT;
BEGIN
  -- Build source text from profile fields (using looking_for instead of networking_goal)
  source_text := COALESCE(NEW.bio, '') || '|' || 
                 COALESCE(NEW.headline, '') || '|' ||
                 COALESCE(array_to_string(NEW.skills, ','), '') || '|' ||
                 COALESCE(array_to_string(NEW.interests, ','), '') || '|' ||
                 COALESCE(array_to_string(NEW.looking_for, ','), '');
  
  new_hash := md5(source_text);
  
  SELECT source_hash INTO existing_hash
  FROM public.profile_embeddings
  WHERE user_id = NEW.user_id;
  
  IF existing_hash IS NULL OR existing_hash != new_hash THEN
    INSERT INTO public.embedding_job_queue (user_id, priority, status, scheduled_at)
    VALUES (NEW.user_id, 3, 'pending', now())
    ON CONFLICT (user_id) WHERE status = 'pending'
    DO UPDATE SET 
      priority = LEAST(embedding_job_queue.priority, 3),
      scheduled_at = now(),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Create trigger on impact_profiles for embedding generation
DROP TRIGGER IF EXISTS trigger_queue_embedding_on_profile_update ON public.impact_profiles;
CREATE TRIGGER trigger_queue_embedding_on_profile_update
AFTER INSERT OR UPDATE OF bio, headline, skills, interests, looking_for
ON public.impact_profiles
FOR EACH ROW
EXECUTE FUNCTION public.queue_embedding_generation();

-- 5. Create function to find similar profiles using embeddings
CREATE OR REPLACE FUNCTION public.find_similar_profiles(
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  similarity_score FLOAT,
  bio_similarity FLOAT,
  skills_similarity FLOAT,
  interests_similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bio_emb vector(768);
  v_skills_emb vector(768);
  v_interests_emb vector(768);
BEGIN
  SELECT pe.bio_embedding, pe.skills_embedding, pe.interests_embedding
  INTO v_bio_emb, v_skills_emb, v_interests_emb
  FROM public.profile_embeddings pe
  WHERE pe.user_id = p_user_id;
  
  IF v_bio_emb IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    pe.user_id,
    (
      COALESCE(1 - (pe.bio_embedding <=> v_bio_emb), 0) * 0.4 +
      COALESCE(1 - (pe.skills_embedding <=> v_skills_emb), 0) * 0.35 +
      COALESCE(1 - (pe.interests_embedding <=> v_interests_emb), 0) * 0.25
    )::FLOAT AS similarity_score,
    COALESCE(1 - (pe.bio_embedding <=> v_bio_emb), 0)::FLOAT AS bio_similarity,
    COALESCE(1 - (pe.skills_embedding <=> v_skills_emb), 0)::FLOAT AS skills_similarity,
    COALESCE(1 - (pe.interests_embedding <=> v_interests_emb), 0)::FLOAT AS interests_similarity
  FROM public.profile_embeddings pe
  INNER JOIN public.impact_profiles ip ON ip.user_id = pe.user_id
  WHERE pe.user_id != p_user_id
    AND pe.bio_embedding IS NOT NULL
    AND (p_event_id IS NULL OR EXISTS (
      SELECT 1 FROM public.event_checkins ec 
      WHERE ec.user_id = pe.user_id AND ec.event_id = p_event_id
    ))
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users bu
      WHERE (bu.user_id = p_user_id AND bu.blocked_user_id = pe.user_id)
         OR (bu.user_id = pe.user_id AND bu.blocked_user_id = p_user_id)
    )
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$;

-- 6. Create function to process embedding queue batch
CREATE OR REPLACE FUNCTION public.get_pending_embedding_jobs(p_limit INT DEFAULT 10)
RETURNS TABLE (job_id UUID, user_id UUID, priority INT, attempts INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.embedding_job_queue eq
  SET status = 'processing', started_at = now(), attempts = eq.attempts + 1, updated_at = now()
  WHERE eq.id IN (
    SELECT eq2.id FROM public.embedding_job_queue eq2
    WHERE eq2.status = 'pending' AND eq2.scheduled_at <= now() AND eq2.attempts < eq2.max_attempts
    ORDER BY eq2.priority, eq2.scheduled_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING eq.id, eq.user_id, eq.priority, eq.attempts;
END;
$$;

-- 7. Create function to mark embedding job complete
CREATE OR REPLACE FUNCTION public.complete_embedding_job(
  p_job_id UUID,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.embedding_job_queue
  SET 
    status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
    completed_at = CASE WHEN p_success THEN now() ELSE NULL END,
    error_message = p_error_message,
    updated_at = now()
  WHERE id = p_job_id;
END;
$$;

-- 8. Cleanup function for old jobs
CREATE OR REPLACE FUNCTION public.cleanup_old_embedding_jobs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM public.embedding_job_queue
  WHERE (status = 'completed' AND completed_at < now() - INTERVAL '7 days')
     OR (status = 'failed' AND attempts >= max_attempts AND updated_at < now() - INTERVAL '1 day');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;