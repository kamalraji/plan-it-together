import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z, uuidSchema, validationError } from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Zod schemas for different actions
const assignedSubmissionsSchema = z.object({
  action: z.literal("assignedSubmissions"),
  eventId: uuidSchema,
});

const getScoreForSubmissionSchema = z.object({
  action: z.literal("getScoreForSubmission"),
  submissionId: uuidSchema,
});

const submitScoreSchema = z.object({
  action: z.literal("submitScore"),
  submissionId: uuidSchema,
  scores: z.record(z.string(), z.number().min(0).max(100)),
  comments: z.string().max(2000).optional(),
});

const requestSchema = z.discriminatedUnion("action", [
  assignedSubmissionsSchema,
  getScoreForSubmissionSchema,
  submitScoreSchema,
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: req.headers.get("Authorization") ?? "" },
    },
  });

  try {
    const rawBody = await req.json().catch(() => ({}));
    
    // Validate request body
    const parseResult = requestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return validationError(parseResult.error, corsHeaders);
    }

    const body = parseResult.data;

    // Resolve current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "assignedSubmissions") {
      // Judges should only see submissions explicitly assigned to them
      const { data: assignments, error: assignmentsError } = await supabaseClient
        .from("judge_assignments")
        .select("submission_id")
        .eq("judge_id", user.id);

      if (assignmentsError) {
        console.error("Error fetching judge assignments", assignmentsError);
        return new Response(JSON.stringify({ error: assignmentsError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const submissionIds = (assignments ?? []).map((a) => a.submission_id);

      if (!submissionIds.length) {
        return new Response(JSON.stringify({ submissions: [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabaseClient
        .from("submissions")
        .select("*")
        .in("id", submissionIds)
        .eq("event_id", body.eventId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching submissions", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const mapped = (data ?? []).map((s) => ({
        id: s.id,
        eventId: s.event_id,
        rubricId: s.rubric_id,
        teamName: s.team_name,
        description: s.description,
        metadata: s.metadata ?? {},
        submittedBy: s.submitted_by,
        submittedAt: s.created_at,
        files: (s.metadata as any)?.files ?? [],
      }));

      return new Response(JSON.stringify({ submissions: mapped }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "getScoreForSubmission") {
      // Ensure this judge is assigned to the submission before revealing any score
      const { data: assignment, error: assignmentError } = await supabaseClient
        .from("judge_assignments")
        .select("id")
        .eq("submission_id", body.submissionId)
        .eq("judge_id", user.id)
        .maybeSingle();

      if (assignmentError && assignmentError.code !== "PGRST116") {
        console.error("Error checking judge assignment", assignmentError);
        return new Response(JSON.stringify({ error: assignmentError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!assignment) {
        return new Response(JSON.stringify({ error: "You are not assigned to this submission" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabaseClient
        .from("scores")
        .select("*")
        .eq("submission_id", body.submissionId)
        .eq("judge_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching score", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!data) {
        return new Response(JSON.stringify({ score: null }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const mapped = {
        id: data.id,
        submissionId: data.submission_id,
        judgeId: data.judge_id,
        rubricId: data.rubric_id,
        scores: data.scores ?? {},
        comments: data.comments ?? null,
        submittedAt: data.updated_at ?? data.created_at,
      };

      return new Response(JSON.stringify({ score: mapped }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "submitScore") {
      // Ensure this judge is assigned to the submission before allowing scoring
      const { data: assignment, error: assignmentError } = await supabaseClient
        .from("judge_assignments")
        .select("id")
        .eq("submission_id", body.submissionId)
        .eq("judge_id", user.id)
        .maybeSingle();

      if (assignmentError && assignmentError.code !== "PGRST116") {
        console.error("Error checking judge assignment", assignmentError);
        return new Response(JSON.stringify({ error: assignmentError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!assignment) {
        return new Response(JSON.stringify({ error: "You are not assigned to this submission" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get submission and rubric to validate
      const { data: submission, error: subError } = await supabaseClient
        .from("submissions")
        .select("*")
        .eq("id", body.submissionId)
        .single();

      if (subError || !submission) {
        console.error("Error fetching submission", subError);
        return new Response(JSON.stringify({ error: "Submission not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: rubric, error: rubricError } = await supabaseClient
        .from("rubrics")
        .select("*")
        .eq("id", submission.rubric_id)
        .single();

      if (rubricError || !rubric) {
        console.error("Error fetching rubric", rubricError);
        return new Response(JSON.stringify({ error: "Rubric not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const criteria = (rubric.criteria as any[]) ?? [];
      for (const c of criteria) {
        if (!c.id) continue;
        const value = body.scores[c.id];
        if (value === undefined || value === null) {
          return new Response(
            JSON.stringify({ error: `Missing score for criterion ${c.name}` }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        if (value < 0 || value > c.maxScore) {
          return new Response(
            JSON.stringify({
              error: `Score for criterion ${c.name} must be between 0 and ${c.maxScore}`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      }

      const { data, error } = await supabaseClient
        .from("scores")
        .upsert(
          {
            submission_id: body.submissionId,
            judge_id: user.id,
            rubric_id: submission.rubric_id,
            scores: body.scores,
            comments: body.comments ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "submission_id,judge_id" },
        )
        .select("*")
        .single();

      if (error) {
        console.error("Error submitting score", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const mapped = {
        id: data.id,
        submissionId: data.submission_id,
        judgeId: data.judge_id,
        rubricId: data.rubric_id,
        scores: data.scores ?? {},
        comments: data.comments ?? null,
        submittedAt: data.updated_at ?? data.created_at,
      };

      return new Response(JSON.stringify({ score: mapped }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("judging-submissions error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
