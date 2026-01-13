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
  return certificateId;
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function successResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
      return errorResponse("Missing action");
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

    // Workspace-based authorization
    async function ensureWorkspaceManager(workspaceId: string) {
      await requireUser();

      const { data: hasAccess, error } = await serviceClient
        .rpc("has_workspace_management_access", {
          _workspace_id: workspaceId,
          _user_id: user!.id,
        })
        .single();

      if (error || !hasAccess) {
        console.error("Workspace management access denied", { workspaceId, userId: user!.id, error });
        throw new Response(
          JSON.stringify({ error: "Forbidden: You don't have permission to manage certificates for this workspace" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      return true;
    }

    // NEW: Granular certificate permission check
    async function ensureCertificatePermission(workspaceId: string, permission: 'design' | 'criteria' | 'generate' | 'distribute') {
      await requireUser();

      const { data: hasPermission, error } = await serviceClient
        .rpc("has_certificate_permission", {
          _workspace_id: workspaceId,
          _permission: permission,
          _user_id: user!.id,
        })
        .single();

      if (error || !hasPermission) {
        console.error(`Certificate ${permission} permission denied`, { workspaceId, userId: user!.id, error });
        throw new Response(
          JSON.stringify({ error: `Forbidden: You don't have ${permission} permission for certificates` }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      return true;
    }

    // Check if user is workspace owner (for delegation management)
    async function ensureWorkspaceOwner(workspaceId: string) {
      await requireUser();

      const { data: isOwner, error } = await serviceClient
        .rpc("is_workspace_owner", {
          _workspace_id: workspaceId,
          _user_id: user!.id,
        })
        .single();

      if (error || !isOwner) {
        console.error("Workspace owner access denied", { workspaceId, userId: user!.id, error });
        throw new Response(
          JSON.stringify({ error: "Forbidden: Only workspace owners can manage delegations" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      return true;
    }

    // Helper: Get workspace details including event_id
    async function getWorkspaceWithEvent(workspaceId: string) {
      const { data, error } = await supabaseClient
        .from("workspaces")
        .select("id, event_id, name, parent_workspace_id")
        .eq("id", workspaceId)
        .single();

      if (error || !data) {
        throw errorResponse("Workspace not found", 404);
      }

      if (!data.event_id) {
        throw errorResponse("Workspace has no linked event", 400);
      }

      return data;
    }

    // ==================== DELEGATION ACTIONS ====================

    // ========== ACTION: getDelegations (list all delegations from a ROOT workspace) ==========
    if (action === "getDelegations") {
      const { workspaceId } = body as { workspaceId?: string };
      
      if (!workspaceId) {
        return errorResponse("Missing workspaceId");
      }

      await ensureWorkspaceOwner(workspaceId);

      const { data, error } = await supabaseClient
        .from("certificate_delegation")
        .select(`
          id, 
          delegated_workspace_id, 
          can_design_templates, 
          can_define_criteria, 
          can_generate, 
          can_distribute, 
          delegated_at, 
          delegated_by, 
          notes,
          workspaces!certificate_delegation_delegated_workspace_id_fkey (id, name, slug)
        `)
        .eq("root_workspace_id", workspaceId);

      if (error) {
        console.error("getDelegations error", error);
        return errorResponse(error.message, 500);
      }

      const mapped = (data ?? []).map((d: any) => ({
        id: d.id,
        delegatedWorkspaceId: d.delegated_workspace_id,
        delegatedWorkspaceName: d.workspaces?.name ?? "Unknown",
        canDesignTemplates: d.can_design_templates,
        canDefineCriteria: d.can_define_criteria,
        canGenerate: d.can_generate,
        canDistribute: d.can_distribute,
        delegatedAt: d.delegated_at,
        notes: d.notes,
      }));

      return successResponse({ data: mapped });
    }

    // ========== ACTION: createDelegation ==========
    if (action === "createDelegation") {
      const { workspaceId, delegatedWorkspaceId, permissions, notes } = body as {
        workspaceId?: string;
        delegatedWorkspaceId?: string;
        permissions?: {
          canDesignTemplates?: boolean;
          canDefineCriteria?: boolean;
          canGenerate?: boolean;
          canDistribute?: boolean;
        };
        notes?: string;
      };

      if (!workspaceId || !delegatedWorkspaceId) {
        return errorResponse("Missing workspaceId or delegatedWorkspaceId");
      }

      await ensureWorkspaceOwner(workspaceId);

      const { data, error } = await supabaseClient
        .from("certificate_delegation")
        .insert({
          root_workspace_id: workspaceId,
          delegated_workspace_id: delegatedWorkspaceId,
          can_design_templates: permissions?.canDesignTemplates ?? false,
          can_define_criteria: permissions?.canDefineCriteria ?? false,
          can_generate: permissions?.canGenerate ?? false,
          can_distribute: permissions?.canDistribute ?? false,
          delegated_by: user!.id,
          notes: notes ?? null,
        })
        .select()
        .single();

      if (error) {
        console.error("createDelegation error", error);
        if (error.code === "23505") {
          return errorResponse("Delegation already exists for this workspace");
        }
        return errorResponse(error.message, 500);
      }

      return successResponse({ success: true, data });
    }

    // ========== ACTION: updateDelegation ==========
    if (action === "updateDelegation") {
      const { workspaceId, delegationId, permissions, notes } = body as {
        workspaceId?: string;
        delegationId?: string;
        permissions?: {
          canDesignTemplates?: boolean;
          canDefineCriteria?: boolean;
          canGenerate?: boolean;
          canDistribute?: boolean;
        };
        notes?: string;
      };

      if (!workspaceId || !delegationId) {
        return errorResponse("Missing workspaceId or delegationId");
      }

      await ensureWorkspaceOwner(workspaceId);

      const { error } = await supabaseClient
        .from("certificate_delegation")
        .update({
          can_design_templates: permissions?.canDesignTemplates,
          can_define_criteria: permissions?.canDefineCriteria,
          can_generate: permissions?.canGenerate,
          can_distribute: permissions?.canDistribute,
          notes: notes,
        })
        .eq("id", delegationId)
        .eq("root_workspace_id", workspaceId);

      if (error) {
        console.error("updateDelegation error", error);
        return errorResponse(error.message, 500);
      }

      return successResponse({ success: true });
    }

    // ========== ACTION: removeDelegation ==========
    if (action === "removeDelegation") {
      const { workspaceId, delegationId } = body as { workspaceId?: string; delegationId?: string };

      if (!workspaceId || !delegationId) {
        return errorResponse("Missing workspaceId or delegationId");
      }

      await ensureWorkspaceOwner(workspaceId);

      const { error } = await supabaseClient
        .from("certificate_delegation")
        .delete()
        .eq("id", delegationId)
        .eq("root_workspace_id", workspaceId);

      if (error) {
        console.error("removeDelegation error", error);
        return errorResponse(error.message, 500);
      }

      return successResponse({ success: true });
    }

    // ========== ACTION: getMyDelegation (for delegated workspace) ==========
    if (action === "getMyDelegation") {
      const { workspaceId } = body as { workspaceId?: string };
      
      if (!workspaceId) {
        return errorResponse("Missing workspaceId");
      }

      await requireUser();

      const { data, error } = await supabaseClient
        .from("certificate_delegation")
        .select(`
          id,
          root_workspace_id,
          can_design_templates,
          can_define_criteria,
          can_generate,
          can_distribute,
          delegated_at,
          notes,
          workspaces!certificate_delegation_root_workspace_id_fkey (id, name, event_id)
        `)
        .eq("delegated_workspace_id", workspaceId)
        .maybeSingle();

      if (error) {
        console.error("getMyDelegation error", error);
        return errorResponse(error.message, 500);
      }

      if (!data) {
        return successResponse({ delegation: null });
      }

      return successResponse({
        delegation: {
          id: data.id,
          rootWorkspaceId: data.root_workspace_id,
          rootWorkspaceName: (data.workspaces as any)?.name ?? "Unknown",
          eventId: (data.workspaces as any)?.event_id,
          canDesignTemplates: data.can_design_templates,
          canDefineCriteria: data.can_define_criteria,
          canGenerate: data.can_generate,
          canDistribute: data.can_distribute,
          delegatedAt: data.delegated_at,
          notes: data.notes,
        },
      });
    }

    // ==================== TEMPLATE ACTIONS ====================

    // ========== ACTION: listTemplates ==========
    if (action === "listTemplates") {
      const { workspaceId } = body as { workspaceId?: string };
      
      if (!workspaceId) {
        return errorResponse("Missing workspaceId");
      }

      await requireUser();

      const { data, error } = await supabaseClient
        .from("certificate_templates")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("listTemplates error", error);
        return errorResponse(error.message, 500);
      }

      return successResponse({ data: data ?? [] });
    }

    // ========== ACTION: createTemplate ==========
    if (action === "createTemplate") {
      const { workspaceId, template } = body as {
        workspaceId?: string;
        template?: {
          name: string;
          type: string;
          backgroundUrl?: string;
          logoUrl?: string;
          signatureUrl?: string;
          branding?: Record<string, unknown>;
          content?: Record<string, unknown>;
          isDefault?: boolean;
        };
      };

      if (!workspaceId || !template) {
        return errorResponse("Missing workspaceId or template");
      }

      await ensureCertificatePermission(workspaceId, 'design');
      const workspace = await getWorkspaceWithEvent(workspaceId);

      // If setting as default, unset other defaults of same type
      if (template.isDefault) {
        await supabaseClient
          .from("certificate_templates")
          .update({ is_default: false })
          .eq("workspace_id", workspaceId)
          .eq("type", template.type);
      }

      const { data, error } = await supabaseClient
        .from("certificate_templates")
        .insert({
          workspace_id: workspaceId,
          event_id: workspace.event_id,
          name: template.name,
          type: template.type,
          background_url: template.backgroundUrl ?? null,
          logo_url: template.logoUrl ?? null,
          signature_url: template.signatureUrl ?? null,
          branding: template.branding ?? {},
          content: template.content ?? {},
          is_default: template.isDefault ?? false,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) {
        console.error("createTemplate error", error);
        return errorResponse(error.message, 500);
      }

      return successResponse({ success: true, data });
    }

    // ========== ACTION: updateTemplate ==========
    if (action === "updateTemplate") {
      const { workspaceId, templateId, template } = body as {
        workspaceId?: string;
        templateId?: string;
        template?: {
          name?: string;
          type?: string;
          backgroundUrl?: string;
          logoUrl?: string;
          signatureUrl?: string;
          branding?: Record<string, unknown>;
          content?: Record<string, unknown>;
          isDefault?: boolean;
        };
      };

      if (!workspaceId || !templateId || !template) {
        return errorResponse("Missing workspaceId, templateId, or template");
      }

      await ensureCertificatePermission(workspaceId, 'design');

      // If setting as default, unset other defaults of same type
      if (template.isDefault && template.type) {
        await supabaseClient
          .from("certificate_templates")
          .update({ is_default: false })
          .eq("workspace_id", workspaceId)
          .eq("type", template.type)
          .neq("id", templateId);
      }

      const updateData: Record<string, unknown> = {};
      if (template.name !== undefined) updateData.name = template.name;
      if (template.type !== undefined) updateData.type = template.type;
      if (template.backgroundUrl !== undefined) updateData.background_url = template.backgroundUrl;
      if (template.logoUrl !== undefined) updateData.logo_url = template.logoUrl;
      if (template.signatureUrl !== undefined) updateData.signature_url = template.signatureUrl;
      if (template.branding !== undefined) updateData.branding = template.branding;
      if (template.content !== undefined) updateData.content = template.content;
      if (template.isDefault !== undefined) updateData.is_default = template.isDefault;

      const { error } = await supabaseClient
        .from("certificate_templates")
        .update(updateData)
        .eq("id", templateId)
        .eq("workspace_id", workspaceId);

      if (error) {
        console.error("updateTemplate error", error);
        return errorResponse(error.message, 500);
      }

      return successResponse({ success: true });
    }

    // ========== ACTION: deleteTemplate ==========
    if (action === "deleteTemplate") {
      const { workspaceId, templateId } = body as { workspaceId?: string; templateId?: string };

      if (!workspaceId || !templateId) {
        return errorResponse("Missing workspaceId or templateId");
      }

      await ensureCertificatePermission(workspaceId, 'design');

      const { error } = await supabaseClient
        .from("certificate_templates")
        .delete()
        .eq("id", templateId)
        .eq("workspace_id", workspaceId);

      if (error) {
        console.error("deleteTemplate error", error);
        return errorResponse(error.message, 500);
      }

      return successResponse({ success: true });
    }

    // ==================== EXISTING ACTIONS (updated with permission checks) ====================

    // ========== ACTION: getCriteria ==========
    if (action === "getCriteria") {
      await requireUser();
      const { workspaceId } = body as { workspaceId?: string };

      if (!workspaceId) {
        return errorResponse("Missing workspaceId");
      }

      const workspace = await getWorkspaceWithEvent(workspaceId);

      const { data, error } = await supabaseClient
        .from("certificate_criteria")
        .select("type, conditions")
        .eq("workspace_id", workspaceId);

      if (error) {
        console.error("certificates:getCriteria error", error);
        return errorResponse(error.message, 500);
      }

      return successResponse({ data: data ?? [], eventId: workspace.event_id });
    }

    // ========== ACTION: saveCriteria (now requires 'criteria' permission) ==========
    if (action === "saveCriteria") {
      const { workspaceId, criteria } = body as {
        workspaceId?: string;
        criteria?: Array<{ type: string; conditions: Record<string, unknown> }>;
      };

      if (!workspaceId || !criteria) {
        return errorResponse("Missing workspaceId or criteria");
      }

      await ensureCertificatePermission(workspaceId, 'criteria');
      const workspace = await getWorkspaceWithEvent(workspaceId);

      // Delete existing criteria for this workspace
      const { error: deleteError } = await supabaseClient
        .from("certificate_criteria")
        .delete()
        .eq("workspace_id", workspaceId);

      if (deleteError) {
        console.error("certificates:saveCriteria delete error", deleteError);
        return errorResponse(deleteError.message, 500);
      }

      if (criteria.length === 0) {
        return successResponse({ success: true });
      }

      const insertRows = criteria.map((c) => ({
        event_id: workspace.event_id,
        workspace_id: workspaceId,
        type: c.type,
        conditions: c.conditions ?? {},
      }));

      const { error: insertError } = await supabaseClient
        .from("certificate_criteria")
        .insert(insertRows);

      if (insertError) {
        console.error("certificates:saveCriteria insert error", insertError);
        return errorResponse(insertError.message, 500);
      }

      return successResponse({ success: true });
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
        return errorResponse(error.message, 500);
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

      return successResponse({ certificates: mapped });
    }

    // ========== ACTION: listWorkspaceCertificates ==========
    if (action === "listWorkspaceCertificates") {
      const { workspaceId } = body as { workspaceId?: string };
      
      if (!workspaceId) {
        return errorResponse("Missing workspaceId");
      }

      // Allow access if user has distribute permission or is workspace manager
      try {
        await ensureCertificatePermission(workspaceId, 'distribute');
      } catch {
        await ensureWorkspaceManager(workspaceId);
      }
      
      const workspace = await getWorkspaceWithEvent(workspaceId);

      const { data, error } = await supabaseClient
        .from("certificates")
        .select(
          `id, certificate_id, recipient_id, event_id, type, pdf_url, qr_payload, issued_at, distributed_at, template_id,
           user_profiles!inner ( full_name, id ),
           events!inner ( id, name )`
        )
        .eq("workspace_id", workspaceId)
        .order("issued_at", { ascending: false });

      if (error) {
        console.error("certificates:listWorkspaceCertificates error", error);
        return errorResponse(error.message, 500);
      }

      const mapped = (data ?? []).map((row: any) => ({
        id: row.id,
        certificateId: row.certificate_id,
        recipientId: row.recipient_id,
        eventId: row.event_id,
        type: row.type,
        pdfUrl: row.pdf_url ?? "",
        qrCodeUrl: "",
        issuedAt: row.issued_at,
        distributedAt: row.distributed_at ?? undefined,
        templateId: row.template_id,
        recipient: {
          name: row.user_profiles.full_name ?? "Participant",
          email: "",
        },
      }));

      return successResponse({ data: mapped, eventId: workspace.event_id });
    }

    // Helper: evaluate criteria for a participant
    function participantMeetsCriteria(
      criteria: any[],
      context: { score?: number | null; rank?: number | null; attended: boolean; roles: string[] },
      type: string
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

    // ========== ACTION: batchGenerate (now requires 'generate' permission) ==========
    if (action === "batchGenerate") {
      const { workspaceId, templateId } = body as { workspaceId?: string; templateId?: string };
      
      if (!workspaceId) {
        return errorResponse("Missing workspaceId");
      }

      await ensureCertificatePermission(workspaceId, 'generate');
      const workspace = await getWorkspaceWithEvent(workspaceId);
      const eventId = workspace.event_id;

      const { data: criteria, error: criteriaError } = await supabaseClient
        .from("certificate_criteria")
        .select("type, conditions")
        .eq("workspace_id", workspaceId);

      if (criteriaError) {
        console.error("certificates:batchGenerate criteria error", criteriaError);
        return errorResponse(criteriaError.message, 500);
      }

      if (!criteria || criteria.length === 0) {
        return errorResponse("No certificate criteria configured for this workspace");
      }

      const { data: registrations, error: registrationsError } = await supabaseClient
        .from("registrations")
        .select("id, user_id, event_id, status")
        .eq("event_id", eventId)
        .eq("status", "CONFIRMED");

      if (registrationsError) {
        console.error("certificates:batchGenerate registrations error", registrationsError);
        return errorResponse(registrationsError.message, 500);
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
        return errorResponse(attendanceError.message, 500);
      }

      const attendedByRegistration = new Set<string>();
      (attendance ?? []).forEach((r: any) => attendedByRegistration.add(r.registration_id));

      const { data: roles, error: rolesError } = await supabaseClient
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("certificates:batchGenerate roles error", rolesError);
        return errorResponse(rolesError.message, 500);
      }

      const rolesByUserId = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const current = rolesByUserId.get(r.user_id) ?? [];
        current.push(r.role);
        rolesByUserId.set(r.user_id, current);
      });

      // Get default templates for each type if templateId not provided
      let templatesByType: Record<string, string | null> = {
        COMPLETION: null,
        MERIT: null,
        APPRECIATION: null,
      };

      if (!templateId) {
        const { data: defaultTemplates } = await supabaseClient
          .from("certificate_templates")
          .select("id, type")
          .eq("workspace_id", workspaceId)
          .eq("is_default", true);

        (defaultTemplates ?? []).forEach((t: any) => {
          templatesByType[t.type] = t.id;
        });
      } else {
        // Use the same template for all types
        templatesByType = {
          COMPLETION: templateId,
          MERIT: templateId,
          APPRECIATION: templateId,
        };
      }

      const certificatesToInsert: any[] = [];

      for (const reg of registrations ?? []) {
        const userRoles = rolesByUserId.get(reg.user_id) ?? [];
        const attended = attendedByRegistration.has(reg.id);

        const context = {
          score: null,
          rank: null,
          attended,
          roles: userRoles,
        };

        const typesToIssue = ["COMPLETION", "MERIT", "APPRECIATION"].filter((t) =>
          participantMeetsCriteria(criteria ?? [], context, t)
        );

        for (const type of typesToIssue) {
          const certificateId = generateCertificateId(eventId);
          const qrPayload = buildQrPayload(certificateId);

          certificatesToInsert.push({
            certificate_id: certificateId,
            recipient_id: reg.user_id,
            event_id: eventId,
            workspace_id: workspaceId,
            type,
            qr_payload: qrPayload,
            metadata: {},
            template_id: templatesByType[type] ?? null,
          });
        }
      }

      if (!certificatesToInsert.length) {
        return successResponse({ success: true, generatedCount: 0 });
      }

      const { error: insertError } = await supabaseClient.from("certificates").insert(certificatesToInsert);

      if (insertError) {
        console.error("certificates:batchGenerate insert error", insertError);
        return errorResponse(insertError.message, 500);
      }

      return successResponse({ success: true, generatedCount: certificatesToInsert.length, eventId, workspaceId });
    }

    // ========== ACTION: distribute (now requires 'distribute' permission) ==========
    if (action === "distribute") {
      const { workspaceId, certificateIds } = body as { workspaceId?: string; certificateIds?: string[] };
      
      if (!workspaceId) {
        return errorResponse("Missing workspaceId");
      }
      
      if (!certificateIds || certificateIds.length === 0) {
        return errorResponse("No certificates selected");
      }

      await ensureCertificatePermission(workspaceId, 'distribute');

      const { error } = await supabaseClient
        .from("certificates")
        .update({ distributed_at: new Date().toISOString() })
        .eq("workspace_id", workspaceId)
        .in("id", certificateIds);

      if (error) {
        console.error("certificates:distribute error", error);
        return errorResponse(error.message, 500);
      }

      return successResponse({ success: true });
    }

    // ========== ACTION: verify (public via service role) ==========
    if (action === "verify") {
      const { certificateId } = body as { certificateId?: string };
      if (!certificateId) {
        return errorResponse("Missing certificateId");
      }

      const { data, error } = await serviceClient
        .from("certificates")
        .select(
          `id, certificate_id, type, issued_at, recipient_id, event_id, workspace_id, template_id,
           events!inner ( name ),
           user_profiles:recipient_id ( full_name ),
           workspaces:workspace_id ( name ),
           certificate_templates:template_id ( name, branding, content )`
        )
        .eq("certificate_id", certificateId)
        .maybeSingle();

      if (error) {
        console.error("certificates:verify error", error);
        return errorResponse("Verification failed", 500);
      }

      if (!data) {
        return new Response(
          JSON.stringify({ valid: false, error: "Certificate not found. Please check the ID and try again." }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const certificate = {
        id: data.id,
        certificateId: data.certificate_id,
        recipientName: (data.user_profiles as any)?.full_name ?? "Participant",
        eventName: (data.events as any).name,
        workspaceName: (data.workspaces as any)?.name ?? undefined,
        eventOrganization: undefined,
        type: data.type,
        issuedAt: data.issued_at,
        issuerName: "Thittam1Hub",
        template: data.certificate_templates ? {
          name: (data.certificate_templates as any).name,
          branding: (data.certificate_templates as any).branding,
          content: (data.certificate_templates as any).content,
        } : null,
      };

      return successResponse({ valid: true, certificate });
    }

    // ========== ACTION: getStats (workspace certificate statistics) ==========
    if (action === "getStats") {
      const { workspaceId } = body as { workspaceId?: string };
      
      if (!workspaceId) {
        return errorResponse("Missing workspaceId");
      }

      await requireUser();

      const { data, error } = await supabaseClient
        .from("certificates")
        .select("id, distributed_at, type")
        .eq("workspace_id", workspaceId);

      if (error) {
        console.error("certificates:getStats error", error);
        return errorResponse(error.message, 500);
      }

      const total = data?.length ?? 0;
      const distributed = data?.filter((c: any) => c.distributed_at).length ?? 0;
      const pending = total - distributed;

      const byType = {
        COMPLETION: data?.filter((c: any) => c.type === "COMPLETION").length ?? 0,
        MERIT: data?.filter((c: any) => c.type === "MERIT").length ?? 0,
        APPRECIATION: data?.filter((c: any) => c.type === "APPRECIATION").length ?? 0,
      };

      return successResponse({ total, distributed, pending, byType });
    }

    return errorResponse("Unsupported action");
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
