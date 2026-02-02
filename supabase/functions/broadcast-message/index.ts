import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  validateUUID,
  sanitizeString,
  errorResponse,
  successResponse,
} from "../_shared/security.ts";

interface BroadcastRequest {
  eventId?: string;
  workspaceId?: string;
  channelIds?: string[];
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  sendPush: boolean;
  scheduleFor?: string;
  targetAudience?: {
    registrationStatus?: ('CONFIRMED' | 'WAITLISTED' | 'PENDING')[];
    ticketTypes?: string[];
    sessionIds?: string[];
  };
}

function validateRequest(body: unknown): { valid: true; data: BroadcastRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const b = body as Record<string, unknown>;

  if (!b.eventId && !b.workspaceId) {
    return { valid: false, error: 'Either eventId or workspaceId is required' };
  }

  if (b.eventId && !validateUUID(b.eventId as string)) {
    return { valid: false, error: 'Invalid eventId format' };
  }

  if (b.workspaceId && !validateUUID(b.workspaceId as string)) {
    return { valid: false, error: 'Invalid workspaceId format' };
  }

  if (!b.content || typeof b.content !== 'string' || b.content.trim().length === 0) {
    return { valid: false, error: 'content is required' };
  }

  if (b.channelIds && Array.isArray(b.channelIds)) {
    for (const id of b.channelIds) {
      if (!validateUUID(id)) {
        return { valid: false, error: 'All channelIds must be valid UUIDs' };
      }
    }
  }

  const priority = b.priority as string || 'normal';
  if (!['normal', 'important', 'urgent'].includes(priority)) {
    return { valid: false, error: 'priority must be normal, important, or urgent' };
  }

  return {
    valid: true,
    data: {
      eventId: b.eventId as string | undefined,
      workspaceId: b.workspaceId as string | undefined,
      channelIds: b.channelIds as string[] | undefined,
      content: sanitizeString(b.content as string, 4000),
      priority: priority as 'normal' | 'important' | 'urgent',
      sendPush: b.sendPush === true,
      scheduleFor: b.scheduleFor as string | undefined,
      targetAudience: b.targetAudience as BroadcastRequest['targetAudience'],
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401, corsHeaders);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: authError } = await userClient.auth.getUser();
    if (authError || !userData.user) {
      return errorResponse('Unauthorized', 401, corsHeaders);
    }

    const userId = userData.user.id;

    // Validate request
    const body = await req.json();
    const validation = validateRequest(body);
    if (!validation.valid) {
      return errorResponse(validation.error, 400, corsHeaders);
    }

    const { eventId, workspaceId, channelIds, content, priority, sendPush, scheduleFor, targetAudience } = validation.data;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get workspace ID if only event ID provided
    let targetWorkspaceId = workspaceId;
    if (!targetWorkspaceId && eventId) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('event_id', eventId)
        .eq('workspace_type', 'ROOT')
        .single();

      if (!workspace) {
        return errorResponse('No workspace found for this event', 404, corsHeaders);
      }
      targetWorkspaceId = workspace.id;
    }

    // Verify user has permission to broadcast in this workspace
    const { data: membership } = await supabase
      .from('workspace_team_members')
      .select('role')
      .eq('workspace_id', targetWorkspaceId)
      .eq('user_id', userId)
      .single();

    const allowedRoles = [
      'WORKSPACE_OWNER', 'OPERATIONS_MANAGER', 'COMMUNICATIONS_LEAD',
      'ADMIN', 'MODERATOR', 'COMMITTEE_CHAIR', 'EVENT_COORDINATOR'
    ];

    if (!membership || !allowedRoles.includes(membership.role)) {
      return errorResponse('You do not have permission to broadcast in this workspace', 403, corsHeaders);
    }

    // Get target channels
    let targetChannelIds = channelIds || [];
    if (targetChannelIds.length === 0) {
      // Get all participant channels with announcement type or all if none
      const { data: channels } = await supabase
        .from('workspace_channels')
        .select('id')
        .eq('workspace_id', targetWorkspaceId)
        .eq('is_participant_channel', true);

      targetChannelIds = channels?.map(c => c.id) || [];
    }

    if (targetChannelIds.length === 0) {
      return errorResponse('No target channels found', 400, corsHeaders);
    }

    // If scheduled, save to workspace_broadcasts and exit
    if (scheduleFor) {
      const scheduledDate = new Date(scheduleFor);
      if (scheduledDate <= new Date()) {
        return errorResponse('Scheduled time must be in the future', 400, corsHeaders);
      }

      const { data: broadcast, error: broadcastError } = await supabase
        .from('workspace_broadcasts')
        .insert({
          workspace_id: targetWorkspaceId,
          sender_id: userId,
          content,
          priority,
          channel_ids: targetChannelIds,
          send_push: sendPush,
          scheduled_for: scheduleFor,
        })
        .select()
        .single();

      if (broadcastError) {
        console.error('Failed to schedule broadcast:', broadcastError);
        return errorResponse('Failed to schedule broadcast', 500, corsHeaders);
      }

      return successResponse({
        success: true,
        scheduled: true,
        broadcastId: broadcast.id,
        scheduledFor: scheduleFor,
        channelCount: targetChannelIds.length,
      }, corsHeaders);
    }

    // Get user profile for sender info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .single();

    const senderName = profile?.display_name || userData.user.email?.split('@')[0] || 'Organizer';
    const senderAvatar = profile?.avatar_url;

    // Send message to each channel
    const messageResults: { channelId: string; success: boolean; messageId?: string }[] = [];

    for (const channelId of targetChannelIds) {
      try {
        const { data: message, error: msgError } = await supabase
          .from('channel_messages')
          .insert({
            channel_id: channelId,
            sender_id: userId,
            sender_name: senderName,
            content,
            message_type: priority === 'urgent' ? 'urgent' : priority === 'important' ? 'important' : 'broadcast',
            attachments: { priority, broadcast: true },
          })
          .select('id')
          .single();

        if (msgError) {
          console.error(`Failed to send to channel ${channelId}:`, msgError);
          messageResults.push({ channelId, success: false });
        } else {
          messageResults.push({ channelId, success: true, messageId: message.id });
        }
      } catch (error) {
        console.error(`Error sending to channel ${channelId}:`, error);
        messageResults.push({ channelId, success: false });
      }
    }

    // Get participant user IDs for push notifications
    let pushUserIds: string[] = [];

    if (sendPush) {
      // Build query for target participants
      let participantQuery = supabase
        .from('participant_channels')
        .select('user_id')
        .in('channel_id', targetChannelIds)
        .eq('is_active', true);

      // Apply audience filters if provided
      if (targetAudience?.registrationStatus && eventId) {
        const { data: registrations } = await supabase
          .from('registrations')
          .select('user_id')
          .eq('event_id', eventId)
          .in('status', targetAudience.registrationStatus);

        const registeredUserIds = registrations?.map(r => r.user_id) || [];
        participantQuery = participantQuery.in('user_id', registeredUserIds);
      }

      const { data: participants } = await participantQuery;
      pushUserIds = [...new Set(participants?.map(p => p.user_id) || [])];

      // Send push notifications
      if (pushUserIds.length > 0) {
        try {
          const pushResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_ids: pushUserIds,
              title: priority === 'urgent' ? '🚨 Urgent Announcement' : 
                     priority === 'important' ? '📢 Important Announcement' : 
                     '📣 Announcement',
              body: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
              data: {
                type: 'broadcast',
                priority,
                channel_id: targetChannelIds[0],
                sender_id: userId,
                sender_name: senderName,
                sender_avatar: senderAvatar,
              },
              priority: priority === 'urgent' ? 'high' : 'normal',
            }),
          });

          const pushResult = await pushResponse.json();
          console.log('Push notification result:', pushResult);
        } catch (pushError) {
          console.error('Failed to send push notifications:', pushError);
        }
      }
    }

    // Record broadcast for analytics
    const successfulChannels = messageResults.filter(r => r.success).length;
    const { error: recordError } = await supabase
      .from('workspace_broadcasts')
      .insert({
        workspace_id: targetWorkspaceId,
        sender_id: userId,
        content,
        priority,
        channel_ids: targetChannelIds,
        send_push: sendPush,
        sent_at: new Date().toISOString(),
        delivery_stats: {
          channels_targeted: targetChannelIds.length,
          channels_success: successfulChannels,
          push_recipients: pushUserIds.length,
        },
      });

    if (recordError) {
      console.warn('Failed to record broadcast:', recordError);
    }

    return successResponse({
      success: true,
      channelsTargeted: targetChannelIds.length,
      channelsSuccess: successfulChannels,
      pushRecipients: sendPush ? pushUserIds.length : 0,
      messageResults,
    }, corsHeaders);

  } catch (error) {
    console.error('Broadcast message error:', error);
    return errorResponse('Internal server error', 500, corsHeaders);
  }
});
