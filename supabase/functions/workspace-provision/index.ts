/**
 * Workspace Provision Edge Function
 * Auto-provisions core workspaces when an event is published
 * 
 * Creates:
 * - ROOT workspace (if not exists)
 * - Registration Committee
 * - Operations Department
 * - Communications Committee
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface WorkspaceTemplate {
  name: string;
  workspaceType: "ROOT" | "DEPARTMENT" | "COMMITTEE";
  description: string;
  icon?: string;
}

const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  {
    name: "Event Management",
    workspaceType: "ROOT",
    description: "Root workspace for overall event management",
    icon: "building",
  },
  {
    name: "Registration Committee",
    workspaceType: "COMMITTEE",
    description: "Handles attendee registration, check-ins, and badge management",
    icon: "clipboard-check",
  },
  {
    name: "Operations Department",
    workspaceType: "DEPARTMENT",
    description: "Manages venue logistics, catering, and on-site operations",
    icon: "cog",
  },
  {
    name: "Communications Committee",
    workspaceType: "COMMITTEE",
    description: "Handles attendee communications, announcements, and social media",
    icon: "megaphone",
  },
];

interface ProvisionRequest {
  eventId: string;
  organizationId: string;
  requestedBy: string;
  skipExisting?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
      },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const body: ProvisionRequest = await req.json();
    const { eventId, organizationId, requestedBy, skipExisting = true } = body;

    if (!eventId || !organizationId || !requestedBy) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: eventId, organizationId, requestedBy" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify event exists
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, name, organization_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify organization matches
    if (event.organization_id !== organizationId) {
      return new Response(
        JSON.stringify({ error: "Organization mismatch" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get existing workspaces for this event
    const { data: existingWorkspaces } = await supabase
      .from("workspaces")
      .select("id, name, workspace_type")
      .eq("event_id", eventId);

    const existingTypes = new Set(existingWorkspaces?.map(w => w.workspace_type) || []);
    
    const createdWorkspaces: Array<{ id: string; name: string; type: string }> = [];
    const skippedWorkspaces: string[] = [];
    let rootWorkspaceId: string | null = null;

    // Create workspaces in order (ROOT first)
    for (const template of WORKSPACE_TEMPLATES) {
      // Skip if exists and skipExisting is true
      if (skipExisting && existingTypes.has(template.workspaceType)) {
        skippedWorkspaces.push(template.name);
        
        // Still need to capture ROOT workspace ID for parent reference
        if (template.workspaceType === "ROOT") {
          const existing = existingWorkspaces?.find(w => w.workspace_type === "ROOT");
          if (existing) rootWorkspaceId = existing.id;
        }
        continue;
      }

      const workspaceData = {
        name: template.name,
        organization_id: organizationId,
        event_id: eventId,
        workspace_type: template.workspaceType,
        description: template.description,
        parent_workspace_id: template.workspaceType !== "ROOT" ? rootWorkspaceId : null,
        created_by: requestedBy,
        settings: {
          icon: template.icon,
          autoProvisioned: true,
          provisionedAt: new Date().toISOString(),
        },
      };

      const { data: workspace, error: insertError } = await supabase
        .from("workspaces")
        .insert(workspaceData)
        .select("id, name, workspace_type")
        .single();

      if (insertError) {
        console.error(`Failed to create workspace ${template.name}:`, insertError);
        continue;
      }

      if (template.workspaceType === "ROOT") {
        rootWorkspaceId = workspace.id;
      }

      createdWorkspaces.push({
        id: workspace.id,
        name: workspace.name,
        type: workspace.workspace_type,
      });

      // Add the requestedBy user as an owner/admin of the workspace
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspace.id,
          user_id: requestedBy,
          role: template.workspaceType === "ROOT" ? "OWNER" : "ADMIN",
          invited_by: requestedBy,
          status: "ACTIVE",
        });

      if (memberError) {
        console.error(`Failed to add member to workspace ${template.name}:`, memberError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventId,
        created: createdWorkspaces,
        skipped: skippedWorkspaces,
        rootWorkspaceId,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Workspace provision error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
