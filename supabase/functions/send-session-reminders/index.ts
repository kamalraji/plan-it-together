import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  initRequestContext,
  logInfo,
  logError,
  logWarning,
  logRequestComplete,
} from "../_shared/security.ts";

/**
 * Session Reminders Edge Function
 * 
 * Triggered by cron job every minute to send push notifications
 * for upcoming bookmarked sessions.
 * 
 * Flow:
 * 1. Query due reminders (sessions starting within reminder window)
 * 2. Check each user's notification preferences
 * 3. Send push notification via send-push-notification function
 * 4. Mark reminder as sent
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface DueReminder {
  bookmark_id: string;
  user_id: string;
  session_id: string;
  event_id: string;
  session_title: string;
  session_start_time: string;
  reminder_minutes_before: number;
  room: string | null;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = initRequestContext('send-session-reminders');

  try {
    // Verify this is called by cron (service role) or has valid auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.includes('Bearer')) {
      logWarning('Missing authorization header');
      logRequestComplete(401);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get due reminders
    const { data: dueReminders, error: remindersError } = await supabase
      .rpc('get_due_session_reminders');

    if (remindersError) {
      logError('Failed to get due reminders', remindersError);
      logRequestComplete(500);
      return new Response(
        JSON.stringify({ error: 'Failed to query reminders' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!dueReminders || dueReminders.length === 0) {
      logInfo('No due reminders found');
      logRequestComplete(200);
      return new Response(
        JSON.stringify({ processed: 0, sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logInfo(`Found ${dueReminders.length} due reminders`);

    let sentCount = 0;
    const failedReminders: string[] = [];

    for (const reminder of dueReminders as DueReminder[]) {
      try {
        // Check user's notification preferences
        const { data: prefs } = await supabase
          .from('zone_notification_preferences')
          .select('session_reminders_enabled')
          .eq('user_id', reminder.user_id)
          .eq('event_id', reminder.event_id)
          .maybeSingle();

        // Default to enabled if no preferences exist
        const isEnabled = prefs?.session_reminders_enabled ?? true;

        if (!isEnabled) {
          logInfo(`Skipping reminder for user ${reminder.user_id} - disabled`, {
            bookmarkId: reminder.bookmark_id,
          });
          // Still mark as sent to avoid re-processing
          await supabase
            .from('session_bookmarks')
            .update({ reminder_sent: true })
            .eq('id', reminder.bookmark_id);
          continue;
        }

        // Get user's FCM token
        const { data: tokenData } = await supabase
          .from('push_notification_tokens')
          .select('token')
          .eq('user_id', reminder.user_id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (!tokenData?.token) {
          logWarning(`No FCM token for user ${reminder.user_id}`, {
            bookmarkId: reminder.bookmark_id,
          });
          // Mark as sent to avoid re-processing
          await supabase
            .from('session_bookmarks')
            .update({ reminder_sent: true })
            .eq('id', reminder.bookmark_id);
          continue;
        }

        // Format the notification
        const startTime = new Date(reminder.session_start_time);
        const minutesUntil = Math.round((startTime.getTime() - Date.now()) / 60000);
        
        const title = '⏰ Session Starting Soon';
        const body = `${reminder.session_title} starts in ${minutesUntil} minutes${reminder.room ? ` (${reminder.room})` : ''}`;

        // Send push notification
        const notifyResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/send-push-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              token: tokenData.token,
              title,
              body,
              data: {
                type: 'session_reminder',
                session_id: reminder.session_id,
                event_id: reminder.event_id,
              },
            }),
          }
        );

        if (notifyResponse.ok) {
          // Mark reminder as sent
          await supabase
            .from('session_bookmarks')
            .update({ reminder_sent: true })
            .eq('id', reminder.bookmark_id);

          sentCount++;
          logInfo(`Sent reminder for session ${reminder.session_id}`, {
            userId: reminder.user_id,
            sessionTitle: reminder.session_title,
          });
        } else {
          const errorText = await notifyResponse.text();
          logWarning(`Failed to send notification`, {
            bookmarkId: reminder.bookmark_id,
            error: errorText,
          });
          failedReminders.push(reminder.bookmark_id);
        }
      } catch (innerError) {
        logError(`Error processing reminder ${reminder.bookmark_id}`, innerError);
        failedReminders.push(reminder.bookmark_id);
      }
    }

    logInfo(`Processed ${dueReminders.length} reminders, sent ${sentCount}`);
    logRequestComplete(200);

    return new Response(
      JSON.stringify({
        processed: dueReminders.length,
        sent: sentCount,
        failed: failedReminders.length,
        failedIds: failedReminders,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logError('Session reminders function error', error);
    logRequestComplete(500);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
