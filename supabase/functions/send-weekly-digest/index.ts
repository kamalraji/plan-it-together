import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DigestData {
  userId: string;
  email: string;
  workspaces: {
    id: string;
    name: string;
    tasksCompleted: number;
    tasksPending: number;
    upcomingDeadlines: number;
    newMessages: number;
  }[];
  totalTasksCompleted: number;
  totalPendingTasks: number;
  upcomingEvents: { name: string; date: string }[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get users who have weekly digest enabled
    const { data: users, error: usersError } = await supabase
      .from("notification_preferences")
      .select("user_id, user_profiles!inner(email, full_name)")
      .eq("weekly_digest_enabled", true);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    const digestsSent: string[] = [];
    const errors: string[] = [];

    for (const userPref of users || []) {
      try {
        const userId = userPref.user_id;
        const userProfile = userPref.user_profiles as any;

        // Get user's workspaces
        const { data: memberships } = await supabase
          .from("workspace_team_members")
          .select("workspace_id, workspaces(id, name)")
          .eq("user_id", userId);

        if (!memberships || memberships.length === 0) continue;

        const workspaceDigests = [];
        let totalCompleted = 0;
        let totalPending = 0;

        for (const membership of memberships) {
          const workspace = membership.workspaces as any;
          if (!workspace) continue;

          // Get task stats for the past week
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          const { count: completedCount } = await supabase
            .from("workspace_tasks")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", workspace.id)
            .eq("status", "COMPLETED")
            .gte("updated_at", oneWeekAgo.toISOString());

          const { count: pendingCount } = await supabase
            .from("workspace_tasks")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", workspace.id)
            .in("status", ["TODO", "IN_PROGRESS"]);

          // Get upcoming deadlines (next 7 days)
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);

          const { count: deadlineCount } = await supabase
            .from("workspace_tasks")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", workspace.id)
            .lte("due_date", nextWeek.toISOString())
            .gte("due_date", new Date().toISOString())
            .neq("status", "COMPLETED");

          // Get unread messages count
          const { count: messageCount } = await supabase
            .from("channel_messages")
            .select("*", { count: "exact", head: true })
            .in(
              "channel_id",
              await supabase
                .from("workspace_channels")
                .select("id")
                .eq("workspace_id", workspace.id)
                .then((r) => (r.data || []).map((c) => c.id))
            )
            .gte("created_at", oneWeekAgo.toISOString());

          workspaceDigests.push({
            id: workspace.id,
            name: workspace.name,
            tasksCompleted: completedCount || 0,
            tasksPending: pendingCount || 0,
            upcomingDeadlines: deadlineCount || 0,
            newMessages: messageCount || 0,
          });

          totalCompleted += completedCount || 0;
          totalPending += pendingCount || 0;
        }

        // Get upcoming events
        const { data: upcomingEvents } = await supabase
          .from("events")
          .select("name, start_date")
          .gte("start_date", new Date().toISOString())
          .lte("start_date", new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString())
          .order("start_date", { ascending: true })
          .limit(5);

        const digestData: DigestData = {
          userId,
          email: userProfile?.email || "",
          workspaces: workspaceDigests,
          totalTasksCompleted: totalCompleted,
          totalPendingTasks: totalPending,
          upcomingEvents: (upcomingEvents || []).map((e) => ({
            name: e.name,
            date: e.start_date,
          })),
        };

        // Log the digest (in production, this would send an email via Resend/SendGrid)
        console.log(`Weekly digest for user ${userId}:`, JSON.stringify(digestData, null, 2));

        // Record digest was sent
        await supabase.from("notification_logs").insert({
          user_id: userId,
          notification_type: "weekly_digest",
          channel: "email",
          status: "sent",
          metadata: digestData,
        });

        digestsSent.push(userId);
      } catch (userError) {
        console.error(`Error processing user ${userPref.user_id}:`, userError);
        errors.push(`User ${userPref.user_id}: ${userError}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        digestsSent: digestsSent.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Weekly digest error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
