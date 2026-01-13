import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateDesignRequest {
  eventTheme: string;
  certificateType: string;
  primaryColor?: string;
  secondaryColor?: string;
  style?: string;
  additionalNotes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventTheme, certificateType, primaryColor, secondaryColor, style, additionalNotes } = 
      await req.json() as GenerateDesignRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a professional certificate designer. Generate Fabric.js canvas JSON for a certificate design.

The canvas dimensions are 842x595 pixels (A4 landscape at 72 DPI).

IMPORTANT: Return ONLY valid JSON, no markdown or explanation. The response must be a valid Fabric.js canvas JSON object.

Design guidelines:
- Use elegant, professional typography
- Include placeholder text elements for dynamic content using these exact keys: {recipient_name}, {event_name}, {issue_date}, {certificate_id}
- Create a visually balanced layout with proper spacing
- Use the specified colors for accents and text
- Add decorative elements (lines, shapes) that complement the style
- Position elements appropriately:
  - Title/header at top
  - Recipient name prominently in center
  - Event details below recipient
  - Certificate ID and date at bottom
  - Decorative borders or accents as appropriate

Fabric.js object structure must include:
- version: "6.0.0"
- objects: array of fabric objects (IText, Rect, Line, Circle, etc.)

For text objects use type "i-text" with properties: left, top, text, fontSize, fontFamily, fill, fontWeight, textAlign, originX, originY.
For shapes use type "rect", "circle", or "line" with appropriate properties.`;

    const userPrompt = `Generate a certificate design with these specifications:

Event Theme: ${eventTheme}
Certificate Type: ${certificateType}
Primary Color: ${primaryColor || '#1a365d'}
Secondary Color: ${secondaryColor || '#c9a227'}
Style Preference: ${style || 'elegant and professional'}
${additionalNotes ? `Additional Notes: ${additionalNotes}` : ''}

Create a complete Fabric.js canvas JSON with:
1. A decorative border or frame
2. Certificate title (e.g., "Certificate of ${certificateType}")
3. Placeholder text "{recipient_name}" styled prominently
4. Text for "has successfully completed" or similar
5. Placeholder "{event_name}" for the event
6. Date placeholder "{issue_date}"
7. Certificate ID placeholder "{certificate_id}"
8. Decorative elements matching the theme
9. Space for signature and logo (placeholder areas)

Return only the JSON object, no additional text.`;

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
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from AI");
    }

    // Parse the JSON from the response (handle markdown code blocks if present)
    let canvasJSON;
    try {
      // Remove markdown code blocks if present
      let jsonString = content.trim();
      if (jsonString.startsWith("```")) {
        jsonString = jsonString.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
      }
      canvasJSON = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      throw new Error("Failed to parse AI-generated design");
    }

    return new Response(
      JSON.stringify({ canvasJSON }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-certificate-design:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
