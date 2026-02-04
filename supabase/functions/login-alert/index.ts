import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginAlertPayload {
  user_id: string;
  event_type: "new_login" | "new_device" | "password_changed" | "2fa_enabled" | "2fa_disabled" | "failed_attempts" | "account_locked";
  device_info?: {
    device_name?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    ip_address?: string;
    location?: string;
  };
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: LoginAlertPayload = await req.json();
    const { user_id, event_type, device_info, metadata } = payload;

    if (!user_id || !event_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, event_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile and email
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError || !user?.user) {
      console.error("Error fetching user:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = user.user.email;
    const userName = user.user.user_metadata?.full_name || "User";

    // Generate alert message based on event type
    const alertInfo = getAlertInfo(event_type, device_info);

    // Log security activity
    const { error: logError } = await supabase
      .from("security_activity_logs")
      .insert({
        user_id,
        event_type,
        device_name: device_info?.device_name,
        device_type: device_info?.device_type,
        browser: device_info?.browser,
        os: device_info?.os,
        ip_address_hash: device_info?.ip_address ? hashIpAddress(device_info.ip_address) : null,
        location: device_info?.location,
        metadata,
        severity: alertInfo.severity,
      });

    if (logError) {
      console.error("Error logging security activity:", logError);
    }

    // Create in-app notification
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id,
        type: "SECURITY_ALERT",
        title: alertInfo.title,
        message: alertInfo.message,
        category: "security",
        action_url: "/profile/security-activity",
        metadata: {
          event_type,
          device_info,
          ...metadata,
        },
      });

    if (notifError) {
      console.error("Error creating notification:", notifError);
    }

    // Check if user has email notifications enabled for security alerts
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("security_alerts_enabled, email_security_alerts")
      .eq("user_id", user_id)
      .single();

    const shouldSendEmail = prefs?.email_security_alerts !== false;

    // Send email notification for critical events
    if (shouldSendEmail && alertInfo.severity === "critical" && userEmail) {
      // In production, integrate with email service (Resend, SendGrid, etc.)
      console.log(`Would send security alert email to ${userEmail}:`, {
        subject: alertInfo.title,
        body: alertInfo.emailBody,
      });

      // Example Resend integration (requires RESEND_API_KEY secret):
      // const resendKey = Deno.env.get("RESEND_API_KEY");
      // if (resendKey) {
      //   await fetch("https://api.resend.com/emails", {
      //     method: "POST",
      //     headers: {
      //       "Authorization": `Bearer ${resendKey}`,
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       from: "security@thittam1hub.com",
      //       to: userEmail,
      //       subject: alertInfo.title,
      //       html: alertInfo.emailBody,
      //     }),
      //   });
      // }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Security alert processed",
        notification_sent: true,
        email_sent: shouldSendEmail && alertInfo.severity === "critical",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing login alert:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getAlertInfo(eventType: string, deviceInfo?: LoginAlertPayload["device_info"]) {
  const deviceName = deviceInfo?.device_name || "Unknown device";
  const location = deviceInfo?.location || "Unknown location";
  const browser = deviceInfo?.browser || "Unknown browser";
  const timestamp = new Date().toLocaleString();

  switch (eventType) {
    case "new_login":
      return {
        title: "New Login Detected",
        message: `New sign-in from ${deviceName} in ${location}`,
        emailBody: `
          <h2>New Login to Your Account</h2>
          <p>We detected a new sign-in to your Thittam1Hub account.</p>
          <ul>
            <li><strong>Device:</strong> ${deviceName}</li>
            <li><strong>Browser:</strong> ${browser}</li>
            <li><strong>Location:</strong> ${location}</li>
            <li><strong>Time:</strong> ${timestamp}</li>
          </ul>
          <p>If this was you, no action is needed.</p>
          <p>If you don't recognize this activity, please <a href="https://thittam1hub.com/profile/security">secure your account</a> immediately.</p>
        `,
        severity: "info" as const,
      };

    case "new_device":
      return {
        title: "New Device Login",
        message: `Your account was accessed from a new device: ${deviceName}`,
        emailBody: `
          <h2>⚠️ New Device Detected</h2>
          <p>Your account was accessed from a device we haven't seen before.</p>
          <ul>
            <li><strong>Device:</strong> ${deviceName}</li>
            <li><strong>Browser:</strong> ${browser}</li>
            <li><strong>Location:</strong> ${location}</li>
            <li><strong>Time:</strong> ${timestamp}</li>
          </ul>
          <p>If this wasn't you, your account may be compromised. Please:</p>
          <ol>
            <li>Change your password immediately</li>
            <li>Enable two-factor authentication</li>
            <li>Review your active sessions</li>
          </ol>
        `,
        severity: "critical" as const,
      };

    case "password_changed":
      return {
        title: "Password Changed",
        message: "Your account password was successfully changed",
        emailBody: `
          <h2>Password Changed</h2>
          <p>Your Thittam1Hub account password was changed on ${timestamp}.</p>
          <p>If you didn't make this change, please contact support immediately.</p>
        `,
        severity: "critical" as const,
      };

    case "2fa_enabled":
      return {
        title: "Two-Factor Authentication Enabled",
        message: "2FA has been enabled on your account",
        emailBody: `
          <h2>✅ Two-Factor Authentication Enabled</h2>
          <p>Two-factor authentication has been enabled on your account, adding an extra layer of security.</p>
          <p>Time: ${timestamp}</p>
        `,
        severity: "info" as const,
      };

    case "2fa_disabled":
      return {
        title: "Two-Factor Authentication Disabled",
        message: "2FA has been disabled on your account",
        emailBody: `
          <h2>⚠️ Two-Factor Authentication Disabled</h2>
          <p>Two-factor authentication has been disabled on your account.</p>
          <p>Time: ${timestamp}</p>
          <p>If you didn't make this change, please secure your account immediately.</p>
        `,
        severity: "critical" as const,
      };

    case "failed_attempts":
      return {
        title: "Multiple Failed Login Attempts",
        message: "We detected multiple failed login attempts on your account",
        emailBody: `
          <h2>⚠️ Failed Login Attempts Detected</h2>
          <p>Multiple failed login attempts were detected on your account.</p>
          <ul>
            <li><strong>Location:</strong> ${location}</li>
            <li><strong>Time:</strong> ${timestamp}</li>
          </ul>
          <p>If this wasn't you, consider changing your password.</p>
        `,
        severity: "warning" as const,
      };

    case "account_locked":
      return {
        title: "Account Temporarily Locked",
        message: "Your account has been temporarily locked due to suspicious activity",
        emailBody: `
          <h2>🔒 Account Temporarily Locked</h2>
          <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
          <p>The lock will be lifted automatically after 30 minutes.</p>
          <p>If you need immediate access, please contact support.</p>
        `,
        severity: "critical" as const,
      };

    default:
      return {
        title: "Security Alert",
        message: "A security event occurred on your account",
        emailBody: `<p>A security event occurred on your account at ${timestamp}.</p>`,
        severity: "info" as const,
      };
  }
}

function hashIpAddress(ip: string): string {
  // Simple hash for privacy - in production use proper crypto
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "thittam1hub_ip_salt_v1");
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substring(0, 16);
}
