import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import {
  z,
  emailSchema,
  shortStringSchema,
  longStringSchema,
  validationError,
} from "../_shared/validation.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 3; // 3 contact requests per hour per IP

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = rateLimitMap.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  existing.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - existing.count };
}

function cleanupRateLimitMap(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

// HTML escaping to prevent XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Zod schema for intent contact
const intentSchema = z.enum(["demo", "pricing", "walkthrough", "general"]);

const intentContactSchema = z.object({
  intent: intentSchema.nullable().optional(),
  name: shortStringSchema,
  email: emailSchema,
  message: longStringSchema,
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Periodic cleanup of rate limit map
  if (Math.random() < 0.01) {
    cleanupRateLimitMap();
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  const { allowed, remaining } = checkRateLimit(clientIP);

  if (!allowed) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "3600",
          "X-RateLimit-Remaining": "0",
          ...corsHeaders,
        },
      }
    );
  }

  try {
    const rawBody = await req.json().catch(() => ({}));

    // Validate input with Zod
    const parseResult = intentContactSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return validationError(parseResult.error, corsHeaders);
    }

    const { intent, name, email, message } = parseResult.data;

    const subjectPrefix = intent === "demo"
      ? "Demo request"
      : intent === "pricing"
      ? "Pricing question"
      : intent === "walkthrough"
      ? "Guided walkthrough"
      : "Help request";

    // Build email body with escaped content
    const emailBody = `
      Intent: ${escapeHtml(intent ?? "general")}
      Name: ${escapeHtml(name)}
      Email: ${escapeHtml(email)}

      Message:
      ${escapeHtml(message)}
    `;

    // Get contact email from environment or use default
    const contactEmail = Deno.env.get("CONTACT_EMAIL") || "founder@example.com";

    const emailResponse = await resend.emails.send({
      from: "Thittam1Hub <onboarding@resend.dev>",
      to: [contactEmail],
      reply_to: email,
      subject: `${subjectPrefix} via Thittam1Hub help form`,
      text: emailBody,
    });

    console.log("Intent contact email sent", emailResponse);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json", 
        "X-RateLimit-Remaining": String(remaining),
        ...corsHeaders 
      },
    });
  } catch (error) {
    console.error("Error in intent-contact function", error);
    return new Response(JSON.stringify({ error: "Failed to submit request" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
