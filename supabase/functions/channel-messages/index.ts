/**
 * Channel Messages Edge Function
 * Message operations for workspace communication channels
 * 
 * Endpoints:
 * - GET: List messages in a channel (with pagination)
 * - POST: Send a new message
 * - PUT: Edit a message
 * - DELETE: Delete a message
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface MessageRequest {
  channelId: string;
  messageId?: string;
  content?: string;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size?: number;
  }>;
  replyToId?: string;
}

async function getUserFromAuth(req: Request): Promise<{ id: string; name: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Get user profile for name
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  
  return { id: user.id, name: profile?.full_name || user.email || "Unknown" };
}

// deno-lint-ignore no-explicit-any
async function verifyChannelMember(
  supabase: any,
  userId: string,
  channelId: string
): Promise<boolean> {
  // Check if channel is private
  const { data: channel } = await supabase
    .from("workspace_channels")
    .select("id, is_private, workspace_id")
    .eq("id", channelId)
    .single();

  if (!channel) return false;

  // If not private, check workspace membership
  if (!channel.is_private) {
    const workspaceId = channel.workspace_id as string;
    const { data: teamMember } = await supabase
      .from("workspace_team_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("status", "ACTIVE")
      .maybeSingle();

    return !!teamMember;
  }

  // For private channels, check channel_members
  const { data: channelMember } = await supabase
    .from("channel_members")
    .select("id")
    .eq("channel_id", channelId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!channelMember;
}

function parseMentions(content: string): string[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[2]); // The user ID in parentheses
  }
  return mentions;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const user = await getUserFromAuth(req);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);

    switch (req.method) {
      case "GET": {
        const channelId = url.searchParams.get("channelId");
        const cursor = url.searchParams.get("cursor");
        const limit = parseInt(url.searchParams.get("limit") || "50");

        if (!channelId) {
          return new Response(
            JSON.stringify({ error: "channelId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify access
        const hasAccess = await verifyChannelMember(supabase, user.id, channelId);
        if (!hasAccess) {
          return new Response(
            JSON.stringify({ error: "Access denied to channel" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Fetch messages with pagination
        let query = supabase
          .from("channel_messages")
          .select(`
            id,
            content,
            sender_id,
            sender_name,
            attachments,
            message_type,
            is_edited,
            created_at,
            edited_at
          `)
          .eq("channel_id", channelId)
          .order("created_at", { ascending: false })
          .limit(limit + 1); // Fetch one extra to check if there are more

        if (cursor) {
          query = query.lt("created_at", cursor);
        }

        const { data: messages, error } = await query;

        if (error) {
          console.error("Error fetching messages:", error);
          return new Response(
            JSON.stringify({ error: "Failed to fetch messages" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const hasMore = messages && messages.length > limit;
        const resultMessages = hasMore ? messages.slice(0, limit) : messages || [];
        const nextCursor = hasMore && resultMessages.length > 0 
          ? resultMessages[resultMessages.length - 1].created_at 
          : null;

        // Update last read timestamp
        await supabase
          .from("channel_members")
          .upsert({
            channel_id: channelId,
            user_id: user.id,
            last_read_at: new Date().toISOString(),
          }, {
            onConflict: "channel_id,user_id",
          });

        return new Response(
          JSON.stringify({
            messages: resultMessages.reverse(), // Return in chronological order
            hasMore,
            nextCursor,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "POST": {
        const body: MessageRequest = await req.json();
        const { channelId, content, attachments, replyToId } = body;

        if (!channelId || !content?.trim()) {
          return new Response(
            JSON.stringify({ error: "channelId and content are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify access
        const hasAccess = await verifyChannelMember(supabase, user.id, channelId);
        if (!hasAccess) {
          return new Response(
            JSON.stringify({ error: "Access denied to channel" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create message
        const messageData = {
          channel_id: channelId,
          content: content.trim(),
          sender_id: user.id,
          sender_name: user.name,
          attachments: attachments ? JSON.stringify(attachments) : null,
          message_type: replyToId ? "reply" : "text",
        };

        const { data: message, error: createError } = await supabase
          .from("channel_messages")
          .insert(messageData)
          .select()
          .single();

        if (createError) {
          console.error("Error creating message:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to send message" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Parse and create notifications for mentions
        const mentions = parseMentions(content);
        if (mentions.length > 0) {
          // Get channel info for notification
          const { data: channel } = await supabase
            .from("workspace_channels")
            .select("name, workspace_id")
            .eq("id", channelId)
            .single();

          const notifications = mentions.map(mentionedUserId => ({
            user_id: mentionedUserId,
            type: "mention",
            title: `${user.name} mentioned you`,
            message: `in #${channel?.name || "channel"}: ${content.substring(0, 100)}${content.length > 100 ? "..." : ""}`,
            link: `/workspace/${channel?.workspace_id}?channel=${channelId}`,
            metadata: {
              channelId,
              messageId: message.id,
              mentionedBy: user.id,
            },
          }));

          await supabase.from("notifications").insert(notifications);
        }

        // Update channel's last activity
        await supabase
          .from("workspace_channels")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", channelId);

        return new Response(
          JSON.stringify({ message }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "PUT": {
        const body: MessageRequest = await req.json();
        const { messageId, content } = body;

        if (!messageId || !content?.trim()) {
          return new Response(
            JSON.stringify({ error: "messageId and content are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify message ownership
        const { data: existingMessage } = await supabase
          .from("channel_messages")
          .select("id, sender_id")
          .eq("id", messageId)
          .single();

        if (!existingMessage) {
          return new Response(
            JSON.stringify({ error: "Message not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (existingMessage.sender_id !== user.id) {
          return new Response(
            JSON.stringify({ error: "Can only edit your own messages" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: updated, error: updateError } = await supabase
          .from("channel_messages")
          .update({
            content: content.trim(),
            is_edited: true,
            edited_at: new Date().toISOString(),
          })
          .eq("id", messageId)
          .select()
          .single();

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to update message" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ message: updated }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "DELETE": {
        const messageId = url.searchParams.get("messageId");

        if (!messageId) {
          return new Response(
            JSON.stringify({ error: "messageId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify message ownership or admin status
        const { data: existingMessage } = await supabase
          .from("channel_messages")
          .select("id, sender_id, channel_id")
          .eq("id", messageId)
          .single();

        if (!existingMessage) {
          return new Response(
            JSON.stringify({ error: "Message not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if user is sender or has admin rights
        if (existingMessage.sender_id !== user.id) {
          // Check if user is workspace admin
          const { data: channel } = await supabase
            .from("workspace_channels")
            .select("workspace_id")
            .eq("id", existingMessage.channel_id)
            .single();

          if (channel) {
            const { data: membership } = await supabase
              .from("workspace_team_members")
              .select("role")
              .eq("workspace_id", channel.workspace_id)
              .eq("user_id", user.id)
              .maybeSingle();

            if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
              return new Response(
                JSON.stringify({ error: "Insufficient permissions to delete message" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        }

        const { error: deleteError } = await supabase
          .from("channel_messages")
          .delete()
          .eq("id", messageId);

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: "Failed to delete message" }),
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
    console.error("Channel messages error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
