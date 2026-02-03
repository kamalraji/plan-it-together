import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  checkRateLimit,
  validateUUID,
  sanitizeString,
  errorResponse,
  successResponse,
  logSecurityEvent,
} from "../_shared/security.ts";

interface ChatNotificationRequest {
  event_type: 'new_message' | 'mention' | 'reaction' | 'group_invite';
  channel_id: string;
  message_id?: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  message_preview?: string;
  mentioned_user_ids?: string[];
  reaction_emoji?: string;
  group_id?: string;
  group_name?: string;
}

const VALID_EVENT_TYPES = ['new_message', 'mention', 'reaction', 'group_invite'];

function validateRequest(body: unknown): { valid: true; data: ChatNotificationRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const b = body as Record<string, unknown>;

  if (!b.event_type || !VALID_EVENT_TYPES.includes(b.event_type as string)) {
    return { valid: false, error: `event_type must be one of: ${VALID_EVENT_TYPES.join(', ')}` };
  }

  if (!b.channel_id || !validateUUID(b.channel_id)) {
    return { valid: false, error: 'Valid channel_id (UUID) is required' };
  }

  if (!b.sender_id || !validateUUID(b.sender_id)) {
    return { valid: false, error: 'Valid sender_id (UUID) is required' };
  }

  if (!b.sender_name || typeof b.sender_name !== 'string') {
    return { valid: false, error: 'sender_name is required' };
  }

  // Validate mentioned_user_ids if provided
  if (b.mentioned_user_ids !== undefined) {
    if (!Array.isArray(b.mentioned_user_ids)) {
      return { valid: false, error: 'mentioned_user_ids must be an array' };
    }
    for (const id of b.mentioned_user_ids) {
      if (!validateUUID(id)) {
        return { valid: false, error: 'All mentioned_user_ids must be valid UUIDs' };
      }
    }
  }

  return {
    valid: true,
    data: {
      event_type: b.event_type as ChatNotificationRequest['event_type'],
      channel_id: b.channel_id as string,
      message_id: b.message_id && validateUUID(b.message_id) ? b.message_id as string : undefined,
      sender_id: b.sender_id as string,
      sender_name: sanitizeString(b.sender_name, 100),
      sender_avatar: sanitizeString(b.sender_avatar, 500),
      message_preview: sanitizeString(b.message_preview, 200),
      mentioned_user_ids: b.mentioned_user_ids as string[] | undefined,
      reaction_emoji: sanitizeString(b.reaction_emoji, 10),
      group_id: b.group_id && validateUUID(b.group_id) ? b.group_id as string : undefined,
      group_name: sanitizeString(b.group_name, 100),
    },
  };
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function isInQuietHours(currentTime: string, start: string, end: string): boolean {
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }
  return currentTime >= start && currentTime < end;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Note: This function is called server-to-server, so we validate via service role
    // The calling function should have already authenticated the user
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Only allow calls with service role key (internal calls)
    if (!authHeader?.includes(serviceRoleKey || '')) {
      // Still allow with valid user token for direct API calls
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
      
      if (supabaseUrl && supabaseAnonKey && authHeader?.startsWith('Bearer ')) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { error } = await supabase.auth.getUser();
        if (error) {
          logSecurityEvent('chat_notification_auth_failed', null, { reason: error.message });
          return errorResponse('Unauthorized', 401, corsHeaders);
        }
      } else {
        return errorResponse('Unauthorized', 401, corsHeaders);
      }
    }

    // ============= INPUT VALIDATION =============
    const body = await req.json();
    const validation = validateRequest(body);
    if (!validation.valid) {
      return errorResponse(validation.error, 400, corsHeaders);
    }

    const {
      event_type,
      channel_id,
      message_id,
      sender_id,
      sender_name,
      sender_avatar,
      message_preview,
      mentioned_user_ids,
      reaction_emoji,
      group_id,
      group_name,
    } = validation.data;

    // ============= RATE LIMITING =============
    const rateCheck = checkRateLimit(sender_id, 'chat_notification', { maxRequests: 100, windowMs: 60000 });
    if (!rateCheck.allowed) {
      logSecurityEvent('chat_notification_rate_limited', sender_id, {});
      return errorResponse('Rate limit exceeded', 429, corsHeaders);
    }

    // ============= BUSINESS LOGIC =============
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let targetUserIds: string[] = [];
    let title = '';
    let body_text = '';
    let notificationType = 'message';

    switch (event_type) {
      case 'new_message': {
        const { data: members } = await supabase
          .from('channel_members')
          .select('user_id, is_muted, muted_until')
          .eq('channel_id', channel_id)
          .neq('user_id', sender_id);

        if (members) {
          const now = new Date().toISOString();
          targetUserIds = members
            .filter(m => !m.is_muted && (!m.muted_until || m.muted_until < now))
            .map(m => m.user_id);
        }

        if (group_id && group_name) {
          title = group_name;
          body_text = `${sender_name}: ${truncate(message_preview || 'Sent a message', 50)}`;
        } else {
          title = sender_name;
          body_text = truncate(message_preview || 'Sent you a message', 80);
        }
        notificationType = 'message';
        break;
      }

      case 'mention': {
        if (mentioned_user_ids && mentioned_user_ids.length > 0) {
          targetUserIds = mentioned_user_ids.filter(id => id !== sender_id);
        }
        title = `${sender_name} mentioned you`;
        body_text = truncate(message_preview || 'in a message', 80);
        notificationType = 'mention';
        break;
      }

      case 'reaction': {
        if (message_id) {
          const { data: message } = await supabase
            .from('channel_messages')
            .select('sender_id')
            .eq('id', message_id)
            .single();

          if (message && message.sender_id !== sender_id) {
            targetUserIds = [message.sender_id];
          }
        }
        title = `${sender_name} reacted ${reaction_emoji || '❤️'}`;
        body_text = truncate(message_preview || 'to your message', 60);
        notificationType = 'reaction';
        break;
      }

      case 'group_invite': {
        if (mentioned_user_ids && mentioned_user_ids.length > 0) {
          targetUserIds = mentioned_user_ids;
        }
        title = 'Group Invitation';
        body_text = `${sender_name} invited you to join "${group_name || 'a group'}"`;
        notificationType = 'group_invite';
        break;
      }
    }

    if (targetUserIds.length === 0) {
      return successResponse({ success: true, message: 'No eligible recipients', sent: 0 }, corsHeaders);
    }

    // Check user notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('user_id, push_enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end')
      .in('user_id', targetUserIds);

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const eligibleUserIds = targetUserIds.filter(userId => {
      const pref = preferences?.find(p => p.user_id === userId);
      if (!pref) return true;
      if (pref.push_enabled === false) return false;
      if (pref.quiet_hours_enabled && pref.quiet_hours_start && pref.quiet_hours_end) {
        return !isInQuietHours(currentTime, pref.quiet_hours_start, pref.quiet_hours_end);
      }
      return true;
    });

    if (eligibleUserIds.length === 0) {
      return successResponse({ success: true, message: 'All users have notifications disabled', sent: 0 }, corsHeaders);
    }

    // Call the send-push-notification function
    const pushResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/send-push-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          user_ids: eligibleUserIds,
          title,
          body: body_text,
          data: {
            type: notificationType,
            channel_id,
            message_id,
            sender_id,
            sender_name,
            sender_avatar,
            action_url: `/chat/${channel_id}${message_id ? `#${message_id}` : ''}`,
          },
          priority: event_type === 'mention' ? 'high' : 'normal',
          collapse_key: `chat_${channel_id}`,
        }),
      }
    );

    const pushResult = await pushResponse.json();

    return successResponse({
      success: true,
      event_type,
      eligible_users: eligibleUserIds.length,
      ...pushResult,
    }, corsHeaders);

  } catch (error) {
    console.error('Chat notification error:', error);
    return errorResponse('Internal server error', 500, corsHeaders);
  }
});
