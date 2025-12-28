import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function generateCertificateId(eventId: string): string {
  const random = crypto.getRandomValues(new Uint8Array(4));
  const randomHex = Array.from(random)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const year = new Date().getFullYear();
  const shortEvent = eventId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `CERT-${year}-${shortEvent}-${randomHex.toUpperCase()}`;
}

function buildQrPayload(certificateId: string): string {
  // We only encode the certificateId in the QR; frontend knows to hit /verify-certificate/:id
  return certificateId;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: req.headers.get("Authorization") ?? "" },
    },
  });

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body as { action?: string };

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve current user for authenticated actions
    const { data: userResult } = await supabaseClient.auth.getUser();
    const user = userResult?.user ?? null;

    async function requireUser() {
      if (!user) {
        throw new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Organizer/admin utility
    async function ensureOrganizerForEvent(eventId: string) {
      await requireUser();

      // If user has admin/organizer app_role, let RLS handle the rest for most queries.
      // We do not bypass RLS here; this is just a lightweight sanity check using existing has_role.
      const { data: isOrganizer, error } = await serviceClient
        .rpc("has_role", { _user_id: user!.id, _role: "organizer" })
        .single();

      if (error || !isOrganizer) {
        throw new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return true;
    }

    // ========== ACTION: getCriteria ==========
    if (action === "getCriteria") {
      await requireUser();
      const { eventId } = body as { eventId?: string };
      if (!eventId) {
        return new Response(JSON.stringify({ error: "Missing eventId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabaseClient
        .from("certificate_criteria")
        .select("type, conditions")
        .eq("event_id", eventId);

      if (error) {
        console.error("certificates:getCriteria error", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ data: data ?? [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== ACTION: saveCriteria ==========
    if (action === "saveCriteria") {
      await requireUser();
      const { eventId, criteria } = body as {
        eventId?: string;
        criteria?: Array<{ type: string; conditions: Record<string, unknown> }>;
      };

      if (!eventId || !criteria) {
        return new Response(JSON.stringify({ error: "Missing eventId or criteria" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await ensureOrganizerForEvent(eventId);

      const { error: deleteError } = await supabaseClient
        .from("certificate_criteria")
        .delete()
        .eq("event_id", eventId);

      if (deleteError) {
        console.error("certificates:saveCriteria delete error", deleteError);
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (criteria.length === 0) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const insertRows = criteria.map((c) => ({
        event_id: eventId,
        type: c.type,
        conditions: c.conditions ?? {},
      }));

      const { error: insertError } = await supabaseClient
        .from("certificate_criteria")
        .insert(insertRows);

      if (insertError) {
        console.error("certificates:saveCriteria insert error", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== ACTION: getMyCertificates ==========
    if (action === "getMyCertificates") {
      await requireUser();

      const { data, error } = await supabaseClient
        .from("certificates")
        .select(
          `id, certificate_id, event_id, type, pdf_url, qr_payload, issued_at,
           events!inner ( id, name )`
        )
        .eq("recipient_id", user!.id)
        .order("issued_at", { ascending: false });

      if (error) {
        console.error("certificates:getMyCertificates error", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const mapped = (data ?? []).map((row: any) => ({
        id: row.id,
        code: row.certificate_id,
        issuedAt: row.issued_at,
        event: {
          id: row.events.id,
          name: row.events.name,
        },
      }));

      return new Response(JSON.stringify({ certificates: mapped }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== ACTION: listEventCertificates ==========
    if (action === "listEventCertificates") {
      await requireUser();
      const { eventId } = body as { eventId?: string };
      if (!eventId) {
        return new Response(JSON.stringify({ error: "Missing eventId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await ensureOrganizerForEvent(eventId);

      const { data, error } = await supabaseClient
        .from("certificates")
        .select(
          `id, certificate_id, recipient_id, event_id, type, pdf_url, qr_payload, issued_at, distributed_at,
           user_profiles!inner ( full_name, id ),
           events!inner ( id, name )`
        )
        .eq("event_id", eventId)
        .order("issued_at", { ascending: false });

      if (error) {
        console.error("certificates:listEventCertificates error", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const mapped = (data ?? []).map((row: any) => ({
        id: row.id,
        certificateId: row.certificate_id,
        recipientId: row.recipient_id,
        eventId: row.event_id,
        type: row.type,
        pdfUrl: row.pdf_url ?? "",
        qrCodeUrl: "", // front-end can generate QR image from certificateId
        issuedAt: row.issued_at,
        distributedAt: row.distributed_at ?? undefined,
        recipient: {
          name: row.user_profiles.full_name ?? "Participant",
          email: "", // email is not stored in user_profiles; can be extended later if needed
        },
      }));

      return new Response(JSON.stringify({ data: mapped }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper: evaluate criteria for a participant
    function participantMeetsCriteria(
      criteria: any[],
      context: { score?: number | null; rank?: number | null; attended: boolean; roles: string[] },
      type: string,
    ): boolean {
      const relevant = criteria.filter((c) => c.type === type);
      if (!relevant.length) return false;

      return relevant.some((c) => {
        const cond = c.conditions ?? {};
        if (typeof cond.minScore === "number" && (context.score ?? -Infinity) < cond.minScore) {
          return false;
        }
        if (typeof cond.maxRank === "number" && (context.rank ?? Infinity) > cond.maxRank) {
          return false;
        }
        if (cond.requiresAttendance && !context.attended) {
          return false;
        }
        if (Array.isArray(cond.requiresRole) && cond.requiresRole.length > 0) {
          const hasRequiredRole = cond.requiresRole.some((r: string) => context.roles.includes(r));
          if (!hasRequiredRole) return false;
        }
        return true;
      });
    }

    // ========== ACTION: batchGenerate ==========
    if (action === "batchGenerate") {
      await requireUser();
      const { eventId } = body as { eventId?: string };
      if (!eventId) {
        return new Response(JSON.stringify({ error: "Missing eventId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await ensureOrganizerForEvent(eventId);

      const { data: criteria, error: criteriaError } = await supabaseClient
        .from("certificate_criteria")
        .select("type, conditions")
        .eq("event_id", eventId);

      if (criteriaError) {
        console.error("certificates:batchGenerate criteria error", criteriaError);
        return new Response(JSON.stringify({ error: criteriaError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!criteria || criteria.length === 0) {
        return new Response(JSON.stringify({ error: "No certificate criteria configured for this event" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: registrations, error: registrationsError } = await supabaseClient
        .from("registrations")
        .select("id, user_id, event_id, status")
        .eq("event_id", eventId)
        .eq("status", "CONFIRMED");

      if (registrationsError) {
        console.error("certificates:batchGenerate registrations error", registrationsError);
        return new Response(JSON.stringify({ error: registrationsError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const registrationIds = (registrations ?? []).map((r: any) => r.id);

      const { data: attendance, error: attendanceError } =
        registrationIds.length > 0
          ? await supabaseClient
              .from("attendance_records")
              .select("registration_id")
              .in("registration_id", registrationIds)
          : { data: [], error: null };

      if (attendanceError) {
        console.error("certificates:batchGenerate attendance error", attendanceError);
        return new Response(JSON.stringify({ error: attendanceError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const attendedByRegistration = new Set<string>();
      (attendance ?? []).forEach((r: any) => attendedByRegistration.add(r.registration_id));

      const { data: roles, error: rolesError } = await supabaseClient
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("certificates:batchGenerate roles error", rolesError);
        return new Response(JSON.stringify({ error: rolesError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rolesByUserId = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const current = rolesByUserId.get(r.user_id) ?? [];
        current.push(r.role);
        rolesByUserId.set(r.user_id, current);
      });

      const certificatesToInsert: any[] = [];

      for (const reg of registrations ?? []) {
        const roles = rolesByUserId.get(reg.user_id) ?? [];
        const attended = attendedByRegistration.has(reg.id);

        const context = {
          score: null,
          rank: null,
          attended,
          roles,
        };

        const typesToIssue = ["COMPLETION", "MERIT", "APPRECIATION"].filter((t) =>
          participantMeetsCriteria(criteria ?? [], context, t),
        );

        for (const type of typesToIssue) {
          const certificateId = generateCertificateId(eventId);
          const qrPayload = buildQrPayload(certificateId);

          certificatesToInsert.push({
            certificate_id: certificateId,
            recipient_id: reg.user_id,
            event_id: eventId,
            type,
            qr_payload: qrPayload,
            metadata: {},
          });
        }
      }

      if (!certificatesToInsert.length) {
        return new Response(JSON.stringify({ success: true, generatedCount: 0 }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: insertError } = await supabaseClient.from("certificates").insert(certificatesToInsert);

      if (insertError) {
        console.error("certificates:batchGenerate insert error", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ success: true, generatedCount: certificatesToInsert.length, eventId }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ========== ACTION: distribute ==========
    if (action === "distribute") {
      await requireUser();
      const { certificateIds } = body as { certificateIds?: string[] };
      if (!certificateIds || certificateIds.length === 0) {
        return new Response(JSON.stringify({ error: "No certificates selected" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabaseClient
        .from("certificates")
        .update({ distributed_at: new Date().toISOString() })
        .in("id", certificateIds);

      if (error) {
        console.error("certificates:distribute error", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== ACTION: verify (public via service role) ==========
    if (action === "verify") {
      const { certificateId } = body as { certificateId?: string };
      if (!certificateId) {
        return new Response(JSON.stringify({ error: "Missing certificateId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await serviceClient
        .from("certificates")
        .select(
          `id, certificate_id, type, issued_at, recipient_id, event_id,
           events!inner ( name ),
           user_profiles:recipient_id ( full_name )`,
        )
        .eq("certificate_id", certificateId)
        .maybeSingle();

      if (error) {
        console.error("certificates:verify error", error);
        return new Response(JSON.stringify({ error: "Verification failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!data) {
        return new Response(
          JSON.stringify({ valid: false, error: "Certificate not found. Please check the ID and try again." }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const certificate = {
        id: data.id,
        certificateId: data.certificate_id,
        recipientName: (data.user_profiles as any)?.full_name ?? "Participant",
        eventName: (data.events as any).name,
        eventOrganization: undefined,
        type: data.type,
        issuedAt: data.issued_at,
        issuerName: "Thittam1Hub", // can be refined later
      };

      return new Response(JSON.stringify({ valid: true, certificate }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error("certificates function error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
