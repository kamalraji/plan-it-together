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

interface PushNotificationRequest {
  user_ids: string[];
  title: string;
  body: string;
  data?: {
    type?: 'message' | 'mention' | 'reaction' | 'group_invite' | 'call' | 'system';
    channel_id?: string;
    message_id?: string;
    sender_id?: string;
    sender_name?: string;
    sender_avatar?: string;
    action_url?: string;
    [key: string]: unknown;
  };
  notification_type?: 'new_message' | 'mention' | 'reaction' | 'group_invite';
  priority?: 'high' | 'normal';
  collapse_key?: string;
  ttl?: number;
}

function validateRequest(body: unknown): { valid: true; data: PushNotificationRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const b = body as Record<string, unknown>;

  // Validate user_ids
  if (!b.user_ids || !Array.isArray(b.user_ids) || b.user_ids.length === 0) {
    return { valid: false, error: 'user_ids is required and must be a non-empty array' };
  }

  if (b.user_ids.length > 1000) {
    return { valid: false, error: 'user_ids cannot exceed 1000 recipients' };
  }

  for (const id of b.user_ids) {
    if (!validateUUID(id)) {
      return { valid: false, error: 'All user_ids must be valid UUIDs' };
    }
  }

  // Validate title and body
  if (!b.title || typeof b.title !== 'string') {
    return { valid: false, error: 'title is required' };
  }

  if (!b.body || typeof b.body !== 'string') {
    return { valid: false, error: 'body is required' };
  }

  // Validate priority
  if (b.priority !== undefined && b.priority !== 'high' && b.priority !== 'normal') {
    return { valid: false, error: 'priority must be "high" or "normal"' };
  }

  // Validate ttl
  if (b.ttl !== undefined && (typeof b.ttl !== 'number' || b.ttl < 0 || b.ttl > 2419200)) {
    return { valid: false, error: 'ttl must be between 0 and 2419200 seconds (28 days)' };
  }

  return {
    valid: true,
    data: {
      user_ids: b.user_ids as string[],
      title: sanitizeString(b.title, 100),
      body: sanitizeString(b.body, 500),
      data: b.data as PushNotificationRequest['data'],
      notification_type: b.notification_type as PushNotificationRequest['notification_type'],
      priority: (b.priority as 'high' | 'normal') || 'high',
      collapse_key: sanitizeString(b.collapse_key, 100),
      ttl: b.ttl as number | undefined,
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function is typically called server-to-server with service role key
    // Validate that the caller is authorized
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Check if it's a service role call (internal)
    const isServiceCall = authHeader?.includes(serviceRoleKey || '');
    
    if (!isServiceCall) {
      // For non-service calls, require user authentication
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
      
      if (supabaseUrl && supabaseAnonKey && authHeader?.startsWith('Bearer ')) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          logSecurityEvent('push_notification_auth_failed', null, { reason: error?.message });
          return errorResponse('Unauthorized', 401, corsHeaders);
        }
        
        // Rate limit individual user calls
        const rateCheck = checkRateLimit(data.user.id, 'push_notification', { maxRequests: 50, windowMs: 60000 });
        if (!rateCheck.allowed) {
          return errorResponse('Rate limit exceeded', 429, corsHeaders);
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

    const { user_ids, title, body: notificationBody, data, priority, collapse_key, ttl } = validation.data;

    // ============= BUSINESS LOGIC =============
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const FCM_PROJECT_ID = Deno.env.get('FCM_PROJECT_ID');
    const FCM_PRIVATE_KEY = Deno.env.get('FCM_PRIVATE_KEY');
    const FCM_CLIENT_EMAIL = Deno.env.get('FCM_CLIENT_EMAIL');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch FCM tokens for all target users
    const { data: tokens, error: tokensError } = await supabase
      .from('fcm_tokens')
      .select('token, user_id, device_type')
      .in('user_id', user_ids);

    if (tokensError) {
      console.error('Failed to fetch tokens:', tokensError);
      return errorResponse('Failed to fetch FCM tokens', 500, corsHeaders);
    }

    if (!tokens || tokens.length === 0) {
      return successResponse({ 
        success: true, 
        message: 'No FCM tokens found for specified users',
        sent: 0,
        failed: 0 
      }, corsHeaders);
    }

    const hasFCMCredentials = FCM_PROJECT_ID && FCM_PRIVATE_KEY && FCM_CLIENT_EMAIL;
    
    let sentCount = 0;
    let failedCount = 0;

    if (hasFCMCredentials) {
      const accessToken = await getAccessToken(FCM_CLIENT_EMAIL!, FCM_PRIVATE_KEY!);
      
      for (const tokenData of tokens) {
        try {
          const fcmMessage = {
            message: {
              token: tokenData.token,
              notification: { title, body: notificationBody },
              data: data ? Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
              ) : undefined,
              android: {
                priority: priority === 'high' ? 'high' : 'normal',
                notification: {
                  channel_id: data?.type === 'message' ? 'messages' : 'default',
                  icon: 'ic_notification',
                  color: '#6366f1',
                  sound: 'default',
                },
                collapse_key: collapse_key,
                ttl: ttl ? `${ttl}s` : undefined,
              },
              apns: {
                payload: {
                  aps: {
                    alert: { title, body: notificationBody },
                    badge: 1,
                    sound: 'default',
                    'thread-id': data?.channel_id || 'default',
                    'mutable-content': 1,
                  },
                },
                headers: {
                  'apns-priority': priority === 'high' ? '10' : '5',
                  'apns-collapse-id': collapse_key,
                },
              },
              webpush: {
                notification: {
                  title,
                  body: notificationBody,
                  icon: '/icons/icon-192.png',
                  badge: '/icons/badge-72.png',
                },
                fcm_options: {
                  link: data?.action_url as string || '/',
                },
              },
            },
          };

          const response = await fetch(
            `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(fcmMessage),
            }
          );

          if (response.ok) {
            sentCount++;
            await supabase
              .from('fcm_tokens')
              .update({ last_used_at: new Date().toISOString() })
              .eq('token', tokenData.token);
          } else {
            const errorData = await response.json();
            console.error('FCM send failed:', errorData);
            failedCount++;
            
            if (errorData?.error?.code === 404 || 
                errorData?.error?.details?.[0]?.errorCode === 'UNREGISTERED') {
              await supabase
                .from('fcm_tokens')
                .delete()
                .eq('token', tokenData.token);
            }
          }
        } catch (sendError) {
          console.error('Failed to send to token:', sendError);
          failedCount++;
        }
      }
    } else {
      console.log('[DEV MODE] Would send push notification:');
      console.log('  Title:', title);
      console.log('  Body:', notificationBody);
      console.log('  To tokens:', tokens.map(t => t.token.substring(0, 20) + '...'));
      sentCount = tokens.length;
    }

    // Create in-app notifications
    const notifications = user_ids.map(userId => ({
      user_id: userId,
      type: data?.type?.toUpperCase() || 'SYSTEM',
      title,
      message: notificationBody,
      avatar_url: data?.sender_avatar,
      action_url: data?.action_url || (data?.channel_id ? `/chat/${data.channel_id}` : null),
      group_key: data?.channel_id ? `chat_${data.channel_id}` : null,
      read: false,
      created_at: new Date().toISOString(),
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.warn('Failed to create in-app notifications:', notifError);
    }

    return successResponse({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total_tokens: tokens.length,
      in_app_created: !notifError,
      dev_mode: !hasFCMCredentials,
    }, corsHeaders);

  } catch (error) {
    console.error('Push notification error:', error);
    return errorResponse('Internal server error', 500, corsHeaders);
  }
});

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signatureInput)
  );
  
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
