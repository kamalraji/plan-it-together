import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Task {
  id: string;
  workspace_id: string;
  title: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  due_date: string | null;
}

interface AutomationRule {
  id: string;
  workspace_id: string;
  trigger_type: string;
  trigger_config: {
    slaHours?: number;
    daysBeforeDue?: number[];
    hoursBeforeDue?: number;
  };
  action_type: string;
  action_config: Record<string, unknown>;
  is_enabled: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const results = {
      slaBreaches: 0,
      deadlineReminders: 0,
      overdueEscalations: 0,
      errors: [] as string[],
    };

    // Fetch all enabled automation rules for SLA_BREACH and DEADLINE_APPROACHING
    const { data: rules, error: rulesError } = await supabase
      .from("workspace_automation_rules")
      .select("*")
      .in("trigger_type", ["SLA_BREACH", "DEADLINE_APPROACHING", "OVERDUE"])
      .eq("is_enabled", true);

    if (rulesError) {
      throw new Error(`Failed to fetch rules: ${rulesError.message}`);
    }

    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({ message: "No deadline rules configured", ...results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group rules by workspace
    const rulesByWorkspace = (rules as AutomationRule[]).reduce((acc, rule) => {
      if (!acc[rule.workspace_id]) acc[rule.workspace_id] = [];
      acc[rule.workspace_id].push(rule);
      return acc;
    }, {} as Record<string, AutomationRule[]>);

    // Process each workspace's rules
    for (const [workspaceId, workspaceRules] of Object.entries(rulesByWorkspace)) {
      try {
        // Fetch non-completed tasks for this workspace
        const { data: tasks, error: tasksError } = await supabase
          .from("workspace_tasks")
          .select("*")
          .eq("workspace_id", workspaceId)
          .not("status", "in", '("COMPLETED","CANCELLED")');

        if (tasksError) {
          results.errors.push(`Workspace ${workspaceId}: ${tasksError.message}`);
          continue;
        }

        if (!tasks || tasks.length === 0) continue;

        for (const rule of workspaceRules) {
          for (const task of tasks as Task[]) {
            try {
              let shouldTrigger = false;
              let triggerReason = "";

              switch (rule.trigger_type) {
                case "SLA_BREACH": {
                  const slaHours = rule.trigger_config.slaHours || 48;
                  const taskCreatedAt = new Date(task.created_at);
                  const slaDeadline = new Date(taskCreatedAt.getTime() + slaHours * 60 * 60 * 1000);
                  
                  if (now > slaDeadline && task.status !== "COMPLETED") {
                    // Check if we've already notified for this breach
                    const { data: existingLog } = await supabase
                      .from("automation_execution_logs")
                      .select("id")
                      .eq("rule_id", rule.id)
                      .eq("task_id", task.id)
                      .gte("triggered_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
                      .single();

                    if (!existingLog) {
                      shouldTrigger = true;
                      triggerReason = `Task exceeded ${slaHours}h SLA`;
                      results.slaBreaches++;
                    }
                  }
                  break;
                }

                case "DEADLINE_APPROACHING": {
                  if (!task.due_date) continue;
                  
                  const dueDate = new Date(task.due_date);
                  const daysBeforeDue = rule.trigger_config.daysBeforeDue || [7, 3, 1];
                  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                  const daysUntilDue = Math.floor(hoursUntilDue / 24);

                  // Check if we should send a reminder for any of the configured days
                  for (const reminderDay of daysBeforeDue) {
                    if (daysUntilDue === reminderDay) {
                      // Check if we've already sent this specific reminder
                      const { data: existingLog } = await supabase
                        .from("automation_execution_logs")
                        .select("id")
                        .eq("rule_id", rule.id)
                        .eq("task_id", task.id)
                        .gte("triggered_at", new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString())
                        .single();

                      if (!existingLog) {
                        shouldTrigger = true;
                        triggerReason = `${reminderDay} day(s) until deadline`;
                        results.deadlineReminders++;
                      }
                      break;
                    }
                  }
                  break;
                }

                case "OVERDUE": {
                  if (!task.due_date) continue;
                  
                  const dueDate = new Date(task.due_date);
                  if (now > dueDate) {
                    // Check if we've already processed this overdue task today
                    const { data: existingLog } = await supabase
                      .from("automation_execution_logs")
                      .select("id")
                      .eq("rule_id", rule.id)
                      .eq("task_id", task.id)
                      .gte("triggered_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
                      .single();

                    if (!existingLog) {
                      shouldTrigger = true;
                      triggerReason = "Task is overdue";
                      results.overdueEscalations++;
                    }
                  }
                  break;
                }
              }

              if (shouldTrigger) {
                await executeAction(supabaseUrl, supabaseServiceKey, rule, task, triggerReason);
              }
            } catch (taskError) {
              results.errors.push(`Task ${task.id}: ${taskError instanceof Error ? taskError.message : "Unknown"}`);
            }
          }
        }
      } catch (wsError) {
        results.errors.push(`Workspace ${workspaceId}: ${wsError instanceof Error ? wsError.message : "Unknown"}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Deadline check completed",
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Deadline check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function executeAction(
  supabaseUrl: string,
  supabaseServiceKey: string,
  rule: AutomationRule,
  task: Task,
  triggerReason: string
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const actionConfig = rule.action_config;
  let actionTaken = "";

  switch (rule.action_type) {
    case "SEND_NOTIFICATION": {
      const notifyUsers: string[] = [];
      if (actionConfig.notifyAssignees && task.assigned_to) {
        notifyUsers.push(task.assigned_to);
      }
      if (actionConfig.notifyCreator && task.created_by) {
        notifyUsers.push(task.created_by);
      }

      for (const userId of notifyUsers) {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: (actionConfig.notificationTitle as string) || "Deadline Alert",
          message: `${(actionConfig.notificationMessage as string) || triggerReason}: ${task.title}`,
          type: "automation",
          category: "workspace",
          data: {
            task_id: task.id,
            workspace_id: task.workspace_id,
            trigger_reason: triggerReason,
          },
        });
      }
      actionTaken = `Sent notification to ${notifyUsers.length} user(s): ${triggerReason}`;
      break;
    }

    case "UPDATE_PRIORITY": {
      if (actionConfig.newPriority) {
        await supabase
          .from("workspace_tasks")
          .update({ priority: actionConfig.newPriority })
          .eq("id", task.id);
        actionTaken = `Updated priority to ${actionConfig.newPriority}`;
      }
      break;
    }

    case "CHANGE_STATUS": {
      if (actionConfig.newStatus) {
        await supabase
          .from("workspace_tasks")
          .update({ status: actionConfig.newStatus })
          .eq("id", task.id);
        actionTaken = `Changed status to ${actionConfig.newStatus}`;
      }
      break;
    }

    case "ADD_TAG": {
      if (actionConfig.tag) {
        const { data: currentTask } = await supabase
          .from("workspace_tasks")
          .select("tags")
          .eq("id", task.id)
          .single();
        
        const currentTags = (currentTask?.tags as string[]) || [];
        if (!currentTags.includes(actionConfig.tag as string)) {
          await supabase
            .from("workspace_tasks")
            .update({ tags: [...currentTags, actionConfig.tag] })
            .eq("id", task.id);
          actionTaken = `Added tag: ${actionConfig.tag}`;
        }
      }
      break;
    }
  }

  // Log the execution
  if (actionTaken) {
    await supabase.from("automation_execution_logs").insert({
      rule_id: rule.id,
      task_id: task.id,
      action_taken: actionTaken,
      success: true,
      metadata: { trigger_reason: triggerReason },
    });
  }
}
