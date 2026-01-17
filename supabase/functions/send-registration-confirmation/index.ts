import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegistrationEmailRequest {
  attendeeName?: string;
  attendeeEmail: string;
  eventName: string;
  eventDate?: string;
  ticketType: string;
  registrationId?: string;
  isInvitation?: boolean;
  registrationLink?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured, skipping email send');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email service not configured',
          skipped: true 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body: RegistrationEmailRequest = await req.json();
    const { 
      attendeeName, 
      attendeeEmail, 
      eventName, 
      eventDate, 
      ticketType,
      registrationId,
      isInvitation,
      registrationLink 
    } = body;

    if (!attendeeEmail || !eventName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: attendeeEmail, eventName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedDate = eventDate 
      ? new Date(eventDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'TBA';

    let subject: string;
    let htmlContent: string;

    if (isInvitation) {
      subject = `You're invited to ${eventName}!`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <h1 style="color: #18181b; margin: 0 0 24px; font-size: 24px;">You're Invited! 🎉</h1>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                You've been invited to register for <strong>${eventName}</strong>.
              </p>
              
              <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
                <p style="margin: 0 0 8px; color: #71717a; font-size: 14px;">Event Details</p>
                <p style="margin: 0 0 4px; color: #18181b; font-size: 16px;"><strong>📅 Date:</strong> ${formattedDate}</p>
                <p style="margin: 0; color: #18181b; font-size: 16px;"><strong>🎫 Ticket Type:</strong> ${ticketType}</p>
              </div>
              
              <a href="${registrationLink || '#'}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Register Now
              </a>
              
              <p style="color: #a1a1aa; font-size: 14px; margin: 32px 0 0;">
                If you have any questions, please contact the event organizer.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = `Registration Confirmed: ${eventName}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; background: #dcfce7; border-radius: 50%; padding: 16px;">
                  <span style="font-size: 32px;">✓</span>
                </div>
              </div>
              
              <h1 style="color: #18181b; margin: 0 0 24px; font-size: 24px; text-align: center;">You're Registered!</h1>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                ${attendeeName ? `Hi ${attendeeName}, ` : ''}Your registration for <strong>${eventName}</strong> has been confirmed.
              </p>
              
              <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
                <p style="margin: 0 0 8px; color: #71717a; font-size: 14px;">Registration Details</p>
                <p style="margin: 0 0 4px; color: #18181b; font-size: 16px;"><strong>📅 Date:</strong> ${formattedDate}</p>
                <p style="margin: 0 0 4px; color: #18181b; font-size: 16px;"><strong>🎫 Ticket:</strong> ${ticketType}</p>
                ${registrationId ? `<p style="margin: 0; color: #18181b; font-size: 16px;"><strong>🔖 Confirmation #:</strong> ${registrationId.slice(0, 8).toUpperCase()}</p>` : ''}
              </div>
              
              <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                Please save this email for your records. You may need to show this confirmation at the event.
              </p>
              
              <p style="color: #a1a1aa; font-size: 14px; margin: 0;">
                If you have any questions, please contact the event organizer.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Thittam <noreply@thittam.com>',
        to: [attendeeEmail],
        subject: subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Failed to send email:', emailResult);
      return new Response(
        JSON.stringify({ success: false, error: emailResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResult.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in send-registration-confirmation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
