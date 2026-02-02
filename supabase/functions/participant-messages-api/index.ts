/**
 * Participant Messages API - Mobile-friendly REST API
 * 
 * Endpoints:
 * GET  ?channelId=X&cursor=Y&limit=Z - List messages with pagination
 * POST - Send a message
 * PUT  - Edit a message
 * DELETE ?messageId=X - Delete a message
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

interface MessageResponse {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string | null;
  content: string;
  messageType: string;
  attachments: unknown[];
  isEdited: boolean;
  editedAt: string | null;
  createdAt: string;
}

interface PaginatedResponse {
  messages: MessageResponse[];
  nextCursor: string | null;
  hasMore: boolean;
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
        // List messages with cursor-based pagination
        const channelId = url.searchParams.get("channelId");
        const cursor = url.searchParams.get("cursor");
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

        if (!channelId) {
          return new Response(
            JSON.stringify({ error: "channelId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify user has access to this channel
        const { data: access } = await supabase
          .from("participant_channels")
          .select("id, permissions")
          .eq("channel_id", channelId)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();

        if (!access) {
          // Check if workspace team member
          const { data: wsAccess } = await supabase
            .from("channel_members")
            .select("id")
            .eq("channel_id", channelId)
            .eq("user_id", user.id)
            .single();

          if (!wsAccess) {
            return new Response(
              JSON.stringify({ error: "Access denied to this channel" }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Build query
        let query = supabase
          .from("channel_messages")
          .select("*")
          .eq("channel_id", channelId)
          .order("created_at", { ascending: false })
          .limit(limit + 1); // Fetch one extra to check hasMore

        if (cursor) {
          query = query.lt("created_at", cursor);
        }

        const { data: messages, error: msgError } = await query;

        if (msgError) throw msgError;

        const hasMore = messages && messages.length > limit;
        const resultMessages = messages?.slice(0, limit) || [];

        const response: PaginatedResponse = {
          messages: resultMessages.map(m => ({
            id: m.id,
            channelId: m.channel_id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            content: m.content,
            messageType: m.message_type || "text",
            attachments: (m.attachments as unknown[]) || [],
            isEdited: m.is_edited || false,
            editedAt: m.edited_at,
            createdAt: m.created_at,
          })),
          nextCursor: hasMore && resultMessages.length > 0 
            ? resultMessages[resultMessages.length - 1].created_at 
            : null,
          hasMore,
        };

        return new Response(
          JSON.stringify(response),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "POST": {
        // Send a message
        const body = await req.json();
        const { channelId, content, messageType = "text" } = body;

        if (!channelId || !content) {
          return new Response(
            JSON.stringify({ error: "channelId and content are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify write access
        const { data: access } = await supabase
          .from("participant_channels")
          .select("id, permissions")
          .eq("channel_id", channelId)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();

        const permissions = access?.permissions as { can_write?: boolean } | null;
        const isParticipant = !!access;
        const canWrite = permissions?.can_write ?? false;

        if (isParticipant && !canWrite) {
          return new Response(
            JSON.stringify({ error: "This channel is read-only for participants" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If not a participant, check if workspace team member
        if (!isParticipant) {
          const { data: wsAccess } = await supabase
            .from("channel_members")
            .select("id")
            .eq("channel_id", channelId)
            .eq("user_id", user.id)
            .single();

          if (!wsAccess) {
            return new Response(
              JSON.stringify({ error: "Access denied to this channel" }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        // Get sender name
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        // Insert message
        const { data: message, error: insertError } = await supabase
          .from("channel_messages")
          .insert({
            channel_id: channelId,
            sender_id: user.id,
            sender_name: profile?.full_name || null,
            content,
            message_type: messageType,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return new Response(
          JSON.stringify({
            id: message.id,
            channelId: message.channel_id,
            senderId: message.sender_id,
            senderName: message.sender_name,
            content: message.content,
            messageType: message.message_type,
            createdAt: message.created_at,
          }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "PUT": {
        // Edit a message
        const body = await req.json();
        const { messageId, content } = body;

        if (!messageId || !content) {
          return new Response(
            JSON.stringify({ error: "messageId and content are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify ownership
        const { data: existing } = await supabase
          .from("channel_messages")
          .select("id, sender_id")
          .eq("id", messageId)
          .single();

        if (!existing) {
          return new Response(
            JSON.stringify({ error: "Message not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (existing.sender_id !== user.id) {
          return new Response(
            JSON.stringify({ error: "You can only edit your own messages" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update message
        const { data: updated, error: updateError } = await supabase
          .from("channel_messages")
          .update({
            content,
            is_edited: true,
            edited_at: new Date().toISOString(),
          })
          .eq("id", messageId)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({
            id: updated.id,
            content: updated.content,
            isEdited: true,
            editedAt: updated.edited_at,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "DELETE": {
        // Delete a message
        const messageId = url.searchParams.get("messageId");

        if (!messageId) {
          return new Response(
            JSON.stringify({ error: "messageId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify ownership
        const { data: existing } = await supabase
          .from("channel_messages")
          .select("id, sender_id")
          .eq("id", messageId)
          .single();

        if (!existing) {
          return new Response(
            JSON.stringify({ error: "Message not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (existing.sender_id !== user.id) {
          return new Response(
            JSON.stringify({ error: "You can only delete your own messages" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete message
        const { error: deleteError } = await supabase
          .from("channel_messages")
          .delete()
          .eq("id", messageId);

        if (deleteError) throw deleteError;

        return new Response(
          JSON.stringify({ success: true, deleted: messageId }),
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
    console.error("Participant messages API error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
