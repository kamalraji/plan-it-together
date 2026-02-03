/**
 * Workspace Reports Edge Function
 * Generates PDF/CSV reports for workspace data
 * 
 * Endpoints:
 * - POST: Generate a report
 * - GET: List scheduled reports
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type ReportType = "tasks" | "budget" | "team" | "activity" | "comprehensive";
type ReportFormat = "csv" | "json";

interface ReportRequest {
  workspaceId: string;
  reportType: ReportType;
  format: ReportFormat;
  dateRange?: {
    start: string;
    end: string;
  };
  includeChildren?: boolean;
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
): Promise<{ hasAccess: boolean; role: string | null }> {
  const { data: teamMember } = await supabase
    .from("workspace_team_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (teamMember) return { hasAccess: true, role: teamMember.role as string };

  return { hasAccess: false, role: null };
}

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(data: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(",");
  const rows = data.map(row => 
    columns.map(col => escapeCSV(row[col])).join(",")
  );
  return [header, ...rows].join("\n");
}

// deno-lint-ignore no-explicit-any
async function generateTasksReport(
  supabase: any,
  workspaceIds: string[],
  dateRange?: { start: string; end: string }
): Promise<{ data: Record<string, unknown>[]; columns: string[] }> {
  let query = supabase
    .from("workspace_tasks")
    .select(`
      id,
      title,
      description,
      status,
      priority,
      due_date,
      created_at,
      completed_at,
      assignee_id,
      workspace_id
    `)
    .in("workspace_id", workspaceIds)
    .order("created_at", { ascending: false });

  if (dateRange) {
    query = query
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end);
  }

  const { data: tasks } = await query;

  const columns = [
    "id", "title", "status", "priority", "due_date", 
    "created_at", "completed_at", "assignee_id", "workspace_id"
  ];

  return { data: tasks || [], columns };
}

// deno-lint-ignore no-explicit-any
async function generateBudgetReport(
  supabase: any,
  workspaceIds: string[],
  dateRange?: { start: string; end: string }
): Promise<{ data: Record<string, unknown>[]; columns: string[] }> {
  // Fetch budget requests
  let budgetQuery = supabase
    .from("workspace_budget_requests")
    .select("id, title, amount, status, category, created_at, approved_at, workspace_id")
    .in("workspace_id", workspaceIds);

  if (dateRange) {
    budgetQuery = budgetQuery
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end);
  }

  const { data: budgetRequests } = await budgetQuery;

  // Fetch expenses
  let expenseQuery = supabase
    .from("workspace_expenses")
    .select("id, description, amount, category, created_at, workspace_id")
    .in("workspace_id", workspaceIds);

  if (dateRange) {
    expenseQuery = expenseQuery
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end);
  }

  const { data: expenses } = await expenseQuery;

  // Combine into report
  // deno-lint-ignore no-explicit-any
  const budgetData = (budgetRequests || []).map((b: any) => ({
    type: "budget_request",
    id: b.id,
    description: b.title,
    amount: b.amount,
    status: b.status,
    category: b.category,
    date: b.created_at,
    workspace_id: b.workspace_id,
  }));

  // deno-lint-ignore no-explicit-any
  const expenseData = (expenses || []).map((e: any) => ({
    type: "expense",
    id: e.id,
    description: e.description,
    amount: e.amount,
    status: "spent",
    category: e.category,
    date: e.created_at,
    workspace_id: e.workspace_id,
  }));

  const columns = ["type", "id", "description", "amount", "status", "category", "date", "workspace_id"];

  return { data: [...budgetData, ...expenseData], columns };
}

// deno-lint-ignore no-explicit-any
async function generateTeamReport(
  supabase: any,
  workspaceIds: string[]
): Promise<{ data: Record<string, unknown>[]; columns: string[] }> {
  const { data: members } = await supabase
    .from("workspace_team_members")
    .select(`
      id,
      user_id,
      role,
      status,
      joined_at,
      workspace_id,
      user_profiles(full_name, email)
    `)
    .in("workspace_id", workspaceIds);

  // deno-lint-ignore no-explicit-any
  const teamData = (members || []).map((m: any) => {
    const profile = m.user_profiles as { full_name?: string; email?: string } | null;
    return {
      id: m.id,
      user_id: m.user_id,
      name: profile?.full_name || "Unknown",
      email: profile?.email || "",
      role: m.role,
      status: m.status,
      joined_at: m.joined_at,
      workspace_id: m.workspace_id,
    };
  });

  const columns = ["id", "user_id", "name", "email", "role", "status", "joined_at", "workspace_id"];

  return { data: teamData, columns };
}

// deno-lint-ignore no-explicit-any
async function generateActivityReport(
  supabase: any,
  workspaceIds: string[],
  dateRange?: { start: string; end: string }
): Promise<{ data: Record<string, unknown>[]; columns: string[] }> {
  let query = supabase
    .from("workspace_activities")
    .select("id, activity_type, description, created_at, user_id, workspace_id")
    .in("workspace_id", workspaceIds)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (dateRange) {
    query = query
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end);
  }

  const { data: activities } = await query;

  const columns = ["id", "activity_type", "description", "created_at", "user_id", "workspace_id"];

  return { data: activities || [], columns };
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

    if (req.method === "GET") {
      // List scheduled reports for user
      const { data: scheduledReports } = await supabase
        .from("scheduled_reports")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      return new Response(
        JSON.stringify({ reports: scheduledReports || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST") {
      const body: ReportRequest = await req.json();
      const { workspaceId, reportType, format, dateRange, includeChildren = false } = body;

      if (!workspaceId || !reportType || !format) {
        return new Response(
          JSON.stringify({ error: "workspaceId, reportType, and format are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify access
      const { hasAccess, role } = await verifyWorkspaceAccess(supabase, userId, workspaceId);
      if (!hasAccess) {
        return new Response(
          JSON.stringify({ error: "Access denied" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Only managers and above can generate reports
      if (!["OWNER", "ADMIN", "MANAGER", "LEAD"].includes(role || "")) {
        return new Response(
          JSON.stringify({ error: "Insufficient permissions to generate reports" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

      // Generate report based on type
      let reportData: { data: Record<string, unknown>[]; columns: string[] };

      switch (reportType) {
        case "tasks":
          reportData = await generateTasksReport(supabase, workspaceIds, dateRange);
          break;
        case "budget":
          reportData = await generateBudgetReport(supabase, workspaceIds, dateRange);
          break;
        case "team":
          reportData = await generateTeamReport(supabase, workspaceIds);
          break;
        case "activity":
          reportData = await generateActivityReport(supabase, workspaceIds, dateRange);
          break;
        case "comprehensive":
          // Combine all reports
          const [tasks, budget, team, activity] = await Promise.all([
            generateTasksReport(supabase, workspaceIds, dateRange),
            generateBudgetReport(supabase, workspaceIds, dateRange),
            generateTeamReport(supabase, workspaceIds),
            generateActivityReport(supabase, workspaceIds, dateRange),
          ]);
          
          if (format === "json") {
            return new Response(
              JSON.stringify({
                tasks: tasks.data,
                budget: budget.data,
                team: team.data,
                activity: activity.data,
                generatedAt: new Date().toISOString(),
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          // For CSV, combine with section headers
          const csvSections = [
            "# TASKS REPORT",
            toCSV(tasks.data, tasks.columns),
            "",
            "# BUDGET REPORT",
            toCSV(budget.data, budget.columns),
            "",
            "# TEAM REPORT",
            toCSV(team.data, team.columns),
            "",
            "# ACTIVITY REPORT",
            toCSV(activity.data, activity.columns),
          ];
          
          return new Response(
            csvSections.join("\n"),
            { 
              status: 200, 
              headers: { 
                ...corsHeaders, 
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="workspace-report-${new Date().toISOString().split('T')[0]}.csv"`
              } 
            }
          );
        default:
          return new Response(
            JSON.stringify({ error: "Invalid report type" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
      }

      // Return based on format
      if (format === "csv") {
        const csv = toCSV(reportData.data, reportData.columns);
        return new Response(
          csv,
          { 
            status: 200, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.csv"`
            } 
          }
        );
      }

      return new Response(
        JSON.stringify({
          data: reportData.data,
          columns: reportData.columns,
          generatedAt: new Date().toISOString(),
          recordCount: reportData.data.length,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Workspace reports error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
