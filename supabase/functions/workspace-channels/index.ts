/**
 * Workspace Channels Edge Function
 * CRUD operations for workspace communication channels
 * 
 * Endpoints:
 * - GET: List channels for a workspace
 * - POST: Create a new channel
 * - PUT: Update a channel
 * - DELETE: Delete a channel
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface ChannelRequest {
  workspaceId: string;
  channelId?: string;
  name?: string;
  description?: string;
  channelType?: "general" | "announcements" | "tasks" | "social" | "private";
  isPrivate?: boolean;
  members?: string[];
}

async function getUserFromAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  
  return user.id;
}

// deno-lint-ignore no-explicit-any
async function verifyWorkspaceMember(
  supabase: any,
  userId: string,
  workspaceId: string
): Promise<{ isMember: boolean; role: string | null }> {
  const { data, error } = await supabase
    .from("workspace_team_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error || !data) {
    return { isMember: false, role: null };
  }

  return { isMember: true, role: data.role as string };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userId = await getUserFromAuth(req);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const workspaceId = url.searchParams.get("workspaceId");

    if (!workspaceId) {
      return new Response(
        JSON.stringify({ error: "workspaceId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is a member of the workspace
    const { isMember, role } = await verifyWorkspaceMember(supabase, userId, workspaceId);
    if (!isMember) {
      return new Response(
        JSON.stringify({ error: "Access denied: Not a workspace member" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle different HTTP methods
    switch (req.method) {
      case "GET": {
        // List channels for workspace
        const { data: channels, error } = await supabase
          .from("workspace_channels")
          .select(`
            id,
            name,
            description,
            channel_type,
            is_private,
            created_at,
            updated_at,
            created_by,
            channel_members!inner(user_id)
          `)
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching channels:", error);
          return new Response(
            JSON.stringify({ error: "Failed to fetch channels" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Filter to only show channels user is a member of (or public channels)
        const visibleChannels = channels?.filter(ch => {
          if (!ch.is_private) return true;
          return ch.channel_members?.some((m: { user_id: string }) => m.user_id === userId);
        }) || [];

        // Get unread counts
        const channelIds = visibleChannels.map(c => c.id);
        const { data: readReceipts } = await supabase
          .from("channel_members")
          .select("channel_id, last_read_at")
          .eq("user_id", userId)
          .in("channel_id", channelIds);

        const readReceiptMap = new Map(readReceipts?.map(r => [r.channel_id, r.last_read_at]) || []);

        // Get latest message timestamps per channel
        const { data: latestMessages } = await supabase
          .from("channel_messages")
          .select("channel_id, created_at")
          .in("channel_id", channelIds)
          .order("created_at", { ascending: false });

        const latestMessageMap = new Map<string, string>();
        latestMessages?.forEach(msg => {
          if (!latestMessageMap.has(msg.channel_id)) {
            latestMessageMap.set(msg.channel_id, msg.created_at);
          }
        });

        const channelsWithUnread = visibleChannels.map(channel => {
          const lastRead = readReceiptMap.get(channel.id);
          const lastMessage = latestMessageMap.get(channel.id);
          const hasUnread = lastMessage && (!lastRead || new Date(lastMessage) > new Date(lastRead));
          
          return {
            ...channel,
            hasUnread,
            memberCount: channel.channel_members?.length || 0,
          };
        });

        return new Response(
          JSON.stringify({ channels: channelsWithUnread }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "POST": {
        // Create new channel
        const body: ChannelRequest = await req.json();
        const { name, description, channelType = "general", isPrivate = false, members = [] } = body;

        if (!name) {
          return new Response(
            JSON.stringify({ error: "Channel name is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Only managers and above can create channels
        if (!["OWNER", "ADMIN", "MANAGER", "LEAD"].includes(role || "")) {
          return new Response(
            JSON.stringify({ error: "Insufficient permissions to create channels" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create channel
        const { data: channel, error: createError } = await supabase
          .from("workspace_channels")
          .insert({
            workspace_id: workspaceId,
            name,
            description: description || null,
            channel_type: channelType,
            is_private: isPrivate,
            created_by: userId,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating channel:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create channel" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Add creator as member
        const memberInserts = [
          { channel_id: channel.id, user_id: userId },
          ...members.filter(m => m !== userId).map(m => ({ channel_id: channel.id, user_id: m }))
        ];

        await supabase.from("channel_members").insert(memberInserts);

        return new Response(
          JSON.stringify({ channel }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "PUT": {
        // Update channel
        const body: ChannelRequest = await req.json();
        const { channelId, name, description, isPrivate } = body;

        if (!channelId) {
          return new Response(
            JSON.stringify({ error: "channelId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify channel exists and user has permission
        const { data: existingChannel } = await supabase
          .from("workspace_channels")
          .select("id, created_by")
          .eq("id", channelId)
          .eq("workspace_id", workspaceId)
          .single();

        if (!existingChannel) {
          return new Response(
            JSON.stringify({ error: "Channel not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Only creator or admins can update
        const canUpdate = existingChannel.created_by === userId || 
          ["OWNER", "ADMIN", "MANAGER"].includes(role || "");
        
        if (!canUpdate) {
          return new Response(
            JSON.stringify({ error: "Insufficient permissions to update channel" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (isPrivate !== undefined) updateData.is_private = isPrivate;

        const { data: updated, error: updateError } = await supabase
          .from("workspace_channels")
          .update(updateData)
          .eq("id", channelId)
          .select()
          .single();

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to update channel" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ channel: updated }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "DELETE": {
        const channelId = url.searchParams.get("channelId");

        if (!channelId) {
          return new Response(
            JSON.stringify({ error: "channelId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Only admins can delete channels
        if (!["OWNER", "ADMIN"].includes(role || "")) {
          return new Response(
            JSON.stringify({ error: "Insufficient permissions to delete channel" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete channel members first, then channel
        await supabase.from("channel_members").delete().eq("channel_id", channelId);
        await supabase.from("channel_messages").delete().eq("channel_id", channelId);
        
        const { error: deleteError } = await supabase
          .from("workspace_channels")
          .delete()
          .eq("id", channelId)
          .eq("workspace_id", workspaceId);

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: "Failed to delete channel" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Workspace channels error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
