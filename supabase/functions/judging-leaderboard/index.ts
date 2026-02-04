import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z, uuidSchema, parseAndValidate } from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schema for leaderboard request (strict mode)
const leaderboardSchema = z.object({
  eventId: uuidSchema,
}).strict();

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });

  try {
    const parseResult = await parseAndValidate(req, leaderboardSchema, corsHeaders);
    if (!parseResult.success) return parseResult.response;

    const { eventId } = parseResult.data;

    const { data: submissions, error: submissionsError } = await supabaseClient.from("submissions").select("*").eq("event_id", eventId);
    if (submissionsError) return new Response(JSON.stringify({ error: submissionsError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (!submissions || submissions.length === 0) {
      return new Response(JSON.stringify({ leaderboard: { eventId, enabled: true, entries: [], lastUpdated: new Date().toISOString() } }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const submissionIds = submissions.map((s) => s.id);
    const rubricIds = Array.from(new Set(submissions.map((s) => s.rubric_id)));

    const [{ data: scores, error: scoresError }, { data: rubrics, error: rubricsError }] = await Promise.all([
      supabaseClient.from("scores").select("*").in("submission_id", submissionIds),
      supabaseClient.from("rubrics").select("*").in("id", rubricIds),
    ]);

    if (scoresError) return new Response(JSON.stringify({ error: scoresError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (rubricsError) return new Response(JSON.stringify({ error: rubricsError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const rubricById = new Map<string, any>();
    (rubrics ?? []).forEach((r: any) => rubricById.set(r.id, r));

    const scoresBySubmission = new Map<string, any[]>();
    (scores ?? []).forEach((s: any) => { const arr = scoresBySubmission.get(s.submission_id) ?? []; arr.push(s); scoresBySubmission.set(s.submission_id, arr); });

    const entries: any[] = [];
    for (const submission of submissions) {
      const rubric = rubricById.get(submission.rubric_id);
      if (!rubric) continue;
      const criteria = (rubric.criteria as any[]) ?? [];
      const submissionScores = scoresBySubmission.get(submission.id) ?? [];
      if (submissionScores.length === 0) continue;

      let totalPercentageSum = 0;
      for (const scoreRow of submissionScores) {
        const scoresObj = scoreRow.scores ?? {};
        let judgeTotal = 0;
        for (const c of criteria) { if (!c.id) continue; const value = scoresObj[c.id]; if (value === undefined || value === null) continue; const normalized = (value / c.maxScore) * 100; judgeTotal += normalized * (c.weight / 100); }
        totalPercentageSum += judgeTotal;
      }
      const avgPercentage = totalPercentageSum / submissionScores.length;
      entries.push({ id: submission.id, submissionId: submission.id, teamName: submission.team_name, totalScore: avgPercentage, maxPossibleScore: 100, percentage: avgPercentage, rank: 0, lastUpdated: new Date().toISOString() });
    }

    entries.sort((a, b) => b.percentage - a.percentage);
    entries.forEach((e, index) => { e.rank = index + 1; });

    return new Response(JSON.stringify({ leaderboard: { eventId, enabled: true, entries, lastUpdated: new Date().toISOString() } }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("judging-leaderboard error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
