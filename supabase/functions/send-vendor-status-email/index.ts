import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import {
  z,
  emailSchema,
  shortStringSchema,
  vendorStatusSchema,
  validationError,
} from "../_shared/validation.ts";
import { requireAuth, verifyAdminRole, forbiddenResponse } from "../_shared/auth.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Zod schema for vendor status email (strict mode)
const vendorStatusEmailSchema = z.object({
  vendorEmail: emailSchema,
  vendorName: shortStringSchema,
  status: vendorStatusSchema,
  rejectionReason: z.string().trim().max(500, "Rejection reason must be less than 500 characters").optional(),
}).strict();

const getStatusEmailContent = (vendorName: string, status: string, rejectionReason?: string) => {
  if (status === 'VERIFIED') {
    return {
      subject: `Congratulations! Your vendor application has been approved - Thittam1Hub`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
            .success-icon { font-size: 48px; text-align: center; margin-bottom: 16px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
            .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Approved!</h1>
            </div>
            <div class="content">
              <div class="success-icon">🎉</div>
              <p>Hello ${vendorName},</p>
              <p>Great news! Your vendor application on <strong>Thittam1Hub Marketplace</strong> has been reviewed and <strong>approved</strong>.</p>
              <p>You can now:</p>
              <ul>
                <li>Add and manage your services</li>
                <li>Receive quote requests from event organizers</li>
                <li>Build your public vendor profile</li>
                <li>Respond to reviews from clients</li>
              </ul>
              <p>Log in to your vendor dashboard to start listing your services and connecting with event organizers.</p>
              <p style="text-align: center;">
                <a href="https://thittam1hub.com/marketplace/vendor" class="cta-button">Go to Vendor Dashboard</a>
              </p>
              <p>Welcome to the Thittam1Hub vendor community!</p>
            </div>
            <div class="footer">
              <p>This email was sent by Thittam1Hub Marketplace</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  } else if (status === 'REJECTED') {
    return {
      subject: `Update on your vendor application - Thittam1Hub`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #EF4444, #DC2626); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
            .reason-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .reason-label { font-weight: 600; color: #991B1B; margin-bottom: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Update</h1>
            </div>
            <div class="content">
              <p>Hello ${vendorName},</p>
              <p>Thank you for your interest in joining the <strong>Thittam1Hub Marketplace</strong> as a vendor.</p>
              <p>After reviewing your application, we regret to inform you that we are unable to approve it at this time.</p>
              ${rejectionReason ? `
              <div class="reason-box">
                <div class="reason-label">Reason:</div>
                <p style="margin: 0;">${rejectionReason}</p>
              </div>
              ` : ''}
              <p>If you believe this decision was made in error, or if you'd like to provide additional information, please don't hesitate to reach out to our support team.</p>
              <p>You're welcome to submit a new application after addressing the feedback above.</p>
              <p>Best regards,<br>The Thittam1Hub Team</p>
            </div>
            <div class="footer">
              <p>This email was sent by Thittam1Hub Marketplace</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  } else {
    return {
      subject: `Important: Your vendor account has been suspended - Thittam1Hub`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6B7280, #4B5563); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
            .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Suspended</h1>
            </div>
            <div class="content">
              <p>Hello ${vendorName},</p>
              <p>We're writing to inform you that your vendor account on <strong>Thittam1Hub Marketplace</strong> has been suspended.</p>
              <p>During the suspension period:</p>
              <ul>
                <li>Your profile will not be visible to event organizers</li>
                <li>You will not receive new quote requests</li>
                <li>Existing services will be hidden from the marketplace</li>
              </ul>
              <p>If you believe this suspension was made in error or would like to discuss the matter, please contact our support team.</p>
              <p>Best regards,<br>The Thittam1Hub Team</p>
            </div>
            <div class="footer">
              <p>This email was sent by Thittam1Hub Marketplace</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authResult = await requireAuth(req, corsHeaders);
    if (!authResult.success) {
      return authResult.response;
    }

    // ===== AUTHORIZATION CHECK - Admin only =====
    const isAdmin = await verifyAdminRole(authResult.serviceClient, authResult.user.id);
    if (!isAdmin) {
      return forbiddenResponse("Only administrators can send vendor status emails", corsHeaders);
    }

    const rawBody = await req.json().catch(() => ({}));
    
    // Validate input with Zod
    const parseResult = vendorStatusEmailSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return validationError(parseResult.error, corsHeaders);
    }

    const { vendorEmail, vendorName, status, rejectionReason } = parseResult.data;

    console.log(`Admin ${authResult.user.id} sending vendor status email to ${vendorEmail} - Status: ${status}`);

    const emailContent = getStatusEmailContent(vendorName, status, rejectionReason);

    const emailResponse = await resend.emails.send({
      from: "Thittam1Hub Marketplace <onboarding@resend.dev>",
      to: [vendorEmail],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Vendor status email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending vendor status email:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to send vendor status email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);