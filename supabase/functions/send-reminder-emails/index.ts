import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  email: string;
  name: string;
  registration_id: string;
  ticket_type?: string;
}

interface ReminderRequest {
  campaign_id: string;
  workspace_id: string;
  event_id: string;
  subject: string;
  body: string;
  include_qr: boolean;
  from_name?: string;
  from_email?: string;
  recipients: Recipient[];
  event_name?: string;
  event_date?: string;
  event_location?: string;
}

const BATCH_SIZE = 50;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured. Please add RESEND_API_KEY." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Dynamic import for Resend
    const Resend = (await import("https://esm.sh/resend@2.0.0")).Resend;
    const resend = new Resend(resendApiKey);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      campaign_id,
      workspace_id,
      event_id,
      subject,
      body,
      include_qr,
      from_name = "Event Team",
      from_email,
      recipients,
      event_name = "",
      event_date = "",
      event_location = "",
    }: ReminderRequest = await req.json();

    console.log(`Processing reminder campaign ${campaign_id} for ${recipients.length} recipients`);

    // Update campaign status to 'sending'
    await supabase
      .from("workspace_email_campaigns")
      .update({ status: "sending" })
      .eq("id", campaign_id);

    let successCount = 0;
    let failedCount = 0;
    const failedEmails: string[] = [];

    // Process in batches
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      
      const emailPromises = batch.map(async (recipient) => {
        try {
          // Personalize the email content
          let personalizedSubject = subject
            .replace(/\{\{name\}\}/gi, recipient.name || "Attendee")
            .replace(/\{\{email\}\}/gi, recipient.email)
            .replace(/\{\{ticket_type\}\}/gi, recipient.ticket_type || "General")
            .replace(/\{\{event_name\}\}/gi, event_name)
            .replace(/\{\{event_date\}\}/gi, event_date)
            .replace(/\{\{event_location\}\}/gi, event_location);

          let personalizedBody = body
            .replace(/\{\{name\}\}/gi, recipient.name || "Attendee")
            .replace(/\{\{email\}\}/gi, recipient.email)
            .replace(/\{\{ticket_type\}\}/gi, recipient.ticket_type || "General")
            .replace(/\{\{event_name\}\}/gi, event_name)
            .replace(/\{\{event_date\}\}/gi, event_date)
            .replace(/\{\{event_location\}\}/gi, event_location);

          // Convert newlines to HTML breaks for email
          const htmlBody = personalizedBody
            .replace(/\n/g, "<br>")
            .replace(/•/g, "&#8226;");

          // Build email HTML
          let emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .content { background: #f9f9f9; border-radius: 8px; padding: 30px; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                .qr-section { text-align: center; margin-top: 20px; padding: 20px; background: #fff; border-radius: 8px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="content">
                  ${htmlBody}
                </div>
          `;

          // Add QR code section if requested
          if (include_qr && recipient.registration_id) {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(recipient.registration_id)}`;
            emailHtml += `
                <div class="qr-section">
                  <p><strong>Your Check-in QR Code</strong></p>
                  <img src="${qrUrl}" alt="Check-in QR Code" width="200" height="200" />
                  <p style="font-size: 12px; color: #666;">Show this at the event entrance for quick check-in</p>
                </div>
            `;
          }

          emailHtml += `
                <div class="footer">
                  <p>You received this email because you're registered for ${event_name || "our event"}.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          const fromAddress = from_email 
            ? `${from_name} <${from_email}>`
            : `${from_name} <onboarding@resend.dev>`;

          const { error } = await resend.emails.send({
            from: fromAddress,
            to: [recipient.email],
            subject: personalizedSubject,
            html: emailHtml,
          });

          if (error) {
            console.error(`Failed to send to ${recipient.email}:`, error);
            failedEmails.push(recipient.email);
            failedCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Error sending to ${recipient.email}:`, err);
          failedEmails.push(recipient.email);
          failedCount++;
        }
      });

      await Promise.all(emailPromises);

      // Add small delay between batches to respect rate limits
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Campaign ${campaign_id} complete: ${successCount} sent, ${failedCount} failed`);

    // Update campaign with results
    const finalStatus = failedCount === recipients.length ? "failed" : "sent";
    await supabase
      .from("workspace_email_campaigns")
      .update({
        status: finalStatus,
        sent_count: successCount,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign_id);

    // Create notification for workspace team
    if (successCount > 0) {
      const { data: workspaceMembers } = await supabase
        .from("workspace_team_members")
        .select("user_id")
        .eq("workspace_id", workspace_id);

      if (workspaceMembers && workspaceMembers.length > 0) {
        const notifications = workspaceMembers.map((member) => ({
          user_id: member.user_id,
          title: "Reminder emails sent",
          message: `Successfully sent ${successCount} reminder emails${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
          type: "reminder",
          category: "workspace",
          metadata: { campaign_id, event_id },
        }));

        await supabase.from("notifications").insert(notifications);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent_count: successCount,
        failed_count: failedCount,
        failed_emails: failedEmails.slice(0, 10), // Return first 10 failed for debugging
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-reminder-emails:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send reminders";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});