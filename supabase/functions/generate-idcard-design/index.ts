import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * AI Fallback Edge Function for ID Card Design Generation
 * This is only called when pre-built template generation fails
 */

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Validation helpers
function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

function sanitizeString(str: string, maxLength: number): string {
  return str.slice(0, maxLength).replace(/[<>]/g, '');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const {
      workspaceId,
      orientation = 'landscape',
      style = 'professional',
      primaryColor = '#3B82F6',
      secondaryColor = '#1E40AF',
    } = body;

    // Validate inputs
    if (!workspaceId || typeof workspaceId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'workspaceId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['landscape', 'portrait'].includes(orientation)) {
      return new Response(
        JSON.stringify({ error: 'Invalid orientation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidHexColor(primaryColor) || !isValidHexColor(secondaryColor)) {
      return new Response(
        JSON.stringify({ error: 'Invalid color format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validStyles = ['professional', 'modern', 'minimal', 'corporate', 'creative'];
    const safeStyle = validStyles.includes(style) ? style : 'professional';

    // Canvas dimensions
    const canvasWidth = orientation === 'landscape' ? 324 : 204;
    const canvasHeight = orientation === 'landscape' ? 204 : 324;

    console.log(`[AI Fallback] Generating ${safeStyle} ID card design for workspace ${workspaceId}`);

    // Generate a basic fallback design
    const canvasJSON = generateFallbackDesign(
      safeStyle,
      orientation,
      primaryColor,
      secondaryColor,
      canvasWidth,
      canvasHeight
    );

    return new Response(
      JSON.stringify({ canvasJSON }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[AI Fallback] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateFallbackDesign(
  style: string,
  orientation: string,
  primaryColor: string,
  secondaryColor: string,
  width: number,
  height: number
): object {
  const isLandscape = orientation === 'landscape';

  // Base objects common to all styles
  const baseObjects = [
    // White background
    {
      type: 'rect',
      left: 0,
      top: 0,
      width,
      height,
      fill: '#FFFFFF',
      selectable: false,
      evented: false,
    },
    // Primary accent bar at top
    {
      type: 'rect',
      left: 0,
      top: 0,
      width,
      height: isLandscape ? 50 : 60,
      fill: primaryColor,
      selectable: false,
      evented: false,
    },
    // Secondary accent line
    {
      type: 'rect',
      left: 0,
      top: isLandscape ? 50 : 60,
      width,
      height: 4,
      fill: secondaryColor,
      selectable: false,
      evented: false,
    },
  ];

  // Content objects based on orientation
  const contentObjects = isLandscape
    ? [
        // Photo placeholder
        {
          type: 'rect',
          left: 16,
          top: 65,
          width: 70,
          height: 85,
          fill: '#E5E7EB',
          stroke: '#9CA3AF',
          strokeWidth: 1,
          rx: 4,
          ry: 4,
          selectable: true,
          data: { isPlaceholder: true, placeholderType: 'photo' },
        },
        // Name
        {
          type: 'textbox',
          left: 100,
          top: 70,
          width: 140,
          text: '{name}',
          fontSize: 18,
          fontWeight: 'bold',
          fontFamily: 'Arial',
          fill: '#1F2937',
          selectable: true,
        },
        // Role
        {
          type: 'textbox',
          left: 100,
          top: 95,
          width: 140,
          text: '{role}',
          fontSize: 12,
          fontFamily: 'Arial',
          fill: '#6B7280',
          selectable: true,
        },
        // Organization
        {
          type: 'textbox',
          left: 100,
          top: 115,
          width: 140,
          text: '{organization}',
          fontSize: 10,
          fontFamily: 'Arial',
          fill: '#6B7280',
          selectable: true,
        },
        // Event name
        {
          type: 'textbox',
          left: 100,
          top: 140,
          width: 140,
          text: '{event_name}',
          fontSize: 9,
          fontFamily: 'Arial',
          fill: '#9CA3AF',
          selectable: true,
        },
        // QR Code placeholder
        {
          type: 'rect',
          left: 254,
          top: 70,
          width: 55,
          height: 55,
          fill: '#F3F4F6',
          stroke: '#9CA3AF',
          strokeWidth: 1,
          selectable: true,
          data: { isPlaceholder: true, placeholderType: 'qr' },
        },
      ]
    : [
        // Portrait layout
        // Photo placeholder
        {
          type: 'rect',
          left: 62,
          top: 75,
          width: 80,
          height: 95,
          fill: '#E5E7EB',
          stroke: '#9CA3AF',
          strokeWidth: 1,
          rx: 4,
          ry: 4,
          selectable: true,
          data: { isPlaceholder: true, placeholderType: 'photo' },
        },
        // Name
        {
          type: 'textbox',
          left: 15,
          top: 185,
          width: 174,
          text: '{name}',
          fontSize: 16,
          fontWeight: 'bold',
          fontFamily: 'Arial',
          fill: '#1F2937',
          textAlign: 'center',
          selectable: true,
        },
        // Role
        {
          type: 'textbox',
          left: 15,
          top: 210,
          width: 174,
          text: '{role}',
          fontSize: 11,
          fontFamily: 'Arial',
          fill: '#6B7280',
          textAlign: 'center',
          selectable: true,
        },
        // Organization
        {
          type: 'textbox',
          left: 15,
          top: 230,
          width: 174,
          text: '{organization}',
          fontSize: 10,
          fontFamily: 'Arial',
          fill: '#6B7280',
          textAlign: 'center',
          selectable: true,
        },
        // QR Code placeholder
        {
          type: 'rect',
          left: 72,
          top: 255,
          width: 60,
          height: 60,
          fill: '#F3F4F6',
          stroke: '#9CA3AF',
          strokeWidth: 1,
          selectable: true,
          data: { isPlaceholder: true, placeholderType: 'qr' },
        },
      ];

  return {
    version: '6.0.0',
    objects: [...baseObjects, ...contentObjects],
    background: '#FFFFFF',
    width,
    height,
  };
}
