import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth, verifyWorkspaceAccess, forbiddenResponse } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutomationRule {
  id: string;
  workspace_id: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  conditions: Record<string, unknown>;
  is_enabled: boolean;
}

interface Task {
  id: string;
  workspace_id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  assigned_to: string | null;
  created_by: string | null;
  due_date: string | null;
  tags?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authResult = await requireAuth(req, corsHeaders);
    if (!authResult.success) {
      return authResult.response;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { trigger_type, task_id, workspace_id, old_status, new_status } = await req.json();

    // ===== AUTHORIZATION CHECK - Workspace access required =====
    const hasAccess = await verifyWorkspaceAccess(authResult.serviceClient, authResult.user.id, workspace_id);
    if (!hasAccess) {
      return forbiddenResponse("You do not have permission to trigger automations for this workspace", corsHeaders);
    }

    console.log(`User ${authResult.user.id} triggering automation rules for workspace ${workspace_id}`);

    // Fetch applicable rules
    const { data: rules, error: rulesError } = await supabase
      .from("workspace_automation_rules")
      .select("*")
      .eq("workspace_id", workspace_id)
      .eq("trigger_type", trigger_type)
      .eq("is_enabled", true);

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the task
    const { data: task, error: taskError } = await supabase
      .from("workspace_tasks")
      .select("*")
      .eq("id", task_id)
      .single();

    if (taskError) throw taskError;

    let processed = 0;
    const logs: Array<{
      rule_id: string;
      task_id: string;
      action_taken: string;
      success: boolean;
      error_message?: string;
    }> = [];

    for (const rule of rules as AutomationRule[]) {
      try {
        // Check trigger-specific conditions
        if (trigger_type === "STATUS_CHANGED") {
          const config = rule.trigger_config as { fromStatus?: string; toStatus?: string };
          if (config.fromStatus && config.fromStatus !== old_status) continue;
          if (config.toStatus && config.toStatus !== new_status) continue;
        }

        // Check general conditions
        const conditions = rule.conditions as { priority?: string[]; category?: string[]; status?: string[] } || {};
        if (conditions.priority && Array.isArray(conditions.priority) && !conditions.priority.includes(task.priority)) continue;
        if (conditions.category && Array.isArray(conditions.category) && !conditions.category.includes(task.category)) continue;
        if (conditions.status && Array.isArray(conditions.status) && !conditions.status.includes(task.status)) continue;

        // Execute action
        let actionTaken = "";
        const actionConfig = rule.action_config as Record<string, unknown>;

        switch (rule.action_type) {
          case "CHANGE_STATUS":
            if (actionConfig.newStatus) {
              await supabase
                .from("workspace_tasks")
                .update({ status: actionConfig.newStatus })
                .eq("id", task_id);
              actionTaken = `Changed status to ${actionConfig.newStatus}`;
            }
            break;

          case "UPDATE_PRIORITY":
            if (actionConfig.newPriority) {
              await supabase
                .from("workspace_tasks")
                .update({ priority: actionConfig.newPriority })
                .eq("id", task_id);
              actionTaken = `Changed priority to ${actionConfig.newPriority}`;
            }
            break;

          case "SEND_NOTIFICATION":
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
                title: (actionConfig.notificationTitle as string) || "Task Automation",
                message: (actionConfig.notificationMessage as string) || `Automation triggered for task: ${task.title}`,
                type: "task",
                category: "workspace",
              });
            }
            actionTaken = `Sent notification to ${notifyUsers.length} user(s)`;
            break;

          case "ADD_TAG":
            if (actionConfig.tag) {
              const currentTags = (task as Task).tags || [];
              if (!currentTags.includes(actionConfig.tag as string)) {
                await supabase
                  .from("workspace_tasks")
                  .update({ tags: [...currentTags, actionConfig.tag] })
                  .eq("id", task_id);
                actionTaken = `Added tag: ${actionConfig.tag}`;
              }
            }
            break;

          case "REMOVE_TAG":
            if (actionConfig.tag) {
              const currentTags = (task as Task).tags || [];
              const newTags = currentTags.filter((t: string) => t !== actionConfig.tag);
              await supabase
                .from("workspace_tasks")
                .update({ tags: newTags })
                .eq("id", task_id);
              actionTaken = `Removed tag: ${actionConfig.tag}`;
            }
            break;

          case "SET_BLOCKED":
            await supabase
              .from("workspace_tasks")
              .update({ status: "BLOCKED" })
              .eq("id", task_id);
            actionTaken = "Set status to BLOCKED";
            break;

          case "AUTO_ASSIGN":
            if (actionConfig.assignToUserId) {
              await supabase
                .from("workspace_tasks")
                .update({ assigned_to: actionConfig.assignToUserId })
                .eq("id", task_id);
              actionTaken = `Auto-assigned to user`;
            }
            break;
        }

        if (actionTaken) {
          logs.push({
            rule_id: rule.id,
            task_id,
            action_taken: actionTaken,
            success: true,
          });
          processed++;
        }
      } catch (actionError) {
        logs.push({
          rule_id: rule.id,
          task_id,
          action_taken: rule.action_type,
          success: false,
          error_message: actionError instanceof Error ? actionError.message : "Unknown error",
        });
      }
    }

    // Insert execution logs
    if (logs.length > 0) {
      await supabase.from("automation_execution_logs").insert(logs);
    }

    return new Response(JSON.stringify({ processed, logs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Automation processing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});