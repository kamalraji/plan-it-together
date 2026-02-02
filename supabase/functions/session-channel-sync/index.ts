import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  validateUUID,
  sanitizeString,
  errorResponse,
  successResponse,
} from "../_shared/security.ts";

interface SessionChannelRequest {
  action: 'create' | 'update' | 'delete' | 'sync-all';
  eventId: string;
  sessionId?: string;
  sessionTitle?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
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

    const body = await req.json();
    const { action, eventId, sessionId, sessionTitle } = body as SessionChannelRequest;

    if (!eventId || !validateUUID(eventId)) {
      return errorResponse('Valid eventId is required', 400, corsHeaders);
    }

    if (['create', 'update', 'delete'].includes(action) && !sessionId) {
      return errorResponse('sessionId is required for this action', 400, corsHeaders);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the ROOT workspace for this event
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('event_id', eventId)
      .eq('workspace_type', 'ROOT')
      .single();

    if (wsError || !workspace) {
      return errorResponse('No workspace found for this event', 404, corsHeaders);
    }

    // Get or create SESSIONS category
    let categoryId: string;
    const { data: existingCategory } = await supabase
      .from('workspace_channel_categories')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('name', 'SESSIONS')
      .single();

    if (existingCategory) {
      categoryId = existingCategory.id;
    } else {
      const { data: newCategory, error: catError } = await supabase
        .from('workspace_channel_categories')
        .insert({
          workspace_id: workspace.id,
          name: 'SESSIONS',
          sort_order: 20,
        })
        .select('id')
        .single();

      if (catError) {
        console.error('Failed to create category:', catError);
        return errorResponse('Failed to create channel category', 500, corsHeaders);
      }
      categoryId = newCategory.id;
    }

    switch (action) {
      case 'create': {
        if (!sessionTitle) {
          return errorResponse('sessionTitle is required for create action', 400, corsHeaders);
        }

        const channelName = `session-${slugify(sessionTitle)}`;
        
        // Check if channel already exists
        const { data: existing } = await supabase
          .from('workspace_channels')
          .select('id')
          .eq('workspace_id', workspace.id)
          .eq('name', channelName)
          .single();

        if (existing) {
          // Link existing channel to session
          await supabase
            .from('session_channels')
            .upsert({
              session_id: sessionId,
              channel_id: existing.id,
              auto_created: false,
            });

          return successResponse({
            success: true,
            action: 'linked',
            channelId: existing.id,
            channelName,
          }, corsHeaders);
        }

        // Create new channel
        const { data: channel, error: channelError } = await supabase
          .from('workspace_channels')
          .insert({
            workspace_id: workspace.id,
            name: channelName,
            description: `Discussion for session: ${sessionTitle}`,
            type: 'general',
            is_participant_channel: true,
            auto_join_on_registration: false, // Participants join manually
            participant_permissions: { can_read: true, can_write: true },
            category_id: categoryId,
            created_by: userData.user.id,
          })
          .select('id')
          .single();

        if (channelError) {
          console.error('Failed to create channel:', channelError);
          return errorResponse('Failed to create session channel', 500, corsHeaders);
        }

        // Link channel to session
        await supabase
          .from('session_channels')
          .insert({
            session_id: sessionId,
            channel_id: channel.id,
            auto_created: true,
          });

        return successResponse({
          success: true,
          action: 'created',
          channelId: channel.id,
          channelName,
        }, corsHeaders);
      }

      case 'update': {
        if (!sessionTitle) {
          return errorResponse('sessionTitle is required for update action', 400, corsHeaders);
        }

        // Get linked channel
        const { data: link } = await supabase
          .from('session_channels')
          .select('channel_id')
          .eq('session_id', sessionId)
          .single();

        if (!link) {
          return errorResponse('No channel linked to this session', 404, corsHeaders);
        }

        const newChannelName = `session-${slugify(sessionTitle)}`;

        // Update channel
        const { error: updateError } = await supabase
          .from('workspace_channels')
          .update({
            name: newChannelName,
            description: `Discussion for session: ${sessionTitle}`,
          })
          .eq('id', link.channel_id);

        if (updateError) {
          console.error('Failed to update channel:', updateError);
          return errorResponse('Failed to update session channel', 500, corsHeaders);
        }

        return successResponse({
          success: true,
          action: 'updated',
          channelId: link.channel_id,
          channelName: newChannelName,
        }, corsHeaders);
      }

      case 'delete': {
        // Get linked channel
        const { data: link } = await supabase
          .from('session_channels')
          .select('channel_id, auto_created')
          .eq('session_id', sessionId)
          .single();

        if (!link) {
          return successResponse({
            success: true,
            action: 'no-op',
            message: 'No channel was linked to this session',
          }, corsHeaders);
        }

        // Only delete if auto-created (don't delete manually linked channels)
        if (link.auto_created) {
          await supabase
            .from('workspace_channels')
            .delete()
            .eq('id', link.channel_id);
        }

        // Always remove the link
        await supabase
          .from('session_channels')
          .delete()
          .eq('session_id', sessionId);

        return successResponse({
          success: true,
          action: link.auto_created ? 'deleted' : 'unlinked',
          channelId: link.channel_id,
        }, corsHeaders);
      }

      case 'sync-all': {
        // Get all published sessions for this event
        const { data: sessions, error: sessError } = await supabase
          .from('event_sessions')
          .select('id, title, status')
          .eq('event_id', eventId)
          .eq('status', 'PUBLISHED');

        if (sessError) {
          console.error('Failed to fetch sessions:', sessError);
          return errorResponse('Failed to fetch sessions', 500, corsHeaders);
        }

        const results: { sessionId: string; channelId: string; action: string }[] = [];

        for (const session of sessions || []) {
          // Check if channel already exists for this session
          const { data: existingLink } = await supabase
            .from('session_channels')
            .select('channel_id')
            .eq('session_id', session.id)
            .single();

          if (existingLink) {
            results.push({
              sessionId: session.id,
              channelId: existingLink.channel_id,
              action: 'already-exists',
            });
            continue;
          }

          // Create channel
          const channelName = `session-${slugify(session.title)}`;

          // Check for name collision
          const { data: nameCollision } = await supabase
            .from('workspace_channels')
            .select('id')
            .eq('workspace_id', workspace.id)
            .eq('name', channelName)
            .single();

          if (nameCollision) {
            // Link existing channel
            await supabase
              .from('session_channels')
              .insert({
                session_id: session.id,
                channel_id: nameCollision.id,
                auto_created: false,
              });

            results.push({
              sessionId: session.id,
              channelId: nameCollision.id,
              action: 'linked',
            });
            continue;
          }

          // Create new channel
          const { data: newChannel, error: createError } = await supabase
            .from('workspace_channels')
            .insert({
              workspace_id: workspace.id,
              name: channelName,
              description: `Discussion for session: ${session.title}`,
              type: 'general',
              is_participant_channel: true,
              auto_join_on_registration: false,
              participant_permissions: { can_read: true, can_write: true },
              category_id: categoryId,
              created_by: userData.user.id,
            })
            .select('id')
            .single();

          if (createError) {
            console.error(`Failed to create channel for session ${session.id}:`, createError);
            continue;
          }

          // Link to session
          await supabase
            .from('session_channels')
            .insert({
              session_id: session.id,
              channel_id: newChannel.id,
              auto_created: true,
            });

          results.push({
            sessionId: session.id,
            channelId: newChannel.id,
            action: 'created',
          });
        }

        return successResponse({
          success: true,
          sessionsProcessed: sessions?.length || 0,
          results,
        }, corsHeaders);
      }

      default:
        return errorResponse('Invalid action', 400, corsHeaders);
    }

  } catch (error) {
    console.error('Session channel sync error:', error);
    return errorResponse('Internal server error', 500, corsHeaders);
  }
});
