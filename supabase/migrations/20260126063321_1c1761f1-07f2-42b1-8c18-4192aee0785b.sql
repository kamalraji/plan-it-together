-- Add dedicated columns for YouTube channel metadata (moving from JSONB to typed columns)
ALTER TABLE workspace_social_api_credentials
  ADD COLUMN IF NOT EXISTS channel_id text,
  ADD COLUMN IF NOT EXISTS channel_name text,
  ADD COLUMN IF NOT EXISTS channel_thumbnail text,
  ADD COLUMN IF NOT EXISTS subscriber_count integer,
  ADD COLUMN IF NOT EXISTS is_live_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_token_secret_id uuid,
  ADD COLUMN IF NOT EXISTS refresh_token_secret_id uuid;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workspace_social_api_credentials_platform_workspace 
  ON workspace_social_api_credentials(workspace_id, platform);

-- Function to store YouTube OAuth tokens securely in vault
CREATE OR REPLACE FUNCTION store_youtube_oauth_tokens(
  p_workspace_id uuid,
  p_access_token text,
  p_refresh_token text
) RETURNS TABLE(access_id uuid, refresh_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_access_id uuid;
  v_refresh_id uuid;
  v_existing_access_id uuid;
  v_existing_refresh_id uuid;
BEGIN
  -- Check for existing secrets to delete them first
  SELECT access_token_secret_id, refresh_token_secret_id 
  INTO v_existing_access_id, v_existing_refresh_id
  FROM workspace_social_api_credentials
  WHERE workspace_id = p_workspace_id AND platform = 'youtube';
  
  -- Delete old secrets if they exist
  IF v_existing_access_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_existing_access_id;
  END IF;
  IF v_existing_refresh_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_existing_refresh_id;
  END IF;
  
  -- Create new vault secrets
  SELECT vault.create_secret(
    p_access_token, 
    'yt_access_' || p_workspace_id::text,
    'YouTube access token for workspace ' || p_workspace_id::text
  ) INTO v_access_id;
  
  SELECT vault.create_secret(
    p_refresh_token, 
    'yt_refresh_' || p_workspace_id::text,
    'YouTube refresh token for workspace ' || p_workspace_id::text
  ) INTO v_refresh_id;
  
  RETURN QUERY SELECT v_access_id, v_refresh_id;
END;
$$;

-- Function to retrieve decrypted YouTube tokens (for Edge Functions with service_role)
CREATE OR REPLACE FUNCTION get_youtube_tokens(p_workspace_id uuid)
RETURNS TABLE(access_token text, refresh_token text, expires_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = c.access_token_secret_id),
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = c.refresh_token_secret_id),
    c.expires_at
  FROM workspace_social_api_credentials c
  WHERE c.workspace_id = p_workspace_id AND c.platform = 'youtube';
$$;

-- Function to update YouTube tokens after refresh
CREATE OR REPLACE FUNCTION update_youtube_access_token(
  p_workspace_id uuid,
  p_new_access_token text,
  p_new_expires_at timestamptz
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_existing_access_id uuid;
  v_new_access_id uuid;
BEGIN
  -- Get existing access token secret ID
  SELECT access_token_secret_id INTO v_existing_access_id
  FROM workspace_social_api_credentials
  WHERE workspace_id = p_workspace_id AND platform = 'youtube';
  
  -- Delete old access token secret
  IF v_existing_access_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_existing_access_id;
  END IF;
  
  -- Create new access token secret
  SELECT vault.create_secret(
    p_new_access_token,
    'yt_access_' || p_workspace_id::text,
    'YouTube access token for workspace ' || p_workspace_id::text
  ) INTO v_new_access_id;
  
  -- Update the credentials record
  UPDATE workspace_social_api_credentials
  SET 
    access_token_secret_id = v_new_access_id,
    expires_at = p_new_expires_at,
    updated_at = now()
  WHERE workspace_id = p_workspace_id AND platform = 'youtube';
END;
$$;

-- Function to delete YouTube tokens (for disconnect)
CREATE OR REPLACE FUNCTION delete_youtube_tokens(p_workspace_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_access_id uuid;
  v_refresh_id uuid;
BEGIN
  -- Get existing secret IDs
  SELECT access_token_secret_id, refresh_token_secret_id 
  INTO v_access_id, v_refresh_id
  FROM workspace_social_api_credentials
  WHERE workspace_id = p_workspace_id AND platform = 'youtube';
  
  -- Delete vault secrets
  IF v_access_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_access_id;
  END IF;
  IF v_refresh_id IS NOT NULL THEN
    DELETE FROM vault.secrets WHERE id = v_refresh_id;
  END IF;
  
  -- Delete the credentials record
  DELETE FROM workspace_social_api_credentials
  WHERE workspace_id = p_workspace_id AND platform = 'youtube';
END;
$$;

-- Migrate existing plaintext tokens to vault (if any exist)
DO $$
DECLARE
  rec RECORD;
  v_access_id uuid;
  v_refresh_id uuid;
BEGIN
  FOR rec IN 
    SELECT id, workspace_id, encrypted_credentials 
    FROM workspace_social_api_credentials 
    WHERE platform = 'youtube' 
      AND encrypted_credentials IS NOT NULL
      AND access_token_secret_id IS NULL
  LOOP
    -- Only migrate if we have tokens in the JSON
    IF rec.encrypted_credentials->>'access_token' IS NOT NULL THEN
      -- Store tokens in vault
      SELECT vault.create_secret(
        rec.encrypted_credentials->>'access_token',
        'yt_access_' || rec.workspace_id::text,
        'YouTube access token (migrated)'
      ) INTO v_access_id;
      
      IF rec.encrypted_credentials->>'refresh_token' IS NOT NULL THEN
        SELECT vault.create_secret(
          rec.encrypted_credentials->>'refresh_token', 
          'yt_refresh_' || rec.workspace_id::text,
          'YouTube refresh token (migrated)'
        ) INTO v_refresh_id;
      END IF;
      
      -- Update record with vault references and clear plaintext
      UPDATE workspace_social_api_credentials SET
        channel_id = rec.encrypted_credentials->>'channel_id',
        channel_name = rec.encrypted_credentials->>'channel_name',
        channel_thumbnail = rec.encrypted_credentials->>'channel_thumbnail',
        subscriber_count = (rec.encrypted_credentials->>'subscriber_count')::int,
        is_live_enabled = COALESCE((rec.encrypted_credentials->>'is_live_enabled')::boolean, false),
        access_token_secret_id = v_access_id,
        refresh_token_secret_id = v_refresh_id,
        encrypted_credentials = NULL
      WHERE id = rec.id;
    END IF;
  END LOOP;
END $$;

-- Add comment for documentation
COMMENT ON FUNCTION store_youtube_oauth_tokens IS 'Securely stores YouTube OAuth tokens in Supabase Vault. Only callable by service_role.';
COMMENT ON FUNCTION get_youtube_tokens IS 'Retrieves decrypted YouTube tokens from Vault. Only callable by service_role Edge Functions.';
COMMENT ON FUNCTION delete_youtube_tokens IS 'Securely deletes YouTube tokens from Vault and credentials table.';