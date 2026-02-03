import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduledReport {
  id: string;
  workspace_id: string;
  report_type: string;
  frequency: string;
  recipients: string[];
  config: Record<string, any>;
  next_run_at: string;
  is_active: boolean;
  created_by: string;
  include_children: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all scheduled reports that are due
    const now = new Date().toISOString();
    const { data: dueReports, error: fetchError } = await supabase
      .from("scheduled_reports")
      .select("*")
      .eq("is_active", true)
      .lte("next_run_at", now);

    if (fetchError) {
      throw new Error(`Failed to fetch scheduled reports: ${fetchError.message}`);
    }

    if (!dueReports || dueReports.length === 0) {
      return new Response(
        JSON.stringify({ message: "No scheduled reports due", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processedReports: string[] = [];
    const errors: { reportId: string; error: string }[] = [];

    for (const report of dueReports as ScheduledReport[]) {
      try {
        // Generate report by calling workspace-reports edge function
        const reportResponse = await fetch(
          `${supabaseUrl}/functions/v1/workspace-reports`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              workspaceId: report.workspace_id,
              reportType: report.report_type,
              format: report.config?.format || "csv",
              includeChildren: report.include_children,
              dateRange: {
                start: getReportStartDate(report.frequency),
                end: now,
              },
            }),
          }
        );

        if (!reportResponse.ok) {
          const errorText = await reportResponse.text();
          throw new Error(`Report generation failed: ${errorText}`);
        }

        const reportData = await reportResponse.json();

        // Store the generated report reference
        const { error: logError } = await supabase.from("report_history").insert({
          scheduled_report_id: report.id,
          workspace_id: report.workspace_id,
          report_type: report.report_type,
          generated_at: now,
          file_url: reportData.fileUrl || null,
          status: "completed",
          metadata: {
            format: report.config?.format || "csv",
            recipients: report.recipients,
          },
        });

        if (logError) {
          console.warn(`Failed to log report history: ${logError.message}`);
        }

        // Send notifications to recipients
        if (report.recipients && report.recipients.length > 0) {
          for (const recipientId of report.recipients) {
            await supabase.from("notifications").insert({
              user_id: recipientId,
              type: "scheduled_report",
              title: `${report.report_type} Report Ready`,
              message: `Your scheduled ${report.report_type.toLowerCase()} report has been generated.`,
              data: {
                report_id: report.id,
                workspace_id: report.workspace_id,
                file_url: reportData.fileUrl,
              },
            });
          }
        }

        // Calculate next run time based on frequency
        const nextRun = calculateNextRunTime(report.frequency);

        // Update the scheduled report with next run time
        const { error: updateError } = await supabase
          .from("scheduled_reports")
          .update({
            next_run_at: nextRun.toISOString(),
            last_run_at: now,
          })
          .eq("id", report.id);

        if (updateError) {
          console.warn(`Failed to update next_run_at: ${updateError.message}`);
        }

        processedReports.push(report.id);
      } catch (reportError) {
        const errorMessage = reportError instanceof Error ? reportError.message : "Unknown error";
        errors.push({ reportId: report.id, error: errorMessage });
        console.error(`Error processing report ${report.id}:`, errorMessage);

        // Mark as failed but don't deactivate
        await supabase.from("report_history").insert({
          scheduled_report_id: report.id,
          workspace_id: report.workspace_id,
          report_type: report.report_type,
          generated_at: now,
          status: "failed",
          error_message: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Scheduled reports processed",
        processed: processedReports.length,
        failed: errors.length,
        processedIds: processedReports,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in process-scheduled-reports:", errorMessage);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

function getReportStartDate(frequency: string): string {
  const now = new Date();
  
  switch (frequency) {
    case "daily":
      now.setDate(now.getDate() - 1);
      break;
    case "weekly":
      now.setDate(now.getDate() - 7);
      break;
    case "biweekly":
      now.setDate(now.getDate() - 14);
      break;
    case "monthly":
      now.setMonth(now.getMonth() - 1);
      break;
    case "quarterly":
      now.setMonth(now.getMonth() - 3);
      break;
    default:
      now.setDate(now.getDate() - 7); // Default to weekly
  }
  
  return now.toISOString();
}

function calculateNextRunTime(frequency: string): Date {
  const next = new Date();
  
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    default:
      next.setDate(next.getDate() + 7);
  }
  
  // Set to 9 AM for consistent scheduling
  next.setHours(9, 0, 0, 0);
  
  return next;
}
