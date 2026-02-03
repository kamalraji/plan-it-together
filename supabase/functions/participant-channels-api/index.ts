/**
 * Participant Channels API - Mobile-friendly REST API
 * 
 * Endpoints:
 * GET ?eventId=X - List participant-accessible channels
 * GET ?eventId=X&channelId=Y - Get channel details with unread count
 * PUT - Update read receipt / mark as read
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

interface ChannelInfo {
  id: string;
  name: string;
  description: string | null;
  type: string;
  canRead: boolean;
  canWrite: boolean;
  unreadCount: number;
  lastMessage: {
    content: string;
    senderName: string | null;
    createdAt: string;
  } | null;
  participantCount: number;
}

interface ChannelsResponse {
  channels: ChannelInfo[];
  eventId: string;
  eventName: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);

    switch (req.method) {
      case "GET": {
        const eventId = url.searchParams.get("eventId");
        const channelId = url.searchParams.get("channelId");

        if (!eventId) {
          return new Response(
            JSON.stringify({ error: "eventId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get event info
        const { data: event } = await supabase
          .from("events")
          .select("id, name")
          .eq("id", eventId)
          .single();

        if (!event) {
          return new Response(
            JSON.stringify({ error: "Event not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get user's participant channels
        const { data: participantChannels } = await supabase
          .from("participant_channels")
          .select(`
            channel_id,
            permissions,
            workspace_channels!inner (
              id,
              name,
              description,
              type,
              participant_permissions
            )
          `)
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (!participantChannels || participantChannels.length === 0) {
          return new Response(
            JSON.stringify({ 
              channels: [], 
              eventId, 
              eventName: event.name 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If requesting specific channel details
        if (channelId) {
          const channel = participantChannels.find(pc => pc.channel_id === channelId);
          if (!channel) {
            return new Response(
              JSON.stringify({ error: "Channel not found or access denied" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Get last read timestamp from channel_members
          const { data: membership } = await supabase
            .from("channel_members")
            .select("last_read_at")
            .eq("channel_id", channelId)
            .eq("user_id", user.id)
            .single();

          // Count unread messages
          let unreadCount = 0;
          if (membership?.last_read_at) {
            const { count } = await supabase
              .from("channel_messages")
              .select("*", { count: "exact", head: true })
              .eq("channel_id", channelId)
              .gt("created_at", membership.last_read_at)
              .neq("sender_id", user.id);
            unreadCount = count || 0;
          }

          // Get last message
          const { data: lastMessages } = await supabase
            .from("channel_messages")
            .select("content, sender_name, created_at")
            .eq("channel_id", channelId)
            .order("created_at", { ascending: false })
            .limit(1);

          // Get participant count
          const { count: participantCount } = await supabase
            .from("participant_channels")
            .select("*", { count: "exact", head: true })
            .eq("channel_id", channelId)
            .eq("is_active", true);

          // deno-lint-ignore no-explicit-any
          const wsChannel = (channel.workspace_channels as any);
          const permissions = channel.permissions as { can_read?: boolean; can_write?: boolean } | null;

          const channelInfo: ChannelInfo = {
            id: wsChannel.id as string,
            name: wsChannel.name as string,
            description: wsChannel.description as string | null,
            type: wsChannel.type as string,
            canRead: permissions?.can_read ?? true,
            canWrite: permissions?.can_write ?? (wsChannel.participant_permissions?.can_write ?? true),
            unreadCount,
            lastMessage: lastMessages?.[0] ? {
              content: lastMessages[0].content,
              senderName: lastMessages[0].sender_name,
              createdAt: lastMessages[0].created_at,
            } : null,
            participantCount: participantCount || 0,
          };

          return new Response(
            JSON.stringify({ channel: channelInfo, eventId, eventName: event.name }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get all channels with metadata
        const channelIds = participantChannels.map(pc => pc.channel_id);

        // Get last messages for all channels
        const { data: lastMessages } = await supabase
          .from("channel_messages")
          .select("channel_id, content, sender_name, created_at")
          .in("channel_id", channelIds)
          .order("created_at", { ascending: false });

        // Group by channel, take first (most recent)
        const lastMessageMap = new Map<string, { content: string; sender_name: string | null; created_at: string }>();
        lastMessages?.forEach(msg => {
          if (!lastMessageMap.has(msg.channel_id)) {
            lastMessageMap.set(msg.channel_id, msg);
          }
        });

        // Get participant counts
        const { data: countData } = await supabase
          .from("participant_channels")
          .select("channel_id")
          .in("channel_id", channelIds)
          .eq("is_active", true);

        const countMap = new Map<string, number>();
        countData?.forEach(pc => {
          countMap.set(pc.channel_id, (countMap.get(pc.channel_id) || 0) + 1);
        });

        // Build response
        const channels: ChannelInfo[] = participantChannels.map(pc => {
          // deno-lint-ignore no-explicit-any
          const wsChannel = (pc.workspace_channels as any);
          const permissions = pc.permissions as { can_read?: boolean; can_write?: boolean } | null;
          const lastMsg = lastMessageMap.get(pc.channel_id);

          return {
            id: wsChannel.id as string,
            name: wsChannel.name as string,
            description: wsChannel.description as string | null,
            type: wsChannel.type as string,
            canRead: permissions?.can_read ?? true,
            canWrite: permissions?.can_write ?? (wsChannel.participant_permissions?.can_write ?? true),
            unreadCount: 0, // Would need individual calculation - simplified for list view
            lastMessage: lastMsg ? {
              content: lastMsg.content,
              senderName: lastMsg.sender_name,
              createdAt: lastMsg.created_at,
            } : null,
            participantCount: countMap.get(pc.channel_id) || 0,
          };
        });

        const response: ChannelsResponse = {
          channels,
          eventId,
          eventName: event.name,
        };

        return new Response(
          JSON.stringify(response),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "PUT": {
        // Update read receipt
        const body = await req.json();
        const { channelId } = body;

        if (!channelId) {
          return new Response(
            JSON.stringify({ error: "channelId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update last_read_at in channel_members
        const { error: updateError } = await supabase
          .from("channel_members")
          .update({ last_read_at: new Date().toISOString() })
          .eq("channel_id", channelId)
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({ success: true, markedAsRead: channelId }),
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
    console.error("Participant channels API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
