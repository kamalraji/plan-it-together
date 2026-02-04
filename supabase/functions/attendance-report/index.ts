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
    const { eventId, sessionId } = body as { eventId?: string; sessionId?: string };

    if (!eventId) {
      return new Response(JSON.stringify({ error: "eventId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const { data: registrations, error: registrationsError } = await supabase
      .from("registrations")
      .select("id, user_id, status")
      .eq("event_id", eventId);

    if (registrationsError) {
      console.error("Registrations error", registrationsError);
      return new Response(JSON.stringify({ error: "Failed to load registrations" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = Array.from(new Set((registrations || []).map((r: any) => r.user_id)));

    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("id, full_name, organization")
      .in("id", userIds);

    if (profilesError) {
      console.error("Profiles error", profilesError);
    }

    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (usersError) {
      console.error("Users error", usersError);
    }

    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance_records")
      .select("registration_id, user_id, check_in_time, check_in_method, session_id, volunteer_id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (attendanceError && attendanceError.code !== "PGRST116") {
      console.error("Attendance query error", attendanceError);
    }

    const attendanceRows = Array.isArray(attendance) ? attendance : attendance ? [attendance] : [];

    const profileMap = new Map<string, any>();
    (profiles || []).forEach((p: any) => profileMap.set(p.id, p));

    const userEmailMap = new Map<string, string>();
    (users?.users || []).forEach((u: any) => {
      if (u.id && u.email) userEmailMap.set(u.id, u.email);
    });

    const attendanceByRegistration = new Map<string, any>();
    attendanceRows.forEach((row: any) => {
      attendanceByRegistration.set(row.registration_id, row);
    });

    const attendanceRecords = (registrations || []).map((reg: any) => {
      const profile = profileMap.get(reg.user_id);
      const email = userEmailMap.get(reg.user_id) ?? "";
      const att = attendanceByRegistration.get(reg.id);

      return {
        registrationId: reg.id,
        userId: reg.user_id,
        userName: profile?.full_name ?? email ?? "Unknown",
        userEmail: email,
        status: reg.status,
        attended: !!att,
        checkInTime: att?.check_in_time ?? null,
        checkInMethod: att?.check_in_method ?? null,
        sessionId: att?.session_id ?? null,
        volunteerId: att?.volunteer_id ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      };
    });

    const totalRegistrations = registrations?.length ?? 0;
    const attendedCount = attendanceRecords.filter((r) => r.attended).length;
    const checkInRate = totalRegistrations > 0 ? (attendedCount / totalRegistrations) * 100 : 0;

    const report = {
      eventId,
      totalRegistrations,
      attendedCount,
      checkInRate,
      attendanceRecords,
    };

    return new Response(JSON.stringify({ success: true, data: report }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in attendance-report", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
