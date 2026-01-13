import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Predefined valid values
const VALID_CERTIFICATE_TYPES = ['Completion', 'Achievement', 'Participation', 'Excellence', 'Appreciation'];
const VALID_STYLES = ['elegant', 'modern', 'corporate', 'creative', 'academic'];
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

// Input limits
const MAX_EVENT_THEME_LENGTH = 200;
const MAX_ADDITIONAL_NOTES_LENGTH = 500;

interface GenerateDesignRequest {
  eventTheme: string;
  certificateType: string;
  primaryColor?: string;
  secondaryColor?: string;
  style?: string;
  additionalNotes?: string;
  workspaceId: string;
}

function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function hashIP(ip: string): string {
  // Simple hash for privacy-preserving logs
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substring(0, 8);
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || record.resetTime < now) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count, resetIn: record.resetTime - now };
}

function sanitizeString(input: string): string {
  // Remove control characters and potential prompt injection patterns
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[{}[\]]/g, '') // Remove JSON-like brackets that could interfere
    .trim();
}

function validateInput(body: GenerateDesignRequest): { success: boolean; error?: string; sanitized?: GenerateDesignRequest } {
  // Required field: workspaceId
  if (!body.workspaceId || typeof body.workspaceId !== 'string') {
    return { success: false, error: "Workspace ID is required" };
  }

  // Required field: eventTheme
  if (!body.eventTheme || typeof body.eventTheme !== 'string') {
    return { success: false, error: "Event theme is required" };
  }

  const eventTheme = sanitizeString(body.eventTheme);
  if (eventTheme.length === 0) {
    return { success: false, error: "Event theme cannot be empty" };
  }
  if (eventTheme.length > MAX_EVENT_THEME_LENGTH) {
    return { success: false, error: `Event theme must be less than ${MAX_EVENT_THEME_LENGTH} characters` };
  }

  // Validate certificate type
  const certificateType = body.certificateType || 'Completion';
  if (!VALID_CERTIFICATE_TYPES.includes(certificateType)) {
    return { success: false, error: `Invalid certificate type. Must be one of: ${VALID_CERTIFICATE_TYPES.join(', ')}` };
  }

  // Validate style
  const style = body.style || 'elegant';
  if (!VALID_STYLES.includes(style)) {
    return { success: false, error: `Invalid style. Must be one of: ${VALID_STYLES.join(', ')}` };
  }

  // Validate colors
  const primaryColor = body.primaryColor || '#1a365d';
  const secondaryColor = body.secondaryColor || '#c9a227';
  
  if (!HEX_COLOR_REGEX.test(primaryColor)) {
    return { success: false, error: "Primary color must be a valid hex color (e.g., #1a365d)" };
  }
  if (!HEX_COLOR_REGEX.test(secondaryColor)) {
    return { success: false, error: "Secondary color must be a valid hex color (e.g., #c9a227)" };
  }

  // Validate additional notes (optional)
  let additionalNotes = '';
  if (body.additionalNotes) {
    additionalNotes = sanitizeString(body.additionalNotes);
    if (additionalNotes.length > MAX_ADDITIONAL_NOTES_LENGTH) {
      return { success: false, error: `Additional notes must be less than ${MAX_ADDITIONAL_NOTES_LENGTH} characters` };
    }
  }

  return {
    success: true,
    sanitized: {
      workspaceId: body.workspaceId,
      eventTheme,
      certificateType,
      primaryColor,
      secondaryColor,
      style,
      additionalNotes,
    }
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const hashedIP = hashIP(clientIP);

  try {
    // 1. Rate limiting check (before any processing)
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      console.log(`[RATE_LIMIT] IP: ${hashedIP}, resetIn: ${rateLimit.resetIn}ms`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a minute and try again." }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(rateLimit.resetIn / 1000).toString()
          } 
        }
      );
    }

    // 2. Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log(`[AUTH_FAIL] IP: ${hashedIP}, reason: No authorization header`);
      return new Response(
        JSON.stringify({ error: "Please sign in to use AI design" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's auth
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: userData, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !userData?.user) {
      console.log(`[AUTH_FAIL] IP: ${hashedIP}, reason: Invalid token`);
      return new Response(
        JSON.stringify({ error: "Please sign in to use AI design" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;

    // 3. Parse and validate input
    const body = await req.json() as GenerateDesignRequest;
    const validation = validateInput(body);
    
    if (!validation.success) {
      console.log(`[VALIDATION_FAIL] user: ${userId}, error: ${validation.error}`);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { workspaceId, eventTheme, certificateType, primaryColor, secondaryColor, style, additionalNotes } = validation.sanitized!;

    // 4. Authorization check - verify user has certificate design permission
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: hasPermission, error: permError } = await serviceClient
      .rpc("has_certificate_permission", {
        _workspace_id: workspaceId,
        _permission: 'design',
        _user_id: userId,
      });

    if (permError) {
      console.error(`[AUTHZ_ERROR] user: ${userId}, workspace: ${workspaceId}, error:`, permError);
      return new Response(
        JSON.stringify({ error: "Authorization check failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!hasPermission) {
      console.log(`[AUTHZ_FAIL] user: ${userId}, workspace: ${workspaceId}, permission: design`);
      return new Response(
        JSON.stringify({ error: "You don't have permission to design certificates for this workspace" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Generate design with AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[CONFIG_ERROR] LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log(`[AI_REQUEST] user: ${userId}, workspace: ${workspaceId}, type: ${certificateType}, style: ${style}`);

    // Style-specific design guidelines
    const styleGuidelines: Record<string, string> = {
      elegant: `
- Use serif fonts like "Georgia", "Playfair Display", or "Times New Roman" for headers
- Add ornate corner decorations with curved lines and flourishes
- Include a gold/bronze accent gradient effect using multiple layered shapes
- Create a double or triple border frame with elegant spacing
- Add subtle decorative dividers between sections
- Use italics for secondary text elements`,
      modern: `
- Use clean sans-serif fonts like "Helvetica", "Arial", or "Montserrat"
- Create bold geometric shapes as accent elements (circles, rectangles with rounded corners)
- Use asymmetric layouts with left or right alignment
- Add a bold accent stripe or gradient bar across one edge
- Minimize decorative elements - let whitespace do the work
- Use large, bold typography for the title with tight letter spacing`,
      corporate: `
- Use professional sans-serif fonts like "Arial", "Calibri", or "Open Sans"
- Create a clean header bar with the primary color
- Add a subtle watermark pattern in the background
- Include a formal seal placeholder (circle with inner circle)
- Use structured, centered alignment throughout
- Add horizontal rule dividers between sections`,
      creative: `
- Use playful display fonts for headers
- Add vibrant gradient backgrounds using multiple overlapping shapes
- Include artistic brush stroke effects (irregular rectangles/shapes)
- Create dynamic diagonal or curved accent elements
- Use bold, contrasting colors throughout
- Add decorative confetti or abstract shapes in corners`,
      academic: `
- Use traditional serif fonts like "Times New Roman" or "Garamond"
- Include a formal laurel wreath or similar classical decoration (using shapes)
- Add a formal seal at the bottom center
- Use a parchment-like off-white background color (#faf8f5)
- Include formal horizontal rules with decorative ends
- Create a classic double-line border frame`,
    };

    const systemPrompt = `You are an award-winning certificate designer creating stunning, professional Fabric.js canvas JSON designs.

CANVAS SPECIFICATIONS:
- Dimensions: 842x595 pixels (A4 landscape at 72 DPI)
- Background: Use a gradient effect by layering rectangles, or a solid elegant color

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - no markdown, no explanation, no backticks
2. The response must be a complete Fabric.js canvas JSON object
3. Use these EXACT dynamic placeholders in text: {recipient_name}, {event_name}, {issue_date}, {certificate_id}

DESIGN EXCELLENCE GUIDELINES:
${styleGuidelines[style as keyof typeof styleGuidelines] || styleGuidelines.elegant}

FABRIC.JS OBJECT SPECIFICATIONS:
- Canvas structure: { "version": "6.0.0", "objects": [...] }
- Text objects: Use type "i-text" with: left, top, text, fontSize, fontFamily, fill, fontWeight, textAlign, originX, originY, charSpacing, lineHeight
- Rectangles: type "rect" with: left, top, width, height, fill, stroke, strokeWidth, rx, ry (for rounded corners), angle, opacity
- Circles: type "circle" with: left, top, radius, fill, stroke, strokeWidth, opacity
- Lines: type "line" with: x1, y1, x2, y2, stroke, strokeWidth, opacity

VISUAL HIERARCHY (from most to least prominent):
1. Recipient name: 36-48px, bold, primary color, center - THE STAR of the design
2. Certificate title: 28-36px, uppercase, letterSpacing: 200-400
3. Event name: 20-24px, secondary emphasis
4. Supporting text: 14-16px, subtle coloring
5. Date and ID: 10-12px, footer positioning

LAYERING ORDER (bottom to top):
1. Background shapes/gradients
2. Border frames and decorative elements
3. Accent shapes and dividers
4. Text content (supporting → main → title)

COLORS TO USE:
- Primary: ${primaryColor}
- Secondary/Accent: ${secondaryColor}
- Text Dark: #1a1a2e (for main text)
- Text Light: #4a4a68 (for supporting text)
- Background: #ffffff or subtle tint of primary

CREATE A VISUALLY STUNNING DESIGN THAT:
- Has clear visual hierarchy guiding the eye
- Uses the primary color strategically (not overwhelming)
- Includes at least 3-4 decorative elements (borders, shapes, dividers)
- Balances whitespace with content
- Feels premium and worth framing`;

    const userPrompt = `Design a stunning "${certificateType}" certificate for:

EVENT: ${eventTheme}
STYLE: ${style} - apply the style guidelines precisely
PRIMARY COLOR: ${primaryColor}
ACCENT COLOR: ${secondaryColor}
${additionalNotes ? `SPECIAL REQUESTS: ${additionalNotes}` : ''}

Required elements:
1. DECORATIVE FRAME: Create an impressive border (double-line, ornate corners, or modern geometric)
2. TITLE: "Certificate of ${certificateType}" - make it commanding
3. RECIPIENT PLACEHOLDER: "{recipient_name}" - this should be the visual centerpiece, styled beautifully
4. BODY TEXT: "This certificate is presented to" or similar elegant phrasing
5. EVENT PLACEHOLDER: "{event_name}" - styled to complement the recipient name
6. ACHIEVEMENT TEXT: Describe what was achieved (e.g., "for outstanding participation in", "for successful completion of")
7. DATE: "{issue_date}" positioned elegantly
8. CERTIFICATE ID: "{certificate_id}" small and subtle at the bottom
9. SIGNATURE AREA: A line with "Authorized Signature" text below
10. DECORATIVE ACCENTS: Add style-appropriate flourishes, shapes, or design elements

Make this certificate look like something people would proudly display. Return ONLY the JSON object.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.log(`[AI_RATE_LIMIT] user: ${userId}, workspace: ${workspaceId}`);
        return new Response(
          JSON.stringify({ error: "AI service rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.log(`[AI_CREDITS] user: ${userId}, workspace: ${workspaceId}`);
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error(`[AI_ERROR] user: ${userId}, status: ${response.status}, error:`, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error(`[AI_ERROR] user: ${userId}, reason: No content received`);
      throw new Error("No content received from AI");
    }

    // Parse the JSON from the response (handle markdown code blocks if present)
    let canvasJSON;
    try {
      let jsonString = content.trim();
      if (jsonString.startsWith("```")) {
        jsonString = jsonString.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
      }
      canvasJSON = JSON.parse(jsonString);
    } catch (parseError) {
      console.error(`[PARSE_ERROR] user: ${userId}, content:`, content.substring(0, 200));
      throw new Error("Failed to parse AI-generated design");
    }

    console.log(`[AI_SUCCESS] user: ${userId}, workspace: ${workspaceId}, type: ${certificateType}`);

    return new Response(
      JSON.stringify({ canvasJSON }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[ERROR] IP: ${hashedIP}, error:`, error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
