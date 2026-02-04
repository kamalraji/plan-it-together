import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z, uuidSchema, parseAndValidate } from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schema for attendance QR request (strict mode)
const attendanceQrSchema = z.object({
  eventId: uuidSchema,
}).strict();

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

    // Parse and validate request body
    const parseResult = await parseAndValidate(req, attendanceQrSchema, corsHeaders);
    if (!parseResult.success) {
      return parseResult.response;
    }

    const { eventId } = parseResult.data;

    console.log("attendance-qr for user", user.id, "event", eventId);

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, full_name, organization, qr_code")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Profile error", profileError);
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: registration, error: registrationError } = await supabase
      .from("registrations")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (registrationError) {
      console.error("Registration error", registrationError);
    }

    const { data: lastAttendance, error: attendanceError } = await supabase
      .from("attendance_records")
      .select("check_in_time")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .order("check_in_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (attendanceError) {
      console.error("Attendance error", attendanceError);
    }

    const responseBody = {
      success: true,
      data: {
        userId: user.id,
        eventId,
        qrCode: profile.qr_code as string,
        profile: {
          fullName: profile.full_name as string | null,
          organization: profile.organization as string | null,
        },
        registration: registration || null,
        latestAttendance: lastAttendance
          ? { hasCheckedIn: true, checkInTime: lastAttendance.check_in_time }
          : { hasCheckedIn: false },
      },
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in attendance-qr", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
