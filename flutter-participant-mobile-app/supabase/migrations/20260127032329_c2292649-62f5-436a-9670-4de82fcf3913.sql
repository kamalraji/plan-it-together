-- Create RPC function for embedding similarity using pgvector's <=> operator
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
  query_embedding vector(768);
BEGIN
  -- Get the query user's embedding
  SELECT pe.user_embedding INTO query_embedding
  FROM profile_embeddings pe
  WHERE pe.user_id = query_user_id;
  
  -- If no embedding found, return empty
  IF query_embedding IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate cosine similarity for all candidates
  -- pgvector's <=> operator returns cosine distance (0-2 range)
  -- Convert to similarity: 100 * (1 - distance/2)
  RETURN QUERY
  SELECT 
    pe.user_id,
    GREATEST(0, LEAST(100, 100.0 * (1.0 - (pe.user_embedding <=> query_embedding) / 2.0)))::FLOAT as similarity
  FROM profile_embeddings pe
  WHERE pe.user_id = ANY(candidate_ids)
    AND pe.user_embedding IS NOT NULL;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_embedding_similarities(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_embedding_similarities(UUID, UUID[]) TO service_role;