/**
 * Workspace Provision Edge Function
 * Auto-provisions core workspaces AND default channels when an event is published
 * 
 * Creates:
 * - ROOT workspace (if not exists)
 * - Registration Committee
 * - Operations Department
 * - Communications Committee
 * - Default participant channels based on selected template
 * - Channel categories for organization
 * 
 * Supports channel templates: conference, hackathon, workshop, networking, meetup
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Channel prefixes for standardized naming
const CHANNEL_PREFIXES = {
  announcement: 'announce-',
  session: 'session-',
  networking: 'network-',
  help: 'help-',
  booth: 'booth-',
  stage: 'stage-',
  team: 'team-',
  general: '',
} as const;

interface WorkspaceTemplate {
  name: string;
  workspaceType: "ROOT" | "DEPARTMENT" | "COMMITTEE";
  description: string;
  icon?: string;
}

interface ChannelTemplateConfig {
  name: string;
  description: string;
  type: "general" | "announcement" | "private" | "task";
  isParticipantChannel: boolean;
  participantCanWrite: boolean;
  autoJoinOnRegistration: boolean;
  sortOrder: number;
  icon: string;
  categoryId?: string;
  permissions?: {
    can_read: boolean;
    can_write: boolean;
    can_react: boolean;
    can_thread_reply: boolean;
    can_upload_files: boolean;
    can_mention_all: boolean;
  };
}

interface ChannelCategory {
  name: string;
  description: string;
  sortOrder: number;
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

// Default channel categories (Discord-style organization)
const DEFAULT_CATEGORIES: ChannelCategory[] = [
  { name: "Information", description: "Official announcements and resources", sortOrder: 1 },
  { name: "General", description: "Open discussion channels", sortOrder: 2 },
  { name: "Networking", description: "Connect with others", sortOrder: 3 },
  { name: "Support", description: "Help and assistance", sortOrder: 4 },
];

// Channel templates organized by event type
const CHANNEL_TEMPLATES: Record<string, ChannelTemplateConfig[]> = {
  conference: [
    {
      name: "announcements",
      description: "Official event announcements from organizers",
      type: "announcement",
      isParticipantChannel: true,
      participantCanWrite: false,
      autoJoinOnRegistration: true,
      sortOrder: 1,
      icon: "megaphone",
      permissions: { can_read: true, can_write: false, can_react: true, can_thread_reply: false, can_upload_files: false, can_mention_all: false },
    },
    {
      name: "general",
      description: "Open discussion for all participants",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: true,
      sortOrder: 2,
      icon: "message-circle",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: true, can_mention_all: false },
    },
    {
      name: "help-desk",
      description: "Get help from event organizers and volunteers",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: true,
      sortOrder: 3,
      icon: "help-circle",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: false, can_mention_all: false },
    },
    {
      name: "networking",
      description: "Connect and network with other participants",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: true,
      sortOrder: 4,
      icon: "users",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: true, can_mention_all: false },
    },
    {
      name: "job-board",
      description: "Job opportunities and career discussions",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: false,
      sortOrder: 5,
      icon: "briefcase",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: false, can_mention_all: false },
    },
    {
      name: "feedback",
      description: "Share your feedback about the event",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: false,
      sortOrder: 6,
      icon: "message-square",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: false, can_mention_all: false },
    },
  ],
  hackathon: [
    {
      name: "announcements",
      description: "Official hackathon announcements",
      type: "announcement",
      isParticipantChannel: true,
      participantCanWrite: false,
      autoJoinOnRegistration: true,
      sortOrder: 1,
      icon: "megaphone",
      permissions: { can_read: true, can_write: false, can_react: true, can_thread_reply: false, can_upload_files: false, can_mention_all: false },
    },
    {
      name: "general",
      description: "General hackathon discussion",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: true,
      sortOrder: 2,
      icon: "message-circle",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: true, can_mention_all: false },
    },
    {
      name: "team-formation",
      description: "Find teammates and form your team",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: true,
      sortOrder: 3,
      icon: "users-plus",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: true, can_mention_all: false },
    },
    {
      name: "help-mentors",
      description: "Get help from mentors and sponsors",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: true,
      sortOrder: 4,
      icon: "life-buoy",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: false, can_mention_all: false },
    },
    {
      name: "resources",
      description: "APIs, tools, and useful resources",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: false,
      autoJoinOnRegistration: true,
      sortOrder: 5,
      icon: "book-open",
      permissions: { can_read: true, can_write: false, can_react: true, can_thread_reply: false, can_upload_files: false, can_mention_all: false },
    },
    {
      name: "showcase",
      description: "Show off your projects and demos",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: false,
      sortOrder: 6,
      icon: "trophy",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: true, can_mention_all: false },
    },
  ],
  workshop: [
    {
      name: "announcements",
      description: "Workshop updates and schedule changes",
      type: "announcement",
      isParticipantChannel: true,
      participantCanWrite: false,
      autoJoinOnRegistration: true,
      sortOrder: 1,
      icon: "megaphone",
      permissions: { can_read: true, can_write: false, can_react: true, can_thread_reply: false, can_upload_files: false, can_mention_all: false },
    },
    {
      name: "questions",
      description: "Ask questions during the workshop",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: true,
      sortOrder: 2,
      icon: "help-circle",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: false, can_mention_all: false },
    },
    {
      name: "resources",
      description: "Workshop materials and downloads",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: false,
      autoJoinOnRegistration: true,
      sortOrder: 3,
      icon: "folder",
      permissions: { can_read: true, can_write: false, can_react: true, can_thread_reply: false, can_upload_files: false, can_mention_all: false },
    },
    {
      name: "general",
      description: "General discussion",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: true,
      sortOrder: 4,
      icon: "message-circle",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: true, can_mention_all: false },
    },
  ],
  networking: [
    {
      name: "announcements",
      description: "Event updates",
      type: "announcement",
      isParticipantChannel: true,
      participantCanWrite: false,
      autoJoinOnRegistration: true,
      sortOrder: 1,
      icon: "megaphone",
      permissions: { can_read: true, can_write: false, can_react: true, can_thread_reply: false, can_upload_files: false, can_mention_all: false },
    },
    {
      name: "introductions",
      description: "Introduce yourself to the community",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: true,
      sortOrder: 2,
      icon: "user-plus",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: true, can_mention_all: false },
    },
    {
      name: "networking",
      description: "Connect with other attendees",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: true,
      sortOrder: 3,
      icon: "users",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: true, can_mention_all: false },
    },
    {
      name: "opportunities",
      description: "Share job opportunities and collaborations",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: false,
      sortOrder: 4,
      icon: "briefcase",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: false, can_mention_all: false },
    },
  ],
  meetup: [
    {
      name: "announcements",
      description: "Meetup announcements",
      type: "announcement",
      isParticipantChannel: true,
      participantCanWrite: false,
      autoJoinOnRegistration: true,
      sortOrder: 1,
      icon: "megaphone",
      permissions: { can_read: true, can_write: false, can_react: true, can_thread_reply: false, can_upload_files: false, can_mention_all: false },
    },
    {
      name: "general",
      description: "General discussion",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: true,
      sortOrder: 2,
      icon: "message-circle",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: true, can_mention_all: false },
    },
    {
      name: "help",
      description: "Get help from organizers",
      type: "general",
      isParticipantChannel: true,
      participantCanWrite: true,
      autoJoinOnRegistration: true,
      sortOrder: 3,
      icon: "help-circle",
      permissions: { can_read: true, can_write: true, can_react: true, can_thread_reply: true, can_upload_files: false, can_mention_all: false },
    },
  ],
};

interface ProvisionRequest {
  eventId: string;
  organizationId: string;
  requestedBy: string;
  skipExisting?: boolean;
  createDefaultChannels?: boolean;
  channelTemplate?: string; // 'conference' | 'hackathon' | 'workshop' | 'networking' | 'meetup'
}

interface CreatedChannel {
  id: string;
  name: string;
  type: string;
  isParticipantChannel: boolean;
  categoryId?: string;
}

interface CreatedCategory {
  id: string;
  name: string;
}

// Create channel categories for organization
async function createChannelCategories(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  workspaceId: string
): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>();

  for (const category of DEFAULT_CATEGORIES) {
    const { data: existing } = await supabase
      .from("workspace_channel_categories")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("name", category.name)
      .single();

    if (existing) {
      categoryMap.set(category.name.toLowerCase(), existing.id);
      continue;
    }

    const { data, error } = await supabase
      .from("workspace_channel_categories")
      .insert({
        workspace_id: workspaceId,
        name: category.name,
        description: category.description,
        sort_order: category.sortOrder,
      })
      .select("id")
      .single();

    if (!error && data) {
      categoryMap.set(category.name.toLowerCase(), data.id);
    }
  }

  return categoryMap;
}

// Get category ID for a channel based on its type
function getCategoryForChannel(channelName: string, categoryMap: Map<string, string>): string | null {
  if (channelName.includes('announce') || channelName === 'resources') {
    return categoryMap.get('information') || null;
  }
  if (channelName === 'general' || channelName === 'questions') {
    return categoryMap.get('general') || null;
  }
  if (channelName.includes('network') || channelName === 'introductions' || channelName === 'team-formation') {
    return categoryMap.get('networking') || null;
  }
  if (channelName.includes('help') || channelName === 'feedback') {
    return categoryMap.get('support') || null;
  }
  return categoryMap.get('general') || null;
}

async function createDefaultChannels(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  workspaceId: string,
  createdBy: string,
  templateType: string = 'conference'
): Promise<{ channels: CreatedChannel[]; categories: CreatedCategory[] }> {
  const createdChannels: CreatedChannel[] = [];
  const createdCategories: CreatedCategory[] = [];

  // Get channel templates for the specified type (default to conference)
  const channelTemplates = CHANNEL_TEMPLATES[templateType] || CHANNEL_TEMPLATES.conference;

  // Create categories first
  const categoryMap = await createChannelCategories(supabase, workspaceId);
  
  // Return created categories
  for (const [name, id] of categoryMap) {
    createdCategories.push({ id, name });
  }

  for (const template of channelTemplates) {
    // Check if channel already exists
    const { data: existing } = await supabase
      .from("workspace_channels")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("name", template.name)
      .single();

    if (existing) {
      console.log(`Channel ${template.name} already exists, skipping`);
      continue;
    }

    // Get appropriate category for this channel
    const categoryId = getCategoryForChannel(template.name, categoryMap);

    const { data: channel, error } = await supabase
      .from("workspace_channels")
      .insert({
        workspace_id: workspaceId,
        name: template.name,
        description: template.description,
        type: template.type,
        is_private: false,
        is_participant_channel: template.isParticipantChannel,
        participant_permissions: template.permissions || {
          can_read: true,
          can_write: template.participantCanWrite,
        },
        auto_join_on_registration: template.autoJoinOnRegistration,
        created_by: createdBy,
        category_id: categoryId,
        metadata: {
          icon: template.icon,
          sortOrder: template.sortOrder,
          autoProvisioned: true,
          templateType,
        },
      })
      .select("id, name, type, is_participant_channel, category_id")
      .single();

    if (error) {
      console.error(`Failed to create channel ${template.name}:`, error);
      continue;
    }

    createdChannels.push({
      id: channel.id as string,
      name: channel.name as string,
      type: channel.type as string,
      isParticipantChannel: channel.is_participant_channel as boolean,
      categoryId: channel.category_id as string | undefined,
    });

    // Add the creator as a channel member
    await supabase.from("channel_members").insert({
      channel_id: channel.id,
      user_id: createdBy,
      user_name: null, // Will be fetched by the app
    });
  }

  return { channels: createdChannels, categories: createdCategories };
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
    const { 
      eventId, 
      organizationId, 
      requestedBy, 
      skipExisting = true,
      createDefaultChannels: shouldCreateChannels = true,
      channelTemplate = 'conference'
    } = body;

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
    let channelResult: { channels: CreatedChannel[]; categories: CreatedCategory[] } = { channels: [], categories: [] };

    // Create workspaces in order (ROOT first)
    for (const template of WORKSPACE_TEMPLATES) {
      // Skip if exists and skipExisting is true
      if (skipExisting && existingTypes.has(template.workspaceType)) {
        skippedWorkspaces.push(template.name);
        
        // Still need to capture ROOT workspace ID for parent reference and channel creation
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

    // Create default channels for the ROOT workspace
    if (shouldCreateChannels && rootWorkspaceId) {
      channelResult = await createDefaultChannels(supabase, rootWorkspaceId, requestedBy, channelTemplate);
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventId,
        created: createdWorkspaces,
        skipped: skippedWorkspaces,
        rootWorkspaceId,
        channels: channelResult.channels,
        categories: channelResult.categories,
        templateUsed: channelTemplate,
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
