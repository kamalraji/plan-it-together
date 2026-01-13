import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import {
  z,
  emailSchema,
  phoneSchema,
  shortStringSchema,
  longStringSchema,
  validationError,
} from "../_shared/validation.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 quote requests per hour per IP

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

// HTML escaping to prevent XSS in emails
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

// Zod schema for quote request
const quoteRequestSchema = z.object({
  vendorEmail: emailSchema,
  vendorName: shortStringSchema,
  senderName: shortStringSchema,
  senderEmail: emailSchema,
  senderPhone: phoneSchema,
  eventDate: z.string().max(50, "Event date must be less than 50 characters").optional(),
  eventType: z.string().max(100, "Event type must be less than 100 characters").optional(),
  guestCount: z.number().min(0, "Guest count cannot be negative").max(100000, "Guest count must be less than 100,000").optional(),
  budget: z.string().max(50, "Budget must be less than 50 characters").optional(),
  message: longStringSchema,
  serviceNames: z.array(z.string().max(50)).max(10, "Maximum 10 services allowed").optional(),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
          ...corsHeaders 
        },
      }
    );
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    
    // Validate input with Zod
    const parseResult = quoteRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return validationError(parseResult.error, corsHeaders);
    }

    const {
      vendorEmail,
      vendorName,
      senderName,
      senderEmail,
      senderPhone,
      eventDate,
      eventType,
      guestCount,
      budget,
      message,
      serviceNames,
    } = parseResult.data;

    // Build the email HTML with escaped content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF6B6B, #4ECDC4); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
          .field { margin-bottom: 16px; }
          .label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 16px; color: #111827; }
          .message-box { background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 16px; }
          .services { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
          .service-tag { background: #E0F2FE; color: #0369A1; padding: 4px 12px; border-radius: 16px; font-size: 14px; }
          .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Quote Request</h1>
          </div>
          <div class="content">
            <p>Hello ${escapeHtml(vendorName)},</p>
            <p>You have received a new quote request through Thittam1Hub Marketplace.</p>
            
            <div class="field">
              <div class="label">From</div>
              <div class="value">${escapeHtml(senderName)}</div>
            </div>
            
            <div class="field">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${escapeHtml(senderEmail)}">${escapeHtml(senderEmail)}</a></div>
            </div>
            
            ${senderPhone ? `
            <div class="field">
              <div class="label">Phone</div>
              <div class="value">${escapeHtml(senderPhone)}</div>
            </div>
            ` : ''}
            
            ${eventType ? `
            <div class="field">
              <div class="label">Event Type</div>
              <div class="value">${escapeHtml(eventType)}</div>
            </div>
            ` : ''}
            
            ${eventDate ? `
            <div class="field">
              <div class="label">Event Date</div>
              <div class="value">${escapeHtml(eventDate)}</div>
            </div>
            ` : ''}
            
            ${guestCount ? `
            <div class="field">
              <div class="label">Expected Guests</div>
              <div class="value">${guestCount}</div>
            </div>
            ` : ''}
            
            ${budget ? `
            <div class="field">
              <div class="label">Budget Range</div>
              <div class="value">${escapeHtml(budget)}</div>
            </div>
            ` : ''}
            
            ${serviceNames && serviceNames.length > 0 ? `
            <div class="field">
              <div class="label">Services Interested In</div>
              <div class="services">
                ${serviceNames.slice(0, 10).map(s => `<span class="service-tag">${escapeHtml(s.substring(0, 50))}</span>`).join('')}
              </div>
            </div>
            ` : ''}
            
            <div class="message-box">
              <div class="label">Message</div>
              <div class="value">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
            </div>
            
            <p style="margin-top: 24px;">Please respond to this inquiry at your earliest convenience.</p>
          </div>
          <div class="footer">
            <p>This message was sent via Thittam1Hub Marketplace</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Thittam1Hub Marketplace <onboarding@resend.dev>",
      to: [vendorEmail],
      reply_to: senderEmail,
      subject: `Quote Request from ${escapeHtml(senderName)} - Thittam1Hub`,
      html: emailHtml,
    });

    console.log("Quote request email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json", 
        "X-RateLimit-Remaining": String(remaining),
        ...corsHeaders 
      },
    });
  } catch (error: any) {
    console.error("Error sending quote request:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to send quote request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
