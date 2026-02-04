/**
 * Workspace Analytics Edge Function
 * Aggregates task metrics, team performance, and health indicators
 * 
 * Endpoints:
 * - GET: Fetch analytics for a workspace (with optional date range)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface AnalyticsResult {
  workspace: {
    id: string;
    name: string;
    type: string;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    overdue: number;
    completionRate: number;
    avgCompletionTimeHours: number | null;
  };
  team: {
    totalMembers: number;
    activeMembers: number;
    tasksPerMember: number;
    topPerformers: Array<{ userId: string; name: string; completedTasks: number }>;
  };
  budget: {
    totalAllocated: number;
    totalSpent: number;
    pendingRequests: number;
    utilizationRate: number;
  };
  health: {
    score: number;
    indicators: {
      taskVelocity: "good" | "warning" | "critical";
      teamEngagement: "good" | "warning" | "critical";
      budgetHealth: "good" | "warning" | "critical";
      overdueRisk: "good" | "warning" | "critical";
    };
  };
  trends: {
    tasksCompletedLastWeek: number;
    tasksCompletedThisWeek: number;
    weekOverWeekChange: number;
  };
}

async function getUserFromAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  
  return user.id;
}

// deno-lint-ignore no-explicit-any
async function verifyWorkspaceAccess(
  supabase: any,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  // Check workspace_team_members
  const { data: teamMember } = await supabase
    .from("workspace_team_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (teamMember) return true;

  return false;
}

function calculateHealthScore(
  completionRate: number,
  overdueCount: number,
  totalTasks: number,
  budgetUtilization: number,
  activeMembers: number,
  totalMembers: number
): number {
  // Weighted scoring
  const taskScore = completionRate * 30; // 30 points max
  const overdueScore = totalTasks > 0 
    ? Math.max(0, 25 - (overdueCount / totalTasks) * 100) 
    : 25; // 25 points max
  const budgetScore = budgetUtilization <= 100 
    ? Math.min(25, 25 - Math.abs(budgetUtilization - 75) * 0.5) 
    : Math.max(0, 25 - (budgetUtilization - 100)); // 25 points max
  const engagementScore = totalMembers > 0 
    ? (activeMembers / totalMembers) * 20 
    : 20; // 20 points max

  return Math.round(taskScore + overdueScore + budgetScore + engagementScore);
}

function getIndicatorStatus(value: number, thresholds: { good: number; warning: number }): "good" | "warning" | "critical" {
  if (value >= thresholds.good) return "good";
  if (value >= thresholds.warning) return "warning";
  return "critical";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userId = await getUserFromAuth(req);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const workspaceId = url.searchParams.get("workspaceId");
    const includeChildren = url.searchParams.get("includeChildren") === "true";

    if (!workspaceId) {
      return new Response(
        JSON.stringify({ error: "workspaceId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify access
    const hasAccess = await verifyWorkspaceAccess(supabase, userId, workspaceId);
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch workspace info
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("id, name, workspace_type")
      .eq("id", workspaceId)
      .single();

    if (wsError || !workspace) {
      return new Response(
        JSON.stringify({ error: "Workspace not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine workspace IDs to include
    let workspaceIds = [workspaceId];
    if (includeChildren) {
      const { data: children } = await supabase
        .from("workspaces")
        .select("id")
        .eq("parent_workspace_id", workspaceId);
      
      if (children) {
        workspaceIds = [...workspaceIds, ...children.map(c => c.id)];
      }
    }

    // Fetch tasks
    const { data: tasks } = await supabase
      .from("workspace_tasks")
      .select("id, status, due_date, completed_at, created_at, assignee_id")
      .in("workspace_id", workspaceIds);

    const now = new Date();
    const taskStats = {
      total: tasks?.length || 0,
      completed: tasks?.filter(t => t.status === "DONE").length || 0,
      inProgress: tasks?.filter(t => t.status === "IN_PROGRESS").length || 0,
      todo: tasks?.filter(t => t.status === "TODO").length || 0,
      overdue: tasks?.filter(t => 
        t.status !== "DONE" && 
        t.due_date && 
        new Date(t.due_date) < now
      ).length || 0,
    };

    const completionRate = taskStats.total > 0 
      ? (taskStats.completed / taskStats.total) * 100 
      : 0;

    // Calculate average completion time
    const completedWithTimes = tasks?.filter(t => t.completed_at && t.created_at) || [];
    let avgCompletionTimeHours: number | null = null;
    if (completedWithTimes.length > 0) {
      const totalHours = completedWithTimes.reduce((acc, t) => {
        const created = new Date(t.created_at).getTime();
        const completed = new Date(t.completed_at!).getTime();
        return acc + (completed - created) / (1000 * 60 * 60);
      }, 0);
      avgCompletionTimeHours = Math.round(totalHours / completedWithTimes.length);
    }

    // Fetch team members
    const { data: teamMembers } = await supabase
      .from("workspace_team_members")
      .select("user_id, status, user_profiles(full_name)")
      .in("workspace_id", workspaceIds);

    const totalMembers = teamMembers?.length || 0;
    const activeMembers = teamMembers?.filter(m => m.status === "ACTIVE").length || 0;

    // Calculate top performers
    const completedByUser = new Map<string, { count: number; name: string }>();
    tasks?.filter(t => t.status === "DONE" && t.assignee_id).forEach(t => {
      const current = completedByUser.get(t.assignee_id!) || { count: 0, name: "Unknown" };
      completedByUser.set(t.assignee_id!, { count: current.count + 1, name: current.name });
    });

    // Enrich with names
    teamMembers?.forEach(m => {
      if (completedByUser.has(m.user_id)) {
        const profile = m.user_profiles as { full_name?: string } | null;
        completedByUser.get(m.user_id)!.name = profile?.full_name || "Unknown";
      }
    });

    const topPerformers = Array.from(completedByUser.entries())
      .map(([userId, data]) => ({ userId, name: data.name, completedTasks: data.count }))
      .sort((a, b) => b.completedTasks - a.completedTasks)
      .slice(0, 5);

    // Fetch budget data
    const { data: budgetRequests } = await supabase
      .from("workspace_budget_requests")
      .select("id, amount, status")
      .in("workspace_id", workspaceIds);

    const approvedBudget = budgetRequests
      ?.filter(b => b.status === "APPROVED")
      .reduce((acc, b) => acc + (b.amount || 0), 0) || 0;
    
    const pendingRequests = budgetRequests?.filter(b => b.status === "PENDING").length || 0;

    // Fetch expenses
    const { data: expenses } = await supabase
      .from("workspace_expenses")
      .select("amount")
      .in("workspace_id", workspaceIds);

    const totalSpent = expenses?.reduce((acc, e) => acc + (e.amount || 0), 0) || 0;
    const budgetUtilization = approvedBudget > 0 ? (totalSpent / approvedBudget) * 100 : 0;

    // Calculate trends
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const tasksCompletedThisWeek = tasks?.filter(t => 
      t.completed_at && new Date(t.completed_at) >= oneWeekAgo
    ).length || 0;

    const tasksCompletedLastWeek = tasks?.filter(t => 
      t.completed_at && 
      new Date(t.completed_at) >= twoWeeksAgo && 
      new Date(t.completed_at) < oneWeekAgo
    ).length || 0;

    const weekOverWeekChange = tasksCompletedLastWeek > 0
      ? ((tasksCompletedThisWeek - tasksCompletedLastWeek) / tasksCompletedLastWeek) * 100
      : tasksCompletedThisWeek > 0 ? 100 : 0;

    // Calculate health score
    const healthScore = calculateHealthScore(
      completionRate / 100,
      taskStats.overdue,
      taskStats.total,
      budgetUtilization,
      activeMembers,
      totalMembers
    );

    const analytics: AnalyticsResult = {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        type: workspace.workspace_type,
      },
      tasks: {
        ...taskStats,
        completionRate: Math.round(completionRate * 10) / 10,
        avgCompletionTimeHours,
      },
      team: {
        totalMembers,
        activeMembers,
        tasksPerMember: totalMembers > 0 ? Math.round((taskStats.total / totalMembers) * 10) / 10 : 0,
        topPerformers,
      },
      budget: {
        totalAllocated: approvedBudget,
        totalSpent,
        pendingRequests,
        utilizationRate: Math.round(budgetUtilization * 10) / 10,
      },
      health: {
        score: healthScore,
        indicators: {
          taskVelocity: getIndicatorStatus(tasksCompletedThisWeek, { good: 5, warning: 2 }),
          teamEngagement: getIndicatorStatus(
            totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 100,
            { good: 80, warning: 50 }
          ),
          budgetHealth: getIndicatorStatus(
            100 - Math.abs(budgetUtilization - 75),
            { good: 50, warning: 25 }
          ),
          overdueRisk: getIndicatorStatus(
            taskStats.total > 0 ? 100 - (taskStats.overdue / taskStats.total) * 100 : 100,
            { good: 90, warning: 70 }
          ),
        },
      },
      trends: {
        tasksCompletedLastWeek,
        tasksCompletedThisWeek,
        weekOverWeekChange: Math.round(weekOverWeekChange * 10) / 10,
      },
    };

    return new Response(
      JSON.stringify(analytics),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Workspace analytics error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
