import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z, uuidSchema, parseAndValidate } from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schema for manual check-in request (strict mode)
const manualCheckinSchema = z.object({
  registrationId: uuidSchema,
  sessionId: uuidSchema.optional().nullable(),
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
    const parseResult = await parseAndValidate(req, manualCheckinSchema, corsHeaders);
    if (!parseResult.success) {
      return parseResult.response;
    }

    const { registrationId, sessionId } = parseResult.data;

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

    const { data: registration, error: registrationError } = await supabase
      .from("registrations")
      .select("id, event_id, user_id")
      .eq("id", registrationId)
      .maybeSingle();

    if (registrationError || !registration) {
      console.error("Registration error", registrationError);
      return new Response(JSON.stringify({ error: "Registration not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existing, error: existingError } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("event_id", registration.event_id)
      .eq("registration_id", registration.id)
      .eq("user_id", registration.user_id)
      .eq("session_id", sessionId ?? null)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") {
      console.error("Existing attendance error", existingError);
    }

    if (existing) {
      return new Response(JSON.stringify({ success: true, data: existing }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("attendance_records")
      .insert({
        event_id: registration.event_id,
        registration_id: registration.id,
        user_id: registration.user_id,
        session_id: sessionId ?? null,
        volunteer_id: user.id,
        check_in_method: "MANUAL",
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

    return new Response(JSON.stringify({ success: true, data: inserted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in attendance-manual-checkin", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
