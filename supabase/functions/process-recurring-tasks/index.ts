import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecurrenceConfig {
  daily?: { interval: number };
  weekly?: { interval: number; daysOfWeek: number[] };
  monthly?: { interval: number; dayOfMonth?: number; weekOfMonth?: number; dayOfWeek?: number };
  custom?: { cronExpression: string };
}

function calculateNextOccurrence(
  recurrenceType: string,
  config: RecurrenceConfig,
  currentDate: Date
): Date {
  const next = new Date(currentDate);
  
  switch (recurrenceType) {
    case 'daily': {
      const interval = config.daily?.interval || 1;
      next.setDate(next.getDate() + interval);
      break;
    }
    case 'weekly': {
      const interval = config.weekly?.interval || 1;
      const daysOfWeek = config.weekly?.daysOfWeek || [1];
      const currentDay = next.getDay();
      
      // Find next valid day
      let daysToAdd = 1;
      for (let i = 1; i <= 7; i++) {
        const checkDay = (currentDay + i) % 7;
        if (daysOfWeek.includes(checkDay)) {
          daysToAdd = i;
          if (i === 7) {
            daysToAdd += (interval - 1) * 7;
          }
          break;
        }
      }
      next.setDate(next.getDate() + daysToAdd);
      break;
    }
    case 'monthly': {
      const interval = config.monthly?.interval || 1;
      const dayOfMonth = config.monthly?.dayOfMonth || 1;
      
      next.setMonth(next.getMonth() + interval);
      next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      break;
    }
    default:
      next.setDate(next.getDate() + 1);
  }
  
  return next;
}

/**
 * Verify the request is from a trusted source (cron job or admin)
 * For scheduled jobs, we use a secret token or service role key
 */
function verifyScheduledJobAuth(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const cronSecret = Deno.env.get('CRON_SECRET');
  
  // Option 1: Called with service role key (internal)
  if (authHeader?.includes(serviceRoleKey || '')) {
    return true;
  }
  
  // Option 2: Called with dedicated cron secret
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  // Option 3: Check for X-Cron-Secret header
  const cronHeader = req.headers.get('X-Cron-Secret');
  if (cronSecret && cronHeader === cronSecret) {
    return true;
  }
  
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK - Scheduled job auth =====
    // This function should only be called by cron/scheduler or internal triggers
    const isAuthorized = verifyScheduledJobAuth(req);
    if (!isAuthorized) {
      console.warn('Unauthorized attempt to trigger recurring task processing');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: This endpoint is for scheduled jobs only' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    console.log(`[CRON] Processing recurring tasks at ${now.toISOString()}`);

    // Fetch all active recurring tasks that are due
    const { data: dueTasks, error: fetchError } = await supabase
      .from('workspace_recurring_tasks')
      .select('*')
      .eq('is_active', true)
      .lte('next_occurrence', now.toISOString());

    if (fetchError) {
      console.error('Error fetching due tasks:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${dueTasks?.length || 0} recurring tasks to process`);

    const results = {
      processed: 0,
      created: 0,
      deactivated: 0,
      errors: [] as string[],
    };

    for (const recurringTask of dueTasks || []) {
      try {
        results.processed++;

        // Check if max occurrences reached
        if (recurringTask.max_occurrences && recurringTask.occurrence_count >= recurringTask.max_occurrences) {
          await supabase
            .from('workspace_recurring_tasks')
            .update({ is_active: false, updated_at: now.toISOString() })
            .eq('id', recurringTask.id);
          
          results.deactivated++;
          console.log(`Deactivated recurring task ${recurringTask.id} - max occurrences reached`);
          continue;
        }

        // Check if end date passed
        if (recurringTask.end_date && new Date(recurringTask.end_date) < now) {
          await supabase
            .from('workspace_recurring_tasks')
            .update({ is_active: false, updated_at: now.toISOString() })
            .eq('id', recurringTask.id);
          
          results.deactivated++;
          console.log(`Deactivated recurring task ${recurringTask.id} - end date passed`);
          continue;
        }

        // Create new task instance
        const templateData = (recurringTask.template_data || {}) as Record<string, unknown>;
        const newTaskData = {
          workspace_id: recurringTask.workspace_id,
          title: recurringTask.title,
          description: recurringTask.description,
          priority: recurringTask.priority || 'MEDIUM',
          category: recurringTask.category,
          role_scope: recurringTask.role_scope,
          assigned_to: recurringTask.assigned_to,
          status: 'NOT_STARTED',
          due_date: new Date(Date.now() + 86400000).toISOString(), // Due tomorrow
          recurring_task_id: recurringTask.id,
          occurrence_number: recurringTask.occurrence_count + 1,
          metadata: {
            ...templateData,
            createdFromRecurring: true,
            recurringTaskId: recurringTask.id,
          },
        };

        const { error: insertError } = await supabase
          .from('workspace_tasks')
          .insert(newTaskData);

        if (insertError) {
          console.error(`Error creating task from recurring ${recurringTask.id}:`, insertError);
          results.errors.push(`Task ${recurringTask.id}: ${insertError.message}`);
          continue;
        }

        results.created++;

        // Calculate next occurrence
        const recurrenceConfig = (recurringTask.recurrence_config || {}) as RecurrenceConfig;
        const nextOccurrence = calculateNextOccurrence(
          recurringTask.recurrence_type,
          recurrenceConfig,
          now
        );

        // Update recurring task
        await supabase
          .from('workspace_recurring_tasks')
          .update({
            next_occurrence: nextOccurrence.toISOString(),
            last_created_at: now.toISOString(),
            occurrence_count: recurringTask.occurrence_count + 1,
            updated_at: now.toISOString(),
          })
          .eq('id', recurringTask.id);

        console.log(`Created task from recurring ${recurringTask.id}, next occurrence: ${nextOccurrence.toISOString()}`);

      } catch (taskError) {
        console.error(`Error processing recurring task ${recurringTask.id}:`, taskError);
        results.errors.push(`Task ${recurringTask.id}: ${String(taskError)}`);
      }
    }

    console.log('[CRON] Processing complete:', results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in process-recurring-tasks:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});