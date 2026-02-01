import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z, uuidSchema, parseAndValidate } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for',
};

// Zod schema for page view (strict mode)
const pageViewSchema = z.object({
  event_id: uuidSchema,
  utm_source: z.string().max(255).optional().nullable(),
  utm_medium: z.string().max(255).optional().nullable(),
  utm_campaign: z.string().max(255).optional().nullable(),
  referrer: z.string().max(2048).optional().nullable(),
  user_agent: z.string().max(512).optional().nullable(),
  session_id: z.string().max(100).optional().nullable(),
  section_viewed: z.string().max(100).optional().nullable(),
}).strict();

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) { const char = ip.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; }
  return hash.toString(16);
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = rateLimitMap.get(ip);
  if (!existing || now > existing.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }); return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }; }
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) return { allowed: false, remaining: 0 };
  existing.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - existing.count };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const clientIP = getClientIP(req);
    const ipHash = hashIP(clientIP);
    const { allowed, remaining } = checkRateLimit(clientIP);
    
    if (!allowed) {
      console.log(`[RateLimit] IP ${ipHash} exceeded rate limit`);
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } });
    }

    const parseResult = await parseAndValidate(req, pageViewSchema, corsHeaders);
    if (!parseResult.success) return parseResult.response;

    const payload = parseResult.data;
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: event, error: eventError } = await supabase.from('events').select('id, status').eq('id', payload.event_id).eq('status', 'PUBLISHED').maybeSingle();
    if (eventError || !event) {
      console.log(`[PageView] Invalid event_id ${payload.event_id}`);
      return new Response(JSON.stringify({ error: 'Event not found or not published' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error: insertError } = await supabase.from('event_page_views').insert({ event_id: payload.event_id, utm_source: payload.utm_source || null, utm_medium: payload.utm_medium || null, utm_campaign: payload.utm_campaign || null, referrer: payload.referrer || null, user_agent: payload.user_agent || null, session_id: payload.session_id || null, section_viewed: payload.section_viewed || null, ip_hash: ipHash });

    if (insertError) {
      console.error('[PageView] Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to record page view' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[PageView] Recorded view for event ${payload.event_id}`);
    return new Response(JSON.stringify({ success: true, remaining }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-RateLimit-Remaining': remaining.toString() } });
  } catch (error) {
    console.error('[PageView] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
