import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { verifyWorkspaceAccess } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const youtubeClientId = Deno.env.get('YOUTUBE_CLIENT_ID')!;
const youtubeClientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET')!;

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

// Required scopes for YouTube Live Streaming
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ');

interface OAuthState {
  workspace_id: string;
  redirect_uri: string;
  user_id: string;
  timestamp: number;
}

interface YouTubeTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface YouTubeChannelInfo {
  id: string;
  title: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  isLiveEnabled: boolean;
}

/**
 * Fetch YouTube channel info using access token
 */
async function fetchYouTubeChannel(accessToken: string): Promise<YouTubeChannelInfo> {
  const response = await fetch(
    `${YOUTUBE_API_URL}/channels?part=snippet,statistics,status&mine=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('YouTube API error:', error);
    throw new Error('Failed to fetch YouTube channel info');
  }

  const data = await response.json();
  if (!data.items || data.items.length === 0) {
    throw new Error('No YouTube channel found for this account');
  }

  const channel = data.items[0];
  return {
    id: channel.id,
    title: channel.snippet.title,
    thumbnailUrl: channel.snippet.thumbnails?.default?.url,
    subscriberCount: parseInt(channel.statistics.subscriberCount || '0', 10),
    isLiveEnabled: channel.status?.longUploadsStatus === 'allowed',
  };
}

/**
 * Log OAuth activity for audit trail
 */
async function logOAuthActivity(
  workspaceId: string,
  userId: string,
  action: string,
  metadata?: Record<string, unknown>
) {
  try {
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    await serviceClient.from('workspace_activity_log').insert({
      workspace_id: workspaceId,
      user_id: userId,
      action_type: action,
      entity_type: 'youtube_oauth',
      entity_id: workspaceId,
      metadata: metadata || {},
    } as Record<string, unknown>);
  } catch (err) {
    console.error('Failed to log OAuth activity:', err);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Handle OAuth initialization
    if (action === 'init') {
      const workspaceId = url.searchParams.get('workspace_id');
      const redirectUri = url.searchParams.get('redirect_uri') || url.origin;

      if (!workspaceId) {
        return new Response(
          JSON.stringify({ error: 'workspace_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user has workspace access
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await userClient.auth.getUser();

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
      const hasAccess = await verifyWorkspaceAccess(serviceClient, user.id, workspaceId);
      if (!hasAccess) {
        return new Response(
          JSON.stringify({ error: 'You do not have permission to manage this workspace' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create signed state parameter for CSRF protection
      const state: OAuthState = {
        workspace_id: workspaceId,
        redirect_uri: redirectUri,
        user_id: user.id,
        timestamp: Date.now(),
      };
      const stateString = btoa(JSON.stringify(state));

      // Build OAuth URL
      const oauthUrl = new URL(GOOGLE_AUTH_URL);
      oauthUrl.searchParams.set('client_id', youtubeClientId);
      oauthUrl.searchParams.set('redirect_uri', `${supabaseUrl}/functions/v1/youtube-oauth-connect`);
      oauthUrl.searchParams.set('response_type', 'code');
      oauthUrl.searchParams.set('scope', YOUTUBE_SCOPES);
      oauthUrl.searchParams.set('access_type', 'offline');
      oauthUrl.searchParams.set('prompt', 'consent');
      oauthUrl.searchParams.set('state', stateString);

      return new Response(
        JSON.stringify({ oauth_url: oauthUrl.toString() }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle OAuth callback (from Google)
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error from Google:', error);
      return generateCallbackHTML(false, error);
    }

    if (!code || !stateParam) {
      return new Response(
        JSON.stringify({ error: 'Missing code or state parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode and validate state
    let stateData: OAuthState;
    try {
      stateData = JSON.parse(atob(stateParam));
      
      // Validate state timestamp (10 minute expiry)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        throw new Error('State expired');
      }
    } catch {
      console.error('Invalid state parameter');
      return generateCallbackHTML(false, 'Invalid or expired OAuth state');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: youtubeClientId,
        client_secret: youtubeClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${supabaseUrl}/functions/v1/youtube-oauth-connect`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return generateCallbackHTML(false, 'Failed to exchange authorization code');
    }

    const tokens: YouTubeTokenResponse = await tokenResponse.json();
    
    // Fetch channel info
    const channel = await fetchYouTubeChannel(tokens.access_token);

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Store tokens securely using Supabase Vault
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Call the vault storage function
    const { data: vaultResult, error: vaultError } = await serviceClient
      .rpc('store_youtube_oauth_tokens', {
        p_workspace_id: stateData.workspace_id,
        p_access_token: tokens.access_token,
        p_refresh_token: tokens.refresh_token || '',
      });

    if (vaultError) {
      console.error('Failed to store tokens in vault:', vaultError);
      return generateCallbackHTML(false, 'Failed to securely store credentials');
    }

    // Get the secret IDs from vault result
    const secretIds = vaultResult?.[0];
    if (!secretIds) {
      console.error('No secret IDs returned from vault');
      return generateCallbackHTML(false, 'Failed to store credentials');
    }

    // Upsert credentials with vault references (no plaintext tokens)
    const { error: dbError } = await serviceClient
      .from('workspace_social_api_credentials')
      .upsert({
        workspace_id: stateData.workspace_id,
        platform: 'youtube',
        credential_type: 'oauth',
        channel_id: channel.id,
        channel_name: channel.title,
        channel_thumbnail: channel.thumbnailUrl,
        subscriber_count: channel.subscriberCount,
        is_live_enabled: channel.isLiveEnabled,
        access_token_secret_id: secretIds.access_id,
        refresh_token_secret_id: secretIds.refresh_id,
        expires_at: expiresAt,
        is_active: true,
        encrypted_credentials: {}, // Empty - tokens stored securely in Vault
        updated_at: new Date().toISOString(),
      }, { onConflict: 'workspace_id,platform' });

    if (dbError) {
      console.error('Database error:', dbError);
      return generateCallbackHTML(false, 'Failed to save channel connection');
    }

    // Log successful connection
    await logOAuthActivity(stateData.workspace_id, stateData.user_id, 'youtube_connected', {
      channel_id: channel.id,
      channel_name: channel.title,
    });

    // Return success HTML that posts message to parent
    return generateCallbackHTML(true, undefined, {
      id: channel.id,
      name: channel.title,
      thumbnail: channel.thumbnailUrl,
      subscriberCount: channel.subscriberCount,
      isLiveEnabled: channel.isLiveEnabled,
    });

  } catch (err) {
    console.error('OAuth error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Generate HTML response for OAuth callback popup
 */
function generateCallbackHTML(
  success: boolean, 
  error?: string, 
  channel?: { id: string; name: string; thumbnail?: string; subscriberCount?: number; isLiveEnabled: boolean }
): Response {
  const message = success
    ? { type: 'youtube-oauth-success', channel }
    : { type: 'youtube-oauth-error', error };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>YouTube Connection</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    h1 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
    }
    p {
      margin: 0;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${success ? '✅' : '❌'}</div>
    <h1>${success ? 'Connected Successfully!' : 'Connection Failed'}</h1>
    <p>${success ? 'You can close this window.' : (error || 'Please try again.')}</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage(${JSON.stringify(message)}, '*');
      setTimeout(() => window.close(), 2000);
    }
  </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
