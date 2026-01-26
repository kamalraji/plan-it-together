import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { 
  z, 
  uuidSchema, 
  optionalUuidSchema,
  shortStringSchema, 
  optionalMediumStringSchema,
  parseAndValidate 
} from "../_shared/validation.ts";
import { requireAuth, verifyWorkspaceAccess, forbiddenResponse } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod validation schemas
const privacyStatusSchema = z.enum(['public', 'unlisted', 'private']).default('unlisted');

const createBroadcastSchema = z.object({
  action: z.literal('create_broadcast'),
  workspace_id: uuidSchema,
  event_id: uuidSchema,
  session_id: optionalUuidSchema,
  title: shortStringSchema,
  description: optionalMediumStringSchema,
  privacy_status: privacyStatusSchema,
  scheduled_start: z.string().datetime().optional(),
  chat_enabled: z.boolean().default(true),
}).strict();

const startStreamSchema = z.object({
  action: z.literal('start_stream'),
  workspace_id: uuidSchema,
  stream_id: uuidSchema,
}).strict();

const endStreamSchema = z.object({
  action: z.literal('end_stream'),
  workspace_id: uuidSchema,
  stream_id: uuidSchema,
}).strict();

const getStatusSchema = z.object({
  action: z.literal('get_status'),
  workspace_id: uuidSchema,
  stream_id: uuidSchema,
}).strict();

const getAnalyticsSchema = z.object({
  action: z.literal('get_analytics'),
  workspace_id: uuidSchema,
  stream_id: uuidSchema,
}).strict();

const updateStreamSchema = z.object({
  action: z.literal('update_stream'),
  workspace_id: uuidSchema,
  stream_id: uuidSchema,
  title: shortStringSchema.optional(),
  description: optionalMediumStringSchema,
  privacy_status: privacyStatusSchema.optional(),
  chat_enabled: z.boolean().optional(),
}).strict();

const requestSchema = z.discriminatedUnion('action', [
  createBroadcastSchema,
  startStreamSchema,
  endStreamSchema,
  getStatusSchema,
  getAnalyticsSchema,
  updateStreamSchema,
]);

// YouTube API helper
async function callYouTubeAPI(
  endpoint: string, 
  method: string, 
  accessToken: string,
  body?: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('YouTube API Error:', data);
      return { 
        success: false, 
        error: data.error?.message || 'YouTube API error' 
      };
    }
    
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('YouTube API call failed:', message);
    return { success: false, error: message };
  }
}

// Get YouTube credentials for workspace (using secure vault storage)
async function getYouTubeCredentials(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  workspaceId: string
): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  // First check if YouTube is connected and active
  const { data: credential, error: credError } = await supabase
    .from('workspace_social_api_credentials')
    .select('id, is_active, expires_at, access_token_secret_id')
    .eq('workspace_id', workspaceId)
    .eq('platform', 'youtube')
    .maybeSingle();
  
  if (credError || !credential) {
    return { 
      success: false, 
      error: 'No YouTube credentials found. Please connect your YouTube channel first.' 
    };
  }

  if (!credential.is_active) {
    return {
      success: false,
      error: 'YouTube channel is disconnected. Please reconnect.'
    };
  }

  // Check if token is expired and needs refresh
  if (credential.expires_at && new Date(credential.expires_at) < new Date()) {
    return { 
      success: false, 
      error: 'YouTube token expired. Please refresh your connection.' 
    };
  }
  
  // Retrieve decrypted tokens from vault using RPC
  const { data: tokenData, error: tokenError } = await supabase
    .rpc('get_youtube_tokens', { p_workspace_id: workspaceId });
  
  if (tokenError || !tokenData || tokenData.length === 0) {
    console.error('Failed to retrieve tokens from vault:', tokenError);
    return { 
      success: false, 
      error: 'Failed to retrieve YouTube credentials. Please reconnect.' 
    };
  }

  const { access_token } = tokenData[0];
  
  if (!access_token) {
    return {
      success: false,
      error: 'YouTube access token not found. Please reconnect your channel.'
    };
  }
  
  return { success: true, accessToken: access_token };
}

// Create a YouTube live broadcast
async function createYouTubeBroadcast(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  workspaceId: string,
  eventId: string,
  sessionId: string | null,
  title: string,
  description: string | null,
  privacyStatus: string,
  scheduledStart: string | null,
  chatEnabled: boolean
): Promise<{ success: boolean; stream?: unknown; error?: string }> {
  // Get YouTube credentials from vault
  const credResult = await getYouTubeCredentials(supabase, workspaceId);
  if (!credResult.success || !credResult.accessToken) {
    return { success: false, error: credResult.error };
  }
  
  const accessToken = credResult.accessToken;
  
  // Create broadcast
  const broadcastBody = {
    snippet: {
      title,
      description: description || '',
      scheduledStartTime: scheduledStart || new Date().toISOString(),
    },
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: false,
    },
    contentDetails: {
      enableAutoStart: false,
      enableAutoStop: true,
      enableDvr: true,
      recordFromStart: true,
      enableContentEncryption: true,
      enableEmbed: true,
      enableClosedCaptions: true,
    },
  };
  
  const broadcastResult = await callYouTubeAPI(
    'liveBroadcasts?part=snippet,status,contentDetails',
    'POST',
    accessToken,
    broadcastBody
  );
  
  if (!broadcastResult.success) {
    return { success: false, error: broadcastResult.error };
  }
  
  // deno-lint-ignore no-explicit-any
  const broadcast = broadcastResult.data as any;
  
  // Create stream (for RTMP ingestion)
  const streamBody = {
    snippet: {
      title: `${title} - Stream`,
    },
    cdn: {
      frameRate: '30fps',
      resolution: '1080p',
      ingestionType: 'rtmp',
    },
  };
  
  const streamResult = await callYouTubeAPI(
    'liveStreams?part=snippet,cdn',
    'POST',
    accessToken,
    streamBody
  );
  
  if (!streamResult.success) {
    return { success: false, error: streamResult.error };
  }
  
  // deno-lint-ignore no-explicit-any
  const stream = streamResult.data as any;
  
  // Bind stream to broadcast
  const bindResult = await callYouTubeAPI(
    `liveBroadcasts/bind?id=${broadcast.id}&part=id,contentDetails&streamId=${stream.id}`,
    'POST',
    accessToken
  );
  
  if (!bindResult.success) {
    console.warn('Failed to bind stream to broadcast:', bindResult.error);
  }
  
  // Store in database
  const streamKey = stream.cdn?.ingestionInfo?.streamName || '';
  const rtmpUrl = stream.cdn?.ingestionInfo?.ingestionAddress || '';
  
  const { data: dbStream, error: dbError } = await supabase
    .from('event_live_streams')
    .insert({
      workspace_id: workspaceId,
      event_id: eventId,
      session_id: sessionId,
      platform: 'YOUTUBE',
      video_id: broadcast.id,
      stream_url: `https://www.youtube.com/watch?v=${broadcast.id}`,
      stream_status: 'scheduled',
      youtube_broadcast_id: broadcast.id,
      youtube_stream_key: streamKey,
      title,
      description,
      privacy_status: privacyStatus,
      scheduled_start: scheduledStart,
      chat_enabled: chatEnabled,
      viewer_count: 0,
      is_recording_available: false,
    })
    .select()
    .single();
  
  if (dbError) {
    console.error('Failed to save stream to database:', dbError);
    return { success: false, error: 'Failed to save stream configuration' };
  }
  
  return { 
    success: true, 
    stream: {
      ...dbStream,
      rtmp_url: rtmpUrl,
      stream_key: streamKey,
    }
  };
}

// Start a YouTube live stream
async function startYouTubeStream(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  workspaceId: string,
  streamId: string
): Promise<{ success: boolean; stream?: unknown; error?: string }> {
  // Get stream from database
  const { data: dbStream, error: dbError } = await supabase
    .from('event_live_streams')
    .select('*')
    .eq('id', streamId)
    .eq('workspace_id', workspaceId)
    .single();
  
  if (dbError || !dbStream) {
    return { success: false, error: 'Stream not found' };
  }
  
  // Get credentials from vault
  const credResult = await getYouTubeCredentials(supabase, workspaceId);
  if (!credResult.success || !credResult.accessToken) {
    return { success: false, error: credResult.error };
  }
  
  const accessToken = credResult.accessToken;
  
  // Transition broadcast to live
  const result = await callYouTubeAPI(
    `liveBroadcasts/transition?id=${dbStream.youtube_broadcast_id}&broadcastStatus=live&part=id,status`,
    'POST',
    accessToken
  );
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  // Update database
  const { data: updatedStream, error: updateError } = await supabase
    .from('event_live_streams')
    .update({
      stream_status: 'live',
      started_at: new Date().toISOString(),
    })
    .eq('id', streamId)
    .select()
    .single();
  
  if (updateError) {
    console.error('Failed to update stream status:', updateError);
  }
  
  return { success: true, stream: updatedStream };
}

// End a YouTube live stream
async function endYouTubeStream(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  workspaceId: string,
  streamId: string
): Promise<{ success: boolean; stream?: unknown; error?: string }> {
  const { data: dbStream, error: dbError } = await supabase
    .from('event_live_streams')
    .select('*')
    .eq('id', streamId)
    .eq('workspace_id', workspaceId)
    .single();
  
  if (dbError || !dbStream) {
    return { success: false, error: 'Stream not found' };
  }
  
  // Get credentials from vault
  const credResult = await getYouTubeCredentials(supabase, workspaceId);
  if (!credResult.success || !credResult.accessToken) {
    return { success: false, error: credResult.error };
  }
  
  const accessToken = credResult.accessToken;
  
  // Transition broadcast to complete
  const result = await callYouTubeAPI(
    `liveBroadcasts/transition?id=${dbStream.youtube_broadcast_id}&broadcastStatus=complete&part=id,status`,
    'POST',
    accessToken
  );
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  // Update database
  const { data: updatedStream, error: updateError } = await supabase
    .from('event_live_streams')
    .update({
      stream_status: 'ended',
      ended_at: new Date().toISOString(),
      is_recording_available: true,
      recording_url: `https://www.youtube.com/watch?v=${dbStream.video_id}`,
    })
    .eq('id', streamId)
    .select()
    .single();
  
  if (updateError) {
    console.error('Failed to update stream status:', updateError);
  }
  
  return { success: true, stream: updatedStream };
}

// Get stream status from YouTube
async function getStreamStatus(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  workspaceId: string,
  streamId: string
): Promise<{ success: boolean; status?: unknown; error?: string }> {
  const { data: dbStream, error: dbError } = await supabase
    .from('event_live_streams')
    .select('*')
    .eq('id', streamId)
    .eq('workspace_id', workspaceId)
    .single();
  
  if (dbError || !dbStream) {
    return { success: false, error: 'Stream not found' };
  }
  
  // Get credentials from vault
  const credResult = await getYouTubeCredentials(supabase, workspaceId);
  if (!credResult.success || !credResult.accessToken) {
    // Return database status if can't get YouTube status
    return { 
      success: true, 
      status: {
        stream: dbStream,
        youtube_status: null,
      }
    };
  }
  
  const accessToken = credResult.accessToken;
  
  // Get broadcast status
  const result = await callYouTubeAPI(
    `liveBroadcasts?id=${dbStream.youtube_broadcast_id}&part=snippet,status,statistics`,
    'GET',
    accessToken
  );
  
  // deno-lint-ignore no-explicit-any
  const broadcast = (result.data as any)?.items?.[0];
  
  // Update viewer count if live
  if (broadcast?.statistics?.concurrentViewers) {
    const viewerCount = parseInt(broadcast.statistics.concurrentViewers, 10);
    await supabase
      .from('event_live_streams')
      .update({ viewer_count: viewerCount })
      .eq('id', streamId);
    
    dbStream.viewer_count = viewerCount;
  }
  
  return { 
    success: true, 
    status: {
      stream: dbStream,
      youtube_status: broadcast?.status?.lifeCycleStatus,
      concurrent_viewers: broadcast?.statistics?.concurrentViewers,
    }
  };
}

// Get stream analytics
async function getStreamAnalytics(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  workspaceId: string,
  streamId: string
): Promise<{ success: boolean; analytics?: unknown; error?: string }> {
  // Get viewer sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('stream_viewer_sessions')
    .select('*')
    .eq('stream_id', streamId);
  
  if (sessionsError) {
    return { success: false, error: 'Failed to fetch analytics' };
  }
  
  // Get stream info
  const { data: stream, error: streamError } = await supabase
    .from('event_live_streams')
    .select('*')
    .eq('id', streamId)
    .eq('workspace_id', workspaceId)
    .single();
  
  if (streamError || !stream) {
    return { success: false, error: 'Stream not found' };
  }
  
  // Calculate analytics
  const deviceBreakdown: Record<string, number> = {};
  let totalWatchTime = 0;
  let peakViewers = stream.viewer_count || 0;
  
  (sessions || []).forEach((session: { device_type: string; watch_duration_seconds: number }) => {
    const device = session.device_type || 'unknown';
    deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    totalWatchTime += session.watch_duration_seconds || 0;
  });
  
  const totalViewers = sessions?.length || 0;
  const averageWatchTime = totalViewers > 0 ? Math.round(totalWatchTime / totalViewers) : 0;
  
  return {
    success: true,
    analytics: {
      streamId,
      peakViewers,
      averageWatchTime,
      totalUniqueViewers: totalViewers,
      currentViewers: stream.viewer_count || 0,
      deviceBreakdown,
      stream,
    }
  };
}

// Update stream settings
async function updateStream(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  workspaceId: string,
  streamId: string,
  updates: Record<string, unknown>
): Promise<{ success: boolean; stream?: unknown; error?: string }> {
  const updateData: Record<string, unknown> = {};
  if (updates.title) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.privacy_status) updateData.privacy_status = updates.privacy_status;
  if (updates.chat_enabled !== undefined) updateData.chat_enabled = updates.chat_enabled;
  
  const { data, error } = await supabase
    .from('event_live_streams')
    .update(updateData)
    .eq('id', streamId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();
  
  if (error) {
    return { success: false, error: 'Failed to update stream' };
  }
  
  return { success: true, stream: data };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authResult = await requireAuth(req, corsHeaders);
    if (!authResult.success) {
      return authResult.response;
    }
    
    const { user, serviceClient } = authResult;
    
    // Parse and validate request
    const parseResult = await parseAndValidate(req, requestSchema, corsHeaders);
    if (!parseResult.success) {
      return parseResult.response;
    }
    
    const body = parseResult.data;
    
    // Verify workspace access
    const hasAccess = await verifyWorkspaceAccess(serviceClient, user.id, body.workspace_id);
    if (!hasAccess) {
      return forbiddenResponse('You do not have permission to manage streams for this workspace', corsHeaders);
    }
    
    console.log(`[youtube-stream-manage] Action: ${body.action}, User: ${user.id}, Workspace: ${body.workspace_id}`);
    
    let result: { success: boolean; stream?: unknown; status?: unknown; analytics?: unknown; error?: string };
    
    switch (body.action) {
      case 'create_broadcast':
        result = await createYouTubeBroadcast(
          serviceClient,
          body.workspace_id,
          body.event_id,
          body.session_id || null,
          body.title,
          body.description || null,
          body.privacy_status,
          body.scheduled_start || null,
          body.chat_enabled
        );
        break;
        
      case 'start_stream':
        result = await startYouTubeStream(serviceClient, body.workspace_id, body.stream_id);
        break;
        
      case 'end_stream':
        result = await endYouTubeStream(serviceClient, body.workspace_id, body.stream_id);
        break;
        
      case 'get_status':
        result = await getStreamStatus(serviceClient, body.workspace_id, body.stream_id);
        break;
        
      case 'get_analytics':
        result = await getStreamAnalytics(serviceClient, body.workspace_id, body.stream_id);
        break;
        
      case 'update_stream':
        result = await updateStream(serviceClient, body.workspace_id, body.stream_id, {
          title: body.title,
          description: body.description,
          privacy_status: body.privacy_status,
          chat_enabled: body.chat_enabled,
        });
        break;
        
      default:
        result = { success: false, error: 'Invalid action' };
    }
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[youtube-stream-manage] Error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
