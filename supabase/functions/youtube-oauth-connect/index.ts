import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const youtubeClientId = Deno.env.get('YOUTUBE_CLIENT_ID')!;
const youtubeClientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET')!;

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface YouTubeChannelResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      thumbnails: {
        default: { url: string };
      };
    };
    statistics: {
      subscriberCount: string;
    };
    status?: {
      longUploadsStatus?: string;
    };
  }>;
}

interface EncryptedCredentials {
  access_token: string;
  refresh_token: string;
  channel_id: string;
  channel_name: string;
  channel_thumbnail?: string;
  subscriber_count?: number;
  is_live_enabled: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Generate OAuth URL for initiating the flow
    if (action === 'init') {
      const workspaceId = url.searchParams.get('workspace_id');
      const redirectUri = url.searchParams.get('redirect_uri');
      
      if (!workspaceId) {
        return new Response(
          JSON.stringify({ error: 'workspace_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const state = btoa(JSON.stringify({ workspace_id: workspaceId, redirect_uri: redirectUri }));
      const scopes = [
        'https://www.googleapis.com/auth/youtube.force-ssl',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly'
      ].join(' ');

      const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      oauthUrl.searchParams.set('client_id', youtubeClientId);
      oauthUrl.searchParams.set('redirect_uri', `${supabaseUrl}/functions/v1/youtube-oauth-connect`);
      oauthUrl.searchParams.set('response_type', 'code');
      oauthUrl.searchParams.set('scope', scopes);
      oauthUrl.searchParams.set('access_type', 'offline');
      oauthUrl.searchParams.set('prompt', 'consent');
      oauthUrl.searchParams.set('state', state);

      return new Response(
        JSON.stringify({ oauth_url: oauthUrl.toString() }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle OAuth callback (code exchange)
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'youtube-oauth-error', error: '${error}' }, '*'); window.close();</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code || !state) {
      return new Response(
        JSON.stringify({ error: 'Missing code or state parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode state
    let stateData: { workspace_id: string; redirect_uri?: string };
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid state parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: youtubeClientId,
        client_secret: youtubeClientSecret,
        redirect_uri: `${supabaseUrl}/functions/v1/youtube-oauth-connect`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'youtube-oauth-error', error: 'Token exchange failed' }, '*'); window.close();</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const tokens: TokenResponse = await tokenResponse.json();

    // Fetch channel info
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,status&mine=true',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    if (!channelResponse.ok) {
      console.error('Failed to fetch channel info:', await channelResponse.text());
      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'youtube-oauth-error', error: 'Failed to fetch channel info' }, '*'); window.close();</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const channelData: YouTubeChannelResponse = await channelResponse.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'youtube-oauth-error', error: 'No YouTube channel found' }, '*'); window.close();</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const channel = channelData.items[0];
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Build encrypted credentials object (in production, actually encrypt this)
    const encryptedCredentials: EncryptedCredentials = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      channel_id: channel.id,
      channel_name: channel.snippet.title,
      channel_thumbnail: channel.snippet.thumbnails.default.url,
      subscriber_count: parseInt(channel.statistics.subscriberCount) || 0,
      is_live_enabled: channel.status?.longUploadsStatus === 'allowed',
    };

    // Store credentials in database
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if record exists
    const { data: existing } = await serviceClient
      .from('workspace_social_api_credentials')
      .select('id')
      .eq('workspace_id', stateData.workspace_id)
      .eq('platform', 'youtube')
      .maybeSingle();

    let upsertError;
    if (existing) {
      // Update existing record
      const { error } = await serviceClient
        .from('workspace_social_api_credentials')
        .update({
          credential_type: 'oauth',
          encrypted_credentials: encryptedCredentials,
          expires_at: expiresAt,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      upsertError = error;
    } else {
      // Insert new record
      const { error } = await serviceClient
        .from('workspace_social_api_credentials')
        .insert({
          workspace_id: stateData.workspace_id,
          platform: 'youtube',
          credential_type: 'oauth',
          encrypted_credentials: encryptedCredentials,
          expires_at: expiresAt,
          is_active: true,
        });
      upsertError = error;
    }

    if (upsertError) {
      console.error('Failed to store credentials:', upsertError);
      return new Response(
        `<html><body><script>window.opener?.postMessage({ type: 'youtube-oauth-error', error: 'Failed to store credentials' }, '*'); window.close();</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Success - close popup and notify parent
    const successData = {
      type: 'youtube-oauth-success',
      channel: {
        id: channel.id,
        name: channel.snippet.title,
        thumbnail: channel.snippet.thumbnails.default.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
        isLiveEnabled: channel.status?.longUploadsStatus === 'allowed',
      },
    };

    return new Response(
      `<html><body><script>window.opener?.postMessage(${JSON.stringify(successData)}, '*'); window.close();</script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
