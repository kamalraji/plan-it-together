import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  validateAuth,
  checkRateLimit,
  validateUUID,
  errorResponse,
  successResponse,
  initRequestContext,
  logInfo,
  logError,
  logRequestComplete,
} from "../_shared/security.ts";

interface TrackDownloadRequest {
  material_id: string;
  event_id: string;
  session_id?: string;
}

function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  
  if (/mobile|android|iphone|ipad|ipod/i.test(userAgent)) {
    if (/ipad/i.test(userAgent)) return 'tablet';
    return 'mobile';
  }
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function validateRequest(body: unknown): { valid: true; data: TrackDownloadRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const data = body as Record<string, unknown>;

  if (!validateUUID(data.material_id)) {
    return { valid: false, error: 'Invalid material_id' };
  }

  if (!validateUUID(data.event_id)) {
    return { valid: false, error: 'Invalid event_id' };
  }

  if (data.session_id !== undefined && data.session_id !== null && !validateUUID(data.session_id)) {
    return { valid: false, error: 'Invalid session_id' };
  }

  return {
    valid: true,
    data: {
      material_id: data.material_id as string,
      event_id: data.event_id as string,
      session_id: data.session_id as string | undefined,
    },
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = initRequestContext('track-material-download');

  try {
    // 1. Authentication
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      logRequestComplete(401);
      return errorResponse('Unauthorized', 401, corsHeaders);
    }

    // 2. Rate limiting (30 requests/minute for downloads)
    const rateCheck = checkRateLimit(auth.userId!, 'material-download', {
      maxRequests: 30,
      windowMs: 60000,
    });
    if (!rateCheck.allowed) {
      logRequestComplete(429);
      return errorResponse('Rate limit exceeded. Please try again later.', 429, corsHeaders);
    }

    // 3. Parse and validate request
    const body = await req.json();
    const validation = validateRequest(body);
    if (!validation.valid) {
      logRequestComplete(400);
      return errorResponse(validation.error, 400, corsHeaders);
    }

    const { material_id, event_id, session_id } = validation.data;

    // 4. Extract metadata
    const userAgent = req.headers.get('user-agent');
    const deviceType = parseUserAgent(userAgent);
    const referrer = req.headers.get('referer') || null;

    // 5. Get Supabase client with service role for inserting analytics
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 6. Insert analytics record
    const { error: analyticsError } = await supabase
      .from('material_download_analytics')
      .insert({
        material_id,
        user_id: auth.userId,
        event_id,
        session_id: session_id || null,
        user_agent: userAgent?.substring(0, 500) || null,
        device_type: deviceType,
        referrer: referrer?.substring(0, 500) || null,
      });

    if (analyticsError) {
      logError('Failed to insert analytics record', analyticsError);
      // Don't fail the request - analytics is secondary
    }

    // 7. Call existing RPC for backward compatibility (increment counter)
    const { error: rpcError } = await supabase.rpc('increment_material_download', {
      p_material_id: material_id,
    });

    if (rpcError) {
      logError('Failed to increment download count', rpcError);
      // Still return success - the main tracking succeeded
    }

    logInfo('Material download tracked', {
      materialId: material_id,
      eventId: event_id,
      userId: auth.userId,
      deviceType,
    });

    logRequestComplete(200);
    return successResponse({ success: true, tracked: true }, corsHeaders);

  } catch (error) {
    logError('Error tracking material download', error);
    logRequestComplete(500);
    return errorResponse('Internal server error', 500, corsHeaders);
  }
});
