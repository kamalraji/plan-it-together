import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// =============================================
// RATE LIMITING (in-memory, resets on cold start)
// =============================================
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

const checkRateLimit = (email: string): boolean => {
  const now = Date.now();
  const windowKey = `${email}_${Math.floor(now / RATE_LIMIT_WINDOW)}`;
  const count = rateLimitMap.get(windowKey) || 0;
  
  if (count >= MAX_REQUESTS_PER_WINDOW) return false;
  
  rateLimitMap.set(windowKey, count + 1);
  
  // Cleanup old entries (prevent memory leak)
  for (const [key] of rateLimitMap) {
    if (!key.includes(`_${Math.floor(now / RATE_LIMIT_WINDOW)}`)) {
      rateLimitMap.delete(key);
    }
  }
  
  return true;
};

// =============================================
// INPUT VALIDATION
// =============================================
const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false; // RFC 5321 max length
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const sanitizeInput = (str: string | undefined, maxLength: number = 500): string => {
  if (!str || typeof str !== 'string') return '';
  // Basic HTML entity encoding to prevent XSS in emails
  return str
    .slice(0, maxLength)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

interface NotificationPayload {
  applicationId: string;
  type: 'submitted' | 'approved' | 'rejected' | 'more_info';
  userEmail: string;
  userName: string;
  rejectionReason?: string;
  adminMessage?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getEmailTemplate = (payload: NotificationPayload) => {
  const templates = {
    submitted: {
      subject: 'Application Received - Thittam1Hub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">Application Received!</h2>
          <p>Hi ${payload.userName},</p>
          <p>We've received your organizer application and it's now under review.</p>
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Our team will review your application within 5-7 business days</li>
            <li>You'll receive an email once a decision has been made</li>
            <li>You can track your application status in the app</li>
          </ul>
          <p>Thank you for your interest in becoming an organizer!</p>
          <p>Best regards,<br/>The Thittam1Hub Team</p>
        </div>
      `,
    },
    approved: {
      subject: 'Congratulations! You\'re now an Organizer - Thittam1Hub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">🎉 Congratulations!</h2>
          <p>Hi ${payload.userName},</p>
          <p>Great news! Your organizer application has been <strong>approved</strong>!</p>
          <p><strong>What you can do now:</strong></p>
          <ul>
            <li>Create and manage your own events</li>
            <li>Access organizer-exclusive features</li>
            <li>Build your event portfolio</li>
          </ul>
          <p>Log in to the app to start creating amazing events!</p>
          <p>Best regards,<br/>The Thittam1Hub Team</p>
        </div>
      `,
    },
    rejected: {
      subject: 'Application Update - Thittam1Hub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">Application Update</h2>
          <p>Hi ${payload.userName},</p>
          <p>Thank you for your interest in becoming an organizer on Thittam1Hub.</p>
          <p>After careful review, we were unable to approve your application at this time.</p>
          ${payload.rejectionReason ? `
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0;">
              <strong>Feedback:</strong><br/>
              ${payload.rejectionReason}
            </div>
          ` : ''}
          <p>You're welcome to submit a new application after addressing the feedback above.</p>
          <p>Best regards,<br/>The Thittam1Hub Team</p>
        </div>
      `,
    },
    more_info: {
      subject: 'Additional Information Needed - Thittam1Hub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Additional Information Required</h2>
          <p>Hi ${payload.userName},</p>
          <p>We're reviewing your organizer application and need some additional information to proceed.</p>
          ${payload.adminMessage ? `
            <div style="background: #fefce8; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0;">
              <strong>Message from our team:</strong><br/>
              ${payload.adminMessage}
            </div>
          ` : ''}
          <p>Please log in to the app to update your application with the requested information.</p>
          <p>Best regards,<br/>The Thittam1Hub Team</p>
        </div>
      `,
    },
  };

  return templates[payload.type];
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: NotificationPayload = await req.json();

    // Validate required fields
    if (!payload.applicationId || !payload.type || !payload.userEmail || !payload.userName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    if (!isValidEmail(payload.userEmail)) {
      console.warn('Invalid email format:', payload.userEmail);
      return new Response(
        JSON.stringify({ error: 'Invalid email address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    if (!checkRateLimit(payload.userEmail)) {
      console.warn('Rate limit exceeded for:', payload.userEmail);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate notification type
    const validTypes = ['submitted', 'approved', 'rejected', 'more_info'];
    if (!validTypes.includes(payload.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid notification type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize user-provided content to prevent XSS in emails
    const sanitizedPayload: NotificationPayload = {
      ...payload,
      userName: sanitizeInput(payload.userName, 100),
      rejectionReason: payload.rejectionReason ? sanitizeInput(payload.rejectionReason, 1000) : undefined,
      adminMessage: payload.adminMessage ? sanitizeInput(payload.adminMessage, 1000) : undefined,
    };

    const template = getEmailTemplate(sanitizedPayload);

    console.log(`Sending ${payload.type} notification to ${payload.userEmail}`);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Thittam1Hub <noreply@thittam1hub.com>',
        to: [payload.userEmail],
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Resend API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await res.json();
    console.log('Email sent successfully:', data.id);

    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
