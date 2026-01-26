import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { verifyWorkspaceAccess } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const youtubeClientId = Deno.env.get('YOUTUBE_CLIENT_ID')!;
const youtubeClientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET')!;

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Verify authentication
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

    // Parse request body
    const { workspace_id } = await req.json();

    if (!workspace_id) {
      return new Response(
        JSON.stringify({ error: 'workspace_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service client for privileged operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify workspace access
    const hasAccess = await verifyWorkspaceAccess(serviceClient, user.id, workspace_id);
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to manage this workspace' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current tokens from vault
    const { data: tokenData, error: tokenError } = await serviceClient
      .rpc('get_youtube_tokens', { p_workspace_id: workspace_id });

    if (tokenError || !tokenData || tokenData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No YouTube connection found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { refresh_token } = tokenData[0];

    if (!refresh_token) {
      return new Response(
        JSON.stringify({ error: 'No refresh token available. Please reconnect YouTube.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Refresh the access token
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: youtubeClientId,
        client_secret: youtubeClientSecret,
        refresh_token: refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token refresh failed:', errorText);
      
      // If refresh token is revoked, mark connection as inactive
      if (tokenResponse.status === 400) {
        await serviceClient
          .from('workspace_social_api_credentials')
          .update({ is_active: false })
          .eq('workspace_id', workspace_id)
          .eq('platform', 'youtube');
      }

      return new Response(
        JSON.stringify({ error: 'Failed to refresh token. Please reconnect YouTube.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newTokens = await tokenResponse.json();
    const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

    // Update access token in vault
    const { error: updateError } = await serviceClient
      .rpc('update_youtube_access_token', {
        p_workspace_id: workspace_id,
        p_new_access_token: newTokens.access_token,
        p_new_expires_at: newExpiresAt,
      });

    if (updateError) {
      console.error('Failed to update token in vault:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save refreshed token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the refresh
    try {
      await serviceClient.from('workspace_activity_log').insert({
        workspace_id,
        user_id: user.id,
        action_type: 'youtube_token_refreshed',
        entity_type: 'youtube_oauth',
        entity_id: workspace_id,
        metadata: { expires_at: newExpiresAt },
      });
    } catch (logErr) {
      console.error('Failed to log token refresh:', logErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        expires_at: newExpiresAt,
        message: 'Token refreshed successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Token refresh error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
