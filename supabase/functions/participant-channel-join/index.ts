/**
 * Participant Channel Join Edge Function
 * Handles manual participant channel management and bulk operations
 * 
 * Endpoints:
 * POST /join - Add participant(s) to channel(s)
 * POST /leave - Remove participant(s) from channel(s)
 * POST /sync - Sync all confirmed registrations to auto-join channels
 * GET /channels - List participant-accessible channels for an event
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

interface JoinRequest {
  action: "join" | "leave" | "sync" | "channels";
  eventId: string;
  channelId?: string;
  channelIds?: string[];
  userId?: string;
  userIds?: string[];
  registrationId?: string;
}

interface ParticipantChannel {
  id: string;
  name: string;
  description: string | null;
  type: string;
  canWrite: boolean;
  unreadCount: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get authorization header for user context
    const authHeader = req.headers.get("Authorization");
    let currentUserId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      currentUserId = user?.id || null;
    }

    const body: JoinRequest = await req.json();
    const { action, eventId, channelId, channelIds, userId, userIds, registrationId } = body;

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: "eventId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the ROOT workspace for this event
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("event_id", eventId)
      .eq("workspace_type", "ROOT")
      .single();

    if (wsError || !workspace) {
      return new Response(
        JSON.stringify({ error: "No ROOT workspace found for this event" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "channels": {
        // List participant-accessible channels for the current user
        if (!currentUserId) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: channels, error: chError } = await supabase
          .from("workspace_channels")
          .select(`
            id,
            name,
            description,
            type,
            participant_permissions,
            is_participant_channel
          `)
          .eq("workspace_id", workspace.id)
          .eq("is_participant_channel", true);

        if (chError) {
          throw chError;
        }

        // Get user's channel memberships to check permissions
        const { data: memberships } = await supabase
          .from("participant_channels")
          .select("channel_id, permissions")
          .eq("user_id", currentUserId)
          .eq("event_id", eventId)
          .eq("is_active", true);

        const membershipMap = new Map(
          memberships?.map(m => [m.channel_id, m.permissions]) || []
        );

        const participantChannels: ParticipantChannel[] = (channels || [])
          .filter(ch => membershipMap.has(ch.id))
          .map(ch => ({
            id: ch.id,
            name: ch.name,
            description: ch.description,
            type: ch.type,
            canWrite: (ch.participant_permissions as { can_write?: boolean })?.can_write ?? true,
            unreadCount: 0, // TODO: Implement unread count
          }));

        return new Response(
          JSON.stringify({ channels: participantChannels, eventId }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "join": {
        // Add participant(s) to channel(s)
        const targetChannelIds = channelIds || (channelId ? [channelId] : []);
        const targetUserIds = userIds || (userId ? [userId] : []);

        if (targetChannelIds.length === 0 || targetUserIds.length === 0) {
          return new Response(
            JSON.stringify({ error: "channelId(s) and userId(s) are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get channel permissions
        const { data: channelsData } = await supabase
          .from("workspace_channels")
          .select("id, participant_permissions")
          .in("id", targetChannelIds);

        const channelPermissions = new Map(
          channelsData?.map(c => [c.id, c.participant_permissions]) || []
        );

        // Get registrations for the users
        const { data: registrations } = await supabase
          .from("registrations")
          .select("id, user_id")
          .eq("event_id", eventId)
          .in("user_id", targetUserIds)
          .eq("status", "CONFIRMED");

        const regMap = new Map(registrations?.map(r => [r.user_id, r.id]) || []);

        // Get user names
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, full_name")
          .in("id", targetUserIds);

        const nameMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

        let joinedCount = 0;

        for (const chId of targetChannelIds) {
          for (const uId of targetUserIds) {
            const regId = regMap.get(uId);
            if (!regId) continue; // Skip if no confirmed registration

            // Add to channel_members
            await supabase
              .from("channel_members")
              .upsert({
                channel_id: chId,
                user_id: uId,
                user_name: nameMap.get(uId) || null,
              }, { onConflict: "channel_id,user_id" });

            // Add to participant_channels
            await supabase
              .from("participant_channels")
              .upsert({
                registration_id: regId,
                channel_id: chId,
                user_id: uId,
                event_id: eventId,
                permissions: channelPermissions.get(chId) || { can_read: true, can_write: true },
                is_active: true,
                left_at: null,
              }, { onConflict: "registration_id,channel_id" });

            joinedCount++;
          }
        }

        return new Response(
          JSON.stringify({ success: true, joined: joinedCount }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "leave": {
        // Remove participant(s) from channel(s)
        const targetChannelIds = channelIds || (channelId ? [channelId] : []);
        const targetUserIds = userIds || (userId ? [userId] : []);

        if (targetChannelIds.length === 0 || targetUserIds.length === 0) {
          return new Response(
            JSON.stringify({ error: "channelId(s) and userId(s) are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Deactivate participant_channels records
        const { data: updated } = await supabase
          .from("participant_channels")
          .update({ is_active: false, left_at: new Date().toISOString() })
          .in("channel_id", targetChannelIds)
          .in("user_id", targetUserIds)
          .eq("event_id", eventId)
          .select("id");

        return new Response(
          JSON.stringify({ success: true, removed: updated?.length || 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "sync": {
        // Sync all confirmed registrations to auto-join channels
        // Get all auto-join channels for the workspace
        const { data: autoJoinChannels } = await supabase
          .from("workspace_channels")
          .select("id, participant_permissions")
          .eq("workspace_id", workspace.id)
          .eq("is_participant_channel", true)
          .eq("auto_join_on_registration", true);

        if (!autoJoinChannels || autoJoinChannels.length === 0) {
          return new Response(
            JSON.stringify({ success: true, synced: 0, message: "No auto-join channels found" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get all confirmed registrations
        const { data: registrations } = await supabase
          .from("registrations")
          .select("id, user_id")
          .eq("event_id", eventId)
          .eq("status", "CONFIRMED");

        if (!registrations || registrations.length === 0) {
          return new Response(
            JSON.stringify({ success: true, synced: 0, message: "No confirmed registrations found" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get user names
        const userIds = registrations.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, full_name")
          .in("id", userIds);

        const nameMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

        let syncedCount = 0;

        for (const channel of autoJoinChannels) {
          for (const reg of registrations) {
            // Add to channel_members
            await supabase
              .from("channel_members")
              .upsert({
                channel_id: channel.id,
                user_id: reg.user_id,
                user_name: nameMap.get(reg.user_id) || null,
              }, { onConflict: "channel_id,user_id" });

            // Add to participant_channels
            await supabase
              .from("participant_channels")
              .upsert({
                registration_id: reg.id,
                channel_id: channel.id,
                user_id: reg.user_id,
                event_id: eventId,
                permissions: channel.participant_permissions || { can_read: true, can_write: true },
                is_active: true,
              }, { onConflict: "registration_id,channel_id" });

            syncedCount++;
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            synced: syncedCount,
            channels: autoJoinChannels.length,
            registrations: registrations.length
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Participant channel join error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
