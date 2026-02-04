import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  corsHeaders,
  validateAuth,
  checkRateLimit,
  sanitizeString,
  validateUUID,
  errorResponse,
  successResponse,
  initRequestContext,
  logInfo,
  logError,
  logRequestComplete,
} from "../_shared/security.ts";

// =============================================
// TYPES
// =============================================
interface InteractionEvent {
  target_user_id?: string;
  event_id?: string;
  event_type: string;
  metadata?: Record<string, unknown>;
}

interface BatchRequest {
  events: InteractionEvent[];
}

interface ExperimentAttribution {
  experiment_id: string | null;
  variant: string | null;
  impression_id: string | null;
}

// Valid event types (must match database constraint)
const VALID_EVENT_TYPES = new Set([
  'profile_view', 'profile_expand', 'dwell_time', 'scroll_past',
  'skip', 'save', 'follow', 'unfollow',
  'message_sent', 'message_replied', 'message_read',
  'meeting_requested', 'meeting_accepted', 'meeting_declined',
  'contact_exchanged', 'profile_shared',
  'session_bookmark', 'session_attended', 'qa_asked',
  // AI matching specific events
  'ai_match_detail_open', 'ai_conversation_starter_tap', 
  'ai_collaboration_idea_tap', 'card_tap'
]);

// High-value conversion events for attribution tracking
const CONVERSION_EVENTS = new Set([
  'follow', 'save', 'message_sent', 'message_replied',
  'meeting_requested', 'meeting_accepted', 'contact_exchanged',
  'ai_conversation_starter_tap', 'ai_collaboration_idea_tap'
]);

// Attribution window in hours (24 hours)
const ATTRIBUTION_WINDOW_HOURS = 24;

// =============================================
// VALIDATION
// =============================================
function validateEvent(event: InteractionEvent): { valid: true; data: InteractionEvent } | { valid: false; error: string } {
  // Validate event_type
  if (!event.event_type || typeof event.event_type !== 'string') {
    return { valid: false, error: 'event_type is required' };
  }
  
  if (!VALID_EVENT_TYPES.has(event.event_type)) {
    return { valid: false, error: `Invalid event_type: ${event.event_type}` };
  }
  
  // Validate target_user_id if provided
  if (event.target_user_id && !validateUUID(event.target_user_id)) {
    return { valid: false, error: 'Invalid target_user_id format' };
  }
  
  // Validate event_id if provided
  if (event.event_id && !validateUUID(event.event_id)) {
    return { valid: false, error: 'Invalid event_id format' };
  }
  
  // Sanitize metadata
  const sanitizedMetadata: Record<string, unknown> = {};
  if (event.metadata && typeof event.metadata === 'object') {
    for (const [key, value] of Object.entries(event.metadata)) {
      const sanitizedKey = sanitizeString(key, 50);
      if (typeof value === 'string') {
        sanitizedMetadata[sanitizedKey] = sanitizeString(value, 500);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitizedMetadata[sanitizedKey] = value;
      }
    }
  }
  
  return {
    valid: true,
    data: {
      target_user_id: event.target_user_id,
      event_id: event.event_id,
      event_type: event.event_type,
      metadata: sanitizedMetadata
    }
  };
}

// =============================================
// EXPERIMENT ATTRIBUTION
// =============================================
interface ImpressionRow {
  id: string;
  experiment_id: string | null;
  variant: string | null;
}

// deno-lint-ignore no-explicit-any
async function getExperimentAttribution(
  supabase: any,
  userId: string,
  targetUserId: string
): Promise<ExperimentAttribution> {
  const noAttribution: ExperimentAttribution = {
    experiment_id: null,
    variant: null,
    impression_id: null
  };

  try {
    // Look for recent impression that included this target user
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - ATTRIBUTION_WINDOW_HOURS);

    const { data, error } = await supabase
      .from('ai_match_impressions')
      .select('id, experiment_id, variant')
      .eq('user_id', userId)
      .contains('match_user_ids', [targetUserId])
      .gte('created_at', cutoffTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return noAttribution;
    }

    const impression = data as ImpressionRow;

    return {
      experiment_id: impression.experiment_id,
      variant: impression.variant,
      impression_id: impression.id
    };
  } catch (e) {
    logError('Failed to get experiment attribution', e);
    return noAttribution;
  }
}

// =============================================
// MAIN HANDLER
// =============================================
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = initRequestContext('track-interaction');

  try {
    // 1. Authentication
    const auth = await validateAuth(req);
    if (!auth.authenticated || !auth.userId) {
      logRequestComplete(401);
      return errorResponse('Unauthorized', 401, corsHeaders);
    }

    // 2. Rate limiting (100 events per minute per user)
    const rateCheck = checkRateLimit(auth.userId, 'track-interaction', { maxRequests: 100, windowMs: 60000 });
    if (!rateCheck.allowed) {
      logRequestComplete(429);
      return errorResponse('Rate limit exceeded', 429, corsHeaders);
    }

    // 3. Parse and validate request
    const body = await req.json() as BatchRequest;
    
    if (!body.events || !Array.isArray(body.events)) {
      logRequestComplete(400);
      return errorResponse('events array is required', 400, corsHeaders);
    }
    
    if (body.events.length > 50) {
      logRequestComplete(400);
      return errorResponse('Maximum 50 events per batch', 400, corsHeaders);
    }
    
    // Validate all events
    const validatedEvents: InteractionEvent[] = [];
    for (const event of body.events) {
      const validation = validateEvent(event);
      if (!validation.valid) {
        logRequestComplete(400);
        return errorResponse(validation.error, 400, corsHeaders);
      }
      validatedEvents.push(validation.data);
    }

    // 4. Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 5. Get experiment attribution for conversion events
    const attributionCache = new Map<string, ExperimentAttribution>();
    
    for (const event of validatedEvents) {
      if (CONVERSION_EVENTS.has(event.event_type) && event.target_user_id) {
        if (!attributionCache.has(event.target_user_id)) {
          const attribution = await getExperimentAttribution(
            supabase,
            auth.userId,
            event.target_user_id
          );
          attributionCache.set(event.target_user_id, attribution);
        }
      }
    }

    // 6. Build insert data with attribution
    const insertData = validatedEvents.map(event => {
      const attribution = event.target_user_id 
        ? attributionCache.get(event.target_user_id) 
        : null;
      
      const metadata = {
        ...(event.metadata || {}),
        // Add attribution data for conversion events
        ...(CONVERSION_EVENTS.has(event.event_type) && attribution?.experiment_id ? {
          experiment_id: attribution.experiment_id,
          experiment_variant: attribution.variant,
          impression_id: attribution.impression_id,
          attributed: true
        } : {})
      };

      return {
        user_id: auth.userId,
        target_user_id: event.target_user_id || null,
        event_id: event.event_id || null,
        event_type: event.event_type,
        metadata
      };
    });

    // 7. Insert events
    const { error: insertError } = await supabase
      .from('user_interaction_events')
      .insert(insertData);

    if (insertError) {
      logError('Failed to insert interaction events', insertError);
      logRequestComplete(500);
      return errorResponse('Failed to track interactions', 500, corsHeaders);
    }

    // 8. Log attribution stats
    const attributedCount = insertData.filter(d => d.metadata?.attributed).length;
    logInfo('Tracked interactions', { 
      userId: auth.userId, 
      eventCount: validatedEvents.length,
      attributedCount,
      conversionEvents: insertData.filter(d => CONVERSION_EVENTS.has(d.event_type)).length
    });
    
    logRequestComplete(200);
    return successResponse({ 
      success: true, 
      tracked: validatedEvents.length,
      attributed: attributedCount
    }, corsHeaders);

  } catch (error) {
    logError('Track interaction error', error);
    logRequestComplete(500);
    return errorResponse('Internal server error', 500, corsHeaders);
  }
});
