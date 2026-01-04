import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QuoteRequestPayload {
  vendorEmail: string;
  vendorName: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  eventDate?: string;
  eventType?: string;
  guestCount?: number;
  budget?: string;
  message: string;
  serviceNames?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: QuoteRequestPayload = await req.json();
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
    } = payload;

    // Build the email HTML
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
            <p>Hello ${vendorName},</p>
            <p>You have received a new quote request through Thittam1Hub Marketplace.</p>
            
            <div class="field">
              <div class="label">From</div>
              <div class="value">${senderName}</div>
            </div>
            
            <div class="field">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${senderEmail}">${senderEmail}</a></div>
            </div>
            
            ${senderPhone ? `
            <div class="field">
              <div class="label">Phone</div>
              <div class="value">${senderPhone}</div>
            </div>
            ` : ''}
            
            ${eventType ? `
            <div class="field">
              <div class="label">Event Type</div>
              <div class="value">${eventType}</div>
            </div>
            ` : ''}
            
            ${eventDate ? `
            <div class="field">
              <div class="label">Event Date</div>
              <div class="value">${eventDate}</div>
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
              <div class="value">${budget}</div>
            </div>
            ` : ''}
            
            ${serviceNames && serviceNames.length > 0 ? `
            <div class="field">
              <div class="label">Services Interested In</div>
              <div class="services">
                ${serviceNames.map(s => `<span class="service-tag">${s}</span>`).join('')}
              </div>
            </div>
            ` : ''}
            
            <div class="message-box">
              <div class="label">Message</div>
              <div class="value">${message.replace(/\n/g, '<br>')}</div>
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
      subject: `Quote Request from ${senderName} - Thittam1Hub`,
      html: emailHtml,
    });

    console.log("Quote request email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending quote request:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
