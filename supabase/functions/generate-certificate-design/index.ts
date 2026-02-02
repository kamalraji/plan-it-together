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

    // Enhanced background styles with rich layering
    const backgroundStyles: Record<string, string> = {
      elegant: `
BACKGROUND LAYERS (create ALL in this exact order):
1. Base: White rectangle (842x595) as foundation
2. Radial gradient simulation: Large circle (radius 500+) centered at (421, 297) with primaryColor at 3-5% opacity
3. Vignette: 4 rectangles at edges with primaryColor at 2-4% opacity, darker at corners
4. Subtle texture: 30-50 small circles (radius 1-3px) scattered randomly with 2-5% opacity
5. Inner glow: Centered rectangle (780x540) with white fill at 30% opacity for luminous center`,
      modern: `
BACKGROUND LAYERS (create ALL in this exact order):
1. Base: Pure white rectangle (842x595)
2. Bold accent zone: Large angled rectangle (width 400, height 800, angle -15deg) positioned left with primaryColor at 8-12% opacity
3. Secondary accent: Circle (radius 300) at top-right corner with secondaryColor at 5-8% opacity
4. Grid pattern: 10-15 horizontal lines (stroke 0.5px, 2% opacity) evenly spaced
5. Floating elements: 5-8 circles of varying sizes (20-80px) scattered with 3-8% opacity`,
      corporate: `
BACKGROUND LAYERS (create ALL in this exact order):
1. Base: Subtle gradient from white to #f8f9fa (use 2 overlapping rectangles)
2. Header band: Rectangle at top (842x60) with primaryColor at 15% opacity
3. Footer accent: Thin rectangle at bottom (842x4) with primaryColor at 40% opacity
4. Watermark seal: Large circle (radius 150) centered with primaryColor at 3% opacity
5. Corner badges: 4 small triangular shapes in corners with secondaryColor at 10% opacity`,
      creative: `
BACKGROUND LAYERS (create ALL in this exact order):
1. Base: White rectangle
2. Gradient splash: 3-4 large overlapping circles (radius 200-400) in different positions with primaryColor and secondaryColor at 8-15% opacity
3. Brush strokes: 2-3 large rounded rectangles (rx: 100+) rotated at 15-45 degrees with colors at 10% opacity
4. Splatter: 20-30 small circles (radius 5-30) randomly positioned with varying opacities (5-20%)
5. Confetti: 15-20 small rectangles (10x3px) at random angles in corners`,
      academic: `
BACKGROUND LAYERS (create ALL in this exact order):
1. Base: Warm parchment color rectangle (#faf8f3)
2. Aged effect: 5-8 rectangles with slight color variations (#f5f0e6, #faf5eb) at 10-30% opacity
3. Inner shadow: Rectangle border effect using 4 rectangles with darker tones at edges (3% opacity)
4. Classical frame zone: Inner rectangle (780x540) with slightly lighter fill
5. Texture dots: 40-60 tiny circles (radius 1px) in warm brown (#d4c5a9) at 3-5% opacity`,
    };

    // Decorative elements library for AI reference
    const decorativeElements = `
DECORATIVE ELEMENT TEMPLATES (adapt and use these):

ELEGANT CORNER FLOURISH (place in each corner, rotate appropriately):
- Outer arc: circle, radius 60, stroke only, strokeWidth 1.5, primaryColor at 60% opacity
- Inner arc: circle, radius 45, stroke only, strokeWidth 1, secondaryColor at 50% opacity
- Accent dot: circle, radius 4, solid fill, secondaryColor

ORNATE BORDER (for elegant/academic):
- Outer frame: rect, stroke 2px, primaryColor, no fill
- Inner frame: rect, 15px inset, stroke 1px, secondaryColor
- Corner squares: 4 small rects (8x8) at corners of inner frame
- Decorative dots: circles between frames at midpoints

MODERN ACCENT BAR:
- Main bar: rect, width 8, height 400, primaryColor, positioned at left edge (left: 30)
- Accent circles: 3 circles (radius 6, 4, 2) stacked vertically on bar

SEAL/MEDALLION (for bottom right):
- Outer ring: circle, radius 45, stroke 2.5px, secondaryColor, no fill
- Middle ring: circle, radius 35, stroke 1.5px, secondaryColor at 70%, no fill
- Inner circle: circle, radius 25, fill secondaryColor at 15%
- Center dot: circle, radius 8, fill secondaryColor at 40%

DECORATIVE DIVIDER (horizontal separator):
- Main line: line, 300px wide, centered, stroke 1px, secondaryColor at 50%
- Center diamond: small rect (8x8), rotated 45deg, filled secondaryColor
- End dots: 2 circles (radius 3) at line ends

RIBBON BANNER (behind title):
- Main ribbon: rect, 320x45, primaryColor at 85%
- Shadow: rect, 324x49, positioned 2px down/right, dark color at 15%

LAUREL LEAVES (for academic - create 6-8 on each side):
- Single leaf: ellipse-like shape using circle with scaleX: 0.4, rotated, green-gold tone`;

    // Style-specific comprehensive design guidelines
    const styleGuidelines: Record<string, string> = {
      elegant: `
ELEGANT STYLE - Luxurious & Refined
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYPOGRAPHY:
- Title font: "Georgia" or "Playfair Display", uppercase, letterSpacing: 300-500
- Recipient name: "Georgia", bold, 42-48px, primaryColor
- Body text: "Georgia" italic for "presented to", regular for descriptions
- Footer: "Georgia", 11px, subtle gray

COLOR STRATEGY:
- Primary (${primaryColor}): Title, recipient name, outer border
- Secondary (${secondaryColor}): Decorative accents, inner borders, seal, flourishes
- Use gold/bronze tones for secondary if applicable

MANDATORY DECORATIVE ELEMENTS:
1. Double or triple border frame with elegant proportions
2. Ornate corner flourishes in ALL 4 corners (curved lines, dots, arcs)
3. Decorative horizontal dividers above and below recipient name
4. Elegant seal/medallion in bottom right
5. Signature line with subtle decorative ends
6. Small flourishes near "Certificate of" title`,

      modern: `
MODERN STYLE - Bold & Contemporary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYPOGRAPHY:
- Title font: "Helvetica", "Arial", or "Montserrat", bold, uppercase, letterSpacing: 400-600
- Recipient name: Bold, 44-52px, can use primaryColor or dark gray
- Body text: Light weight, generous line spacing
- Footer: Minimal, small, right-aligned

COLOR STRATEGY:
- Primary (${primaryColor}): One bold accent element (bar, shape, title background)
- Keep most of design black/white/gray with PRIMARY as the pop of color
- Secondary (${secondaryColor}): Subtle accent only

MANDATORY DECORATIVE ELEMENTS:
1. Bold accent bar or stripe on left or top edge (8-12px wide)
2. Large geometric shape as visual anchor (circle or rectangle) with low opacity
3. Clean single-line border OR no border (rely on spacing)
4. Modern seal: simple concentric circles, minimal
5. Strong typographic hierarchy - let the TYPE be the decoration`,

      corporate: `
CORPORATE STYLE - Professional & Trustworthy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYPOGRAPHY:
- Title font: "Arial", "Open Sans", or "Calibri", uppercase, letterSpacing: 200-300
- Recipient name: "Arial" bold, 38-44px, dark blue or primaryColor
- Body text: Professional, 14-16px, well-spaced
- Footer: Structured layout with date left, ID right

COLOR STRATEGY:
- Primary (${primaryColor}): Header band, main borders, seal
- Secondary (${secondaryColor}): Subtle accents, signature line
- Professional navy, deep blue, or forest green recommended

MANDATORY DECORATIVE ELEMENTS:
1. Color header band spanning width (60-80px tall, 10-20% opacity)
2. Matching footer line or band
3. Formal rectangular border (single or double)
4. Official-looking seal with organization/event feel
5. Structured horizontal dividers
6. "Authorized Signature" and "Date" labels`,

      creative: `
CREATIVE STYLE - Vibrant & Expressive
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYPOGRAPHY:
- Title font: Display font, can be playful, colorful fill
- Recipient name: BOLD and COLORFUL, 46-54px, can use gradient simulation
- Body text: Friendly, approachable tone
- Footer: Casual, can break alignment conventions

COLOR STRATEGY:
- Primary (${primaryColor}): Use BOLDLY - backgrounds, shapes, text
- Secondary (${secondaryColor}): Complement and contrast
- Don't be afraid of color - this style celebrates it!

MANDATORY DECORATIVE ELEMENTS:
1. Dynamic multi-color background with overlapping shapes and gradients
2. Abstract brush stroke shapes (large rounded rectangles at angles)
3. Confetti/celebration elements in corners (small shapes, varying colors)
4. Playful, irregular border OR border-free design
5. Color splashes and abstract decorations
6. Whimsical dividers (wavy lines, dots, stars)`,

      academic: `
ACADEMIC STYLE - Scholarly & Distinguished
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TYPOGRAPHY:
- Title font: "Times New Roman", "Garamond", uppercase, letterSpacing: 200-400
- Recipient name: "Times New Roman", bold italic or bold, 40-46px
- Body text: Formal language, "Be it known that...", "has hereby..."
- Footer: Traditional layout, formal date format

COLOR STRATEGY:
- Primary (${primaryColor}): Navy blue, deep maroon, or forest green
- Secondary (${secondaryColor}): Gold, bronze, or warm metallic tone
- Background: Parchment/cream (#faf8f3 or #f5f0e6)

MANDATORY DECORATIVE ELEMENTS:
1. Classical double or triple border with proper proportions
2. Laurel wreath or branches flanking the seal or recipient name
3. Formal central crest or institutional seal placeholder
4. Greek key pattern OR elegant corner medallions
5. Distinguished horizontal rules with serif ends
6. Ribbon or banner element behind title`,
    };

    const systemPrompt = `You are a WORLD-CLASS certificate designer creating AWARD-WINNING Fabric.js canvas JSON designs. Your designs are so beautiful that people frame them and display them proudly.

CANVAS: 842x595 pixels (A4 landscape)

⚠️ CRITICAL: Return ONLY valid JSON. No markdown. No backticks. No explanation. JUST the JSON object.

═══════════════════════════════════════════════════════════════════
BACKGROUND CREATION - MANDATORY (Create minimum 5-8 background objects)
═══════════════════════════════════════════════════════════════════
${backgroundStyles[style as keyof typeof backgroundStyles] || backgroundStyles.elegant}

═══════════════════════════════════════════════════════════════════
STYLE-SPECIFIC DESIGN GUIDELINES
═══════════════════════════════════════════════════════════════════
${styleGuidelines[style as keyof typeof styleGuidelines] || styleGuidelines.elegant}

═══════════════════════════════════════════════════════════════════
DECORATIVE ELEMENTS LIBRARY
═══════════════════════════════════════════════════════════════════
${decorativeElements}

═══════════════════════════════════════════════════════════════════
FABRIC.JS TECHNICAL SPECIFICATIONS
═══════════════════════════════════════════════════════════════════
Canvas structure: { "version": "6.0.0", "objects": [...] }

OBJECT TYPES:
- "i-text": { type, left, top, text, fontSize, fontFamily, fill, fontWeight, fontStyle, textAlign, originX, originY, charSpacing, lineHeight, opacity }
- "rect": { type, left, top, width, height, fill, stroke, strokeWidth, rx, ry, angle, opacity, originX, originY }
- "circle": { type, left, top, radius, fill, stroke, strokeWidth, opacity, scaleX, scaleY }
- "line": { type, x1, y1, x2, y2, stroke, strokeWidth, opacity }

GRADIENT SIMULATION (since Fabric.js gradients are complex):
Layer multiple semi-transparent shapes to create gradient effects.
Example radial gradient: Large circle (radius 400+) with fill at 5% opacity creates soft glow.

═══════════════════════════════════════════════════════════════════
OBJECT LAYERING ORDER (Bottom to Top - CRITICAL!)
═══════════════════════════════════════════════════════════════════
1. Background base rectangle (#ffffff or style-appropriate)
2. Gradient overlay shapes (2-5 layers with varying opacity)
3. Texture elements (dots, patterns, subtle shapes)
4. Vignette/edge effects
5. Outer border frame
6. Inner border frame and decorative borders
7. Corner decorations (flourishes, ornaments)
8. Accent shapes and dividers
9. Background shapes for text (ribbons, banners)
10. Title and header text
11. Recipient name (THE STAR - most prominent)
12. Body text and descriptions
13. Event name and details
14. Footer text (date, ID)
15. Seal/medallion
16. Signature line and label

═══════════════════════════════════════════════════════════════════
VISUAL HIERARCHY
═══════════════════════════════════════════════════════════════════
1. RECIPIENT NAME: 42-52px, BOLD, primaryColor - THE VISUAL STAR
2. CERTIFICATE TITLE: 24-32px, uppercase, letterSpacing 200-500
3. EVENT NAME: 18-22px, secondary emphasis
4. BODY TEXT: 13-16px, supporting role
5. FOOTER: 10-12px, subtle, structured

═══════════════════════════════════════════════════════════════════
COLORS
═══════════════════════════════════════════════════════════════════
- Primary: ${primaryColor}
- Secondary: ${secondaryColor}
- Text Dark: #1a1a2e
- Text Medium: #3a3a58
- Text Light: #6a6a88
- Background: #ffffff or style-appropriate

═══════════════════════════════════════════════════════════════════
PLACEHOLDERS (Use exactly as shown)
═══════════════════════════════════════════════════════════════════
{recipient_name}, {event_name}, {issue_date}, {certificate_id}

═══════════════════════════════════════════════════════════════════
DESIGN EXCELLENCE CHECKLIST
═══════════════════════════════════════════════════════════════════
✓ Minimum 20-30 objects for visual richness
✓ Rich, layered background with gradient effects
✓ At least 6-8 decorative elements
✓ 4 corner decorations
✓ Clear visual hierarchy
✓ Beautiful typography with proper spacing
✓ Professional seal/medallion
✓ Elegant signature area
✓ Perfect balance and alignment
✓ Premium, frame-worthy appearance`;

    const userPrompt = `Create a STUNNING "${certificateType}" certificate:

🎨 EVENT: ${eventTheme}
🎭 STYLE: ${(style || 'elegant').toUpperCase()}
🎯 PRIMARY COLOR: ${primaryColor}
✨ SECONDARY COLOR: ${secondaryColor}
${additionalNotes ? `📝 SPECIAL REQUESTS: ${additionalNotes}` : ''}

══════════════════════════════════════════════════════════════════
MANDATORY ELEMENTS TO CREATE (in layering order):
══════════════════════════════════════════════════════════════════

1. 🖼️ RICH BACKGROUND (minimum 5-8 objects):
   □ Base rectangle with appropriate color
   □ 2-3 gradient simulation layers (circles/rects at low opacity)
   □ Subtle texture or pattern elements
   □ Vignette or edge treatment
   □ Any style-specific background elements

2. 🖼️ IMPRESSIVE BORDER FRAME:
   □ Outer decorative border
   □ Inner accent border (different style/color)
   □ Corner ornaments or flourishes in ALL 4 corners

3. ✨ DECORATIVE ACCENTS (minimum 6):
   □ Header decoration or embellishment
   □ Divider line above recipient name (with center accent)
   □ Divider line below recipient name
   □ Decorative elements near title
   □ Accent shapes complementing the style
   □ Small flourishes or dots as needed

4. 📝 TEXT CONTENT:
   □ "Certificate of ${certificateType}" - commanding title with styling
   □ "This is to certify that" or elegant preamble
   □ "{recipient_name}" - THE STAR, largest and most beautiful
   □ Descriptive text about the achievement
   □ "{event_name}" - styled to complement
   □ "{issue_date}" - elegant positioning
   □ "{certificate_id}" - small, subtle footer

5. ✍️ SIGNATURE AREA:
   □ Signature line (elegant line element)
   □ "Authorized Signature" label below

6. 🏅 SEAL/MEDALLION:
   □ Official-looking seal with concentric circles
   □ Positioned bottom-right or bottom-center

══════════════════════════════════════════════════════════════════

This certificate should be SO BEAUTIFUL that recipients want to FRAME IT and display it proudly. Make it look premium, professional, and worth treasuring.

Return ONLY the complete Fabric.js JSON. No markdown. No explanation.`;

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
