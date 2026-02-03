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

interface AgoraTokenRequest {
  channelName: string;
  uid?: number;
  role?: 'publisher' | 'subscriber';
}

function validateRequest(body: unknown): { valid: true; data: AgoraTokenRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const { channelName, uid, role } = body as Record<string, unknown>;
  
  if (!validateChannelName(channelName)) {
    return { valid: false, error: 'channelName must be 1-64 alphanumeric characters (including _ and -)' };
  }
  
  if (uid !== undefined && (typeof uid !== 'number' || uid < 0 || uid > 4294967295)) {
    return { valid: false, error: 'uid must be a positive number (0-4294967295)' };
  }
  
  if (role !== undefined && role !== 'publisher' && role !== 'subscriber') {
    return { valid: false, error: 'role must be "publisher" or "subscriber"' };
  }
  
  return {
    valid: true,
    data: {
      channelName: channelName as string,
      uid: uid as number | undefined,
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
  const requestId = initRequestContext('agora-token');

  try {
    // ============= AUTHENTICATION =============
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      logSecurityEvent('agora_token_auth_failed', null, { reason: auth.error });
      logRequestComplete(401, { reason: 'auth_failed' });
      return errorResponse('Unauthorized: ' + auth.error, 401, corsHeaders);
    }

    logInfo('Request authenticated', { userId: auth.userId });

    // ============= RATE LIMITING =============
    const rateCheck = checkRateLimit(auth.userId!, 'agora_token', { maxRequests: 20, windowMs: 60000 });
    if (!rateCheck.allowed) {
      logSecurityEvent('agora_token_rate_limited', auth.userId, { remaining: rateCheck.remaining });
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
    
    const { channelName, uid, role } = validation.data;

    // ============= BUSINESS LOGIC =============
    const appId = Deno.env.get("AGORA_APP_ID");
    const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");

    if (!appId || !appCertificate) {
      logError("Missing Agora credentials in environment");
      logRequestComplete(500, { reason: 'config_error' });
      return errorResponse("Server configuration error", 500, corsHeaders);
    }

    // Token expires in 1 hour
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Determine role - publisher (speaker) or subscriber (audience)
    const agoraRole = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    // Build the token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid || 0,
      agoraRole,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    logSecurityEvent('agora_token_generated', auth.userId, { channelName, role: role || 'subscriber' });
    logRequestComplete(200, { channelName });

    return successResponse(
      { token, appId, expiresAt: privilegeExpiredTs },
      corsHeaders
    );
  } catch (error) {
    logError("Error generating Agora token", error);
    logRequestComplete(500, { reason: 'internal_error' });
    return errorResponse("Failed to generate token", 500, corsHeaders);
  }
});
