-- Update store_youtube_oauth_tokens to delete secrets by NAME (handles orphans from failed attempts)
CREATE OR REPLACE FUNCTION public.store_youtube_oauth_tokens(
  p_workspace_id uuid, 
  p_access_token text, 
  p_refresh_token text
)
RETURNS TABLE(access_id uuid, refresh_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_access_id uuid;
  v_refresh_id uuid;
  v_access_name text;
  v_refresh_name text;
BEGIN
  -- Build secret names
  v_access_name := 'yt_access_' || p_workspace_id::text;
  v_refresh_name := 'yt_refresh_' || p_workspace_id::text;
  
  -- Delete existing secrets by NAME (handles orphans from failed attempts)
  DELETE FROM vault.secrets WHERE name = v_access_name;
  DELETE FROM vault.secrets WHERE name = v_refresh_name;
  
  -- Also clear any tracked IDs from credentials table
  UPDATE workspace_social_api_credentials
  SET access_token_secret_id = NULL, refresh_token_secret_id = NULL
  WHERE workspace_id = p_workspace_id AND platform = 'youtube';
  
  -- Create new vault secrets
  SELECT vault.create_secret(
    p_access_token, 
    v_access_name,
    'YouTube access token for workspace ' || p_workspace_id::text
  ) INTO v_access_id;
  
  SELECT vault.create_secret(
    p_refresh_token, 
    v_refresh_name,
    'YouTube refresh token for workspace ' || p_workspace_id::text
  ) INTO v_refresh_id;
  
  RETURN QUERY SELECT v_access_id, v_refresh_id;
END;
$$;