import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase environment variables");
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.replace("Bearer ", "");

    if (!jwt) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      console.error("Error getting user", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { qrCode, eventId, sessionId } = body as {
      qrCode?: string;
      eventId?: string;
      sessionId?: string;
    };

    if (!qrCode || !eventId) {
      return new Response(JSON.stringify({ error: "qrCode and eventId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("attendance-checkin by", user.id, "for event", eventId, "qr", qrCode);

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("Roles error", rolesError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedRoles = ["admin", "organizer", "volunteer"];
    const hasStaffRole = (roles || []).some((r: any) => allowedRoles.includes(r.role));

    if (!hasStaffRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, full_name, organization")
      .eq("qr_code", qrCode)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Profile lookup error", profileError);
      return new Response(
        JSON.stringify({ success: false, data: { valid: false, reason: "QR code not recognized" } }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: registration, error: registrationError } = await supabase
      .from("registrations")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (registrationError) {
      console.error("Registration lookup error", registrationError);
      return new Response(JSON.stringify({ error: "Registration lookup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!registration) {
      return new Response(
        JSON.stringify({ success: false, data: { valid: false, reason: "User not registered for this event" } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (registration.status === "CANCELLED") {
      return new Response(
        JSON.stringify({ success: false, data: { valid: false, reason: "Registration cancelled" } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from("attendance_records")
      .select("id, check_in_time, check_in_method")
      .eq("event_id", eventId)
      .eq("registration_id", registration.id)
      .eq("user_id", profile.id)
      .eq("session_id", sessionId ?? null)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("Existing attendance error", existingError);
    }

    if (existing) {
      const responseBody = {
        success: true,
        data: {
          valid: true,
          alreadyCheckedIn: true,
          attendanceRecord: existing,
          participantInfo: {
            userId: profile.id,
            name: profile.full_name,
            organization: profile.organization,
            registrationId: registration.id,
          },
          registrationStatus: registration.status,
        },
      };

      return new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("attendance_records")
      .insert({
        event_id: eventId,
        registration_id: registration.id,
        user_id: profile.id,
        session_id: sessionId ?? null,
        volunteer_id: user.id,
        check_in_method: "QR_SCAN",
      })
      .select("id, registration_id, session_id, check_in_time, check_in_method, volunteer_id")
      .maybeSingle();

    if (insertError || !inserted) {
      console.error("Insert attendance error", insertError);
      return new Response(JSON.stringify({ error: "Failed to record attendance" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseBody = {
      success: true,
      data: {
        valid: true,
        alreadyCheckedIn: false,
        attendanceRecord: inserted,
        participantInfo: {
          userId: profile.id,
          name: profile.full_name,
          organization: profile.organization,
          registrationId: registration.id,
        },
        registrationStatus: registration.status,
      },
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in attendance-checkin", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
