import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for',
};

// In-memory rate limiting (per IP, resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

interface PageViewPayload {
  event_id: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer?: string | null;
  user_agent?: string | null;
  session_id?: string | null;
  section_viewed?: string | null;
}

function getClientIP(req: Request): string {
  // Check various headers for client IP
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

function hashIP(ip: string): string {
  // Simple hash for privacy - don't store raw IP
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = ip;
  
  const existing = rateLimitMap.get(key);
  
  if (!existing || now > existing.resetAt) {
    // New window
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  
  existing.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - existing.count };
}

// Clean up old entries periodically to prevent memory leaks
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const clientIP = getClientIP(req);
    const ipHash = hashIP(clientIP);
    
    // Check rate limit
    const { allowed, remaining } = checkRateLimit(clientIP);
    
    if (!allowed) {
      console.log(`[RateLimit] IP ${ipHash} exceeded rate limit`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0',
          } 
        }
      );
    }

    // Parse and validate payload
    const payload: PageViewPayload = await req.json();
    
    if (!payload.event_id) {
      return new Response(
        JSON.stringify({ error: 'event_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(payload.event_id)) {
      return new Response(
        JSON.stringify({ error: 'Invalid event_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input lengths to prevent abuse
    const maxLength = 255;
    if (payload.utm_source && payload.utm_source.length > maxLength) {
      payload.utm_source = payload.utm_source.substring(0, maxLength);
    }
    if (payload.utm_medium && payload.utm_medium.length > maxLength) {
      payload.utm_medium = payload.utm_medium.substring(0, maxLength);
    }
    if (payload.utm_campaign && payload.utm_campaign.length > maxLength) {
      payload.utm_campaign = payload.utm_campaign.substring(0, maxLength);
    }
    if (payload.referrer && payload.referrer.length > 2048) {
      payload.referrer = payload.referrer.substring(0, 2048);
    }
    if (payload.user_agent && payload.user_agent.length > 512) {
      payload.user_agent = payload.user_agent.substring(0, 512);
    }

    // Create Supabase client with service role for insertion
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First verify the event exists and is published (extra validation beyond RLS)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, status')
      .eq('id', payload.event_id)
      .eq('status', 'PUBLISHED')
      .maybeSingle();

    if (eventError || !event) {
      console.log(`[PageView] Invalid event_id ${payload.event_id}: not found or not published`);
      return new Response(
        JSON.stringify({ error: 'Event not found or not published' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert page view
    const { error: insertError } = await supabase
      .from('event_page_views')
      .insert({
        event_id: payload.event_id,
        utm_source: payload.utm_source || null,
        utm_medium: payload.utm_medium || null,
        utm_campaign: payload.utm_campaign || null,
        referrer: payload.referrer || null,
        user_agent: payload.user_agent || null,
        session_id: payload.session_id || null,
        section_viewed: payload.section_viewed || null,
        ip_hash: ipHash,
      });

    if (insertError) {
      console.error('[PageView] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to record page view' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cleanup old rate limit entries occasionally
    if (Math.random() < 0.1) {
      cleanupRateLimitMap();
    }

    console.log(`[PageView] Recorded view for event ${payload.event_id} from IP hash ${ipHash}`);
    
    return new Response(
      JSON.stringify({ success: true, remaining }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': remaining.toString(),
        } 
      }
    );

  } catch (error) {
    console.error('[PageView] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
