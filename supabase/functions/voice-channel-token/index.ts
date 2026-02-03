import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RtcTokenBuilder, RtcRole } from "npm:agora-token@2.0.3";
import { 
  corsHeaders, 
  validateAuth, 
  checkRateLimit, 
  validateChannelName,
  errorResponse,
  successResponse,
  logSecurityEvent,
  initRequestContext,
  logInfo,
  logError,
  logRequestComplete,
} from "../_shared/security.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface VoiceTokenRequest {
  voiceChannelId: string;
  role?: 'publisher' | 'subscriber';
}

function validateRequest(body: unknown): { valid: true; data: VoiceTokenRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const { voiceChannelId, role } = body as Record<string, unknown>;
  
  if (!voiceChannelId || typeof voiceChannelId !== 'string') {
    return { valid: false, error: 'voiceChannelId is required' };
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(voiceChannelId)) {
    return { valid: false, error: 'voiceChannelId must be a valid UUID' };
  }
  
  if (role !== undefined && role !== 'publisher' && role !== 'subscriber') {
    return { valid: false, error: 'role must be "publisher" or "subscriber"' };
  }
  
  return {
    valid: true,
    data: {
      voiceChannelId: voiceChannelId as string,
      role: role as 'publisher' | 'subscriber' | undefined,
    },
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize request context for observability
  const requestId = initRequestContext('voice-channel-token');

  try {
    // ============= AUTHENTICATION =============
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      logSecurityEvent('voice_token_auth_failed', null, { reason: auth.error });
      logRequestComplete(401, { reason: 'auth_failed' });
      return errorResponse('Unauthorized: ' + auth.error, 401, corsHeaders);
    }

    logInfo('Request authenticated', { userId: auth.userId });

    // ============= RATE LIMITING =============
    const rateCheck = checkRateLimit(auth.userId!, 'voice_token', { maxRequests: 30, windowMs: 60000 });
    if (!rateCheck.allowed) {
      logSecurityEvent('voice_token_rate_limited', auth.userId, { remaining: rateCheck.remaining });
      logRequestComplete(429, { reason: 'rate_limited' });
      return errorResponse('Rate limit exceeded. Try again later.', 429, {
        ...corsHeaders,
        'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
      });
    }

    // ============= INPUT VALIDATION =============
    const body = await req.json();
    const validation = validateRequest(body);
    if (!validation.valid) {
      logRequestComplete(400, { reason: 'validation_failed', error: validation.error });
      return errorResponse(validation.error, 400, corsHeaders);
    }
    
    const { voiceChannelId, role } = validation.data;

    // ============= AUTHORIZATION CHECK =============
    // Verify user has access to the workspace containing this voice channel
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: voiceChannel, error: channelError } = await supabase
      .from('workspace_voice_channels')
      .select(`
        id,
        workspace_id,
        agora_channel_name,
        max_participants,
        is_active
      `)
      .eq('id', voiceChannelId)
      .single();

    if (channelError || !voiceChannel) {
      logRequestComplete(404, { reason: 'channel_not_found' });
      return errorResponse('Voice channel not found', 404, corsHeaders);
    }

    if (!voiceChannel.is_active) {
      logRequestComplete(400, { reason: 'channel_inactive' });
      return errorResponse('Voice channel is not active', 400, corsHeaders);
    }

    // Check workspace membership
    const { data: membership, error: memberError } = await supabase
      .from('workspace_team_members')
      .select('id, role')
      .eq('workspace_id', voiceChannel.workspace_id)
      .eq('user_id', auth.userId)
      .single();

    if (memberError || !membership) {
      logSecurityEvent('voice_token_unauthorized', auth.userId, { 
        voiceChannelId,
        workspaceId: voiceChannel.workspace_id,
      });
      logRequestComplete(403, { reason: 'not_workspace_member' });
      return errorResponse('You do not have access to this voice channel', 403, corsHeaders);
    }

    // Check current participant count
    const { count: participantCount } = await supabase
      .from('workspace_voice_participants')
      .select('id', { count: 'exact' })
      .eq('voice_session_id', voiceChannelId)
      .is('left_at', null);

    if (participantCount && participantCount >= voiceChannel.max_participants) {
      logRequestComplete(400, { reason: 'channel_full' });
      return errorResponse('Voice channel is full', 400, corsHeaders);
    }

    // ============= GENERATE TOKEN =============
    const appId = Deno.env.get("AGORA_APP_ID");
    const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");

    if (!appId || !appCertificate) {
      logError("Missing Agora credentials in environment");
      logRequestComplete(500, { reason: 'config_error' });
      return errorResponse("Server configuration error", 500, corsHeaders);
    }

    // Token expires in 2 hours for voice calls
    const expirationTimeInSeconds = 7200;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Determine role - publisher (can speak) or subscriber (listen only)
    const agoraRole = role === "subscriber" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

    // Use a hash of the userId as the Agora UID (must be a number)
    const uidHash = Math.abs(auth.userId!.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0)) % 4294967295;

    // Build the token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      voiceChannel.agora_channel_name,
      uidHash,
      agoraRole,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    logSecurityEvent('voice_token_generated', auth.userId, { 
      voiceChannelId,
      role: role || 'publisher',
      workspaceId: voiceChannel.workspace_id,
    });
    logRequestComplete(200, { voiceChannelId });

    return successResponse(
      { 
        token, 
        appId, 
        channelName: voiceChannel.agora_channel_name,
        uid: uidHash,
        expiresAt: privilegeExpiredTs,
      },
      corsHeaders
    );
  } catch (error) {
    logError("Error generating voice channel token", error);
    logRequestComplete(500, { reason: 'internal_error' });
    return errorResponse("Failed to generate token", 500, corsHeaders);
  }
});
