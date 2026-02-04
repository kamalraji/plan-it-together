import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z, uuidSchema, parseAndValidate } from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schemas for judging rubric actions (strict mode)
const criterionSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name required").max(100, "Name too long"),
  description: z.string().trim().max(500, "Description too long"),
  weight: z.number().min(0, "Weight must be >= 0").max(100, "Weight must be <= 100"),
  maxScore: z.number().min(1, "Max score must be >= 1").max(100, "Max score must be <= 100"),
}).strict();

const getActionSchema = z.object({ action: z.literal("get"), eventId: uuidSchema }).strict();
const createActionSchema = z.object({
  action: z.literal("create"),
  eventId: uuidSchema,
  criteria: z.array(criterionSchema).min(1, "At least one criterion").max(20, "Maximum 20 criteria")
    .refine((c) => c.reduce((sum, item) => sum + item.weight, 0) === 100, "Criteria weights must sum to 100"),
}).strict();
const updateActionSchema = z.object({
  action: z.literal("update"),
  eventId: uuidSchema,
  rubricId: uuidSchema,
  criteria: z.array(criterionSchema).min(1).max(20)
    .refine((c) => c.reduce((sum, item) => sum + item.weight, 0) === 100, "Criteria weights must sum to 100"),
}).strict();

const requestSchema = z.discriminatedUnion("action", [getActionSchema, createActionSchema, updateActionSchema]);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const parseResult = await parseAndValidate(req, requestSchema, corsHeaders);
    if (!parseResult.success) return parseResult.response;

    const body = parseResult.data;

    if (body.action === "get") {
      const { data, error } = await supabaseClient.from("rubrics").select("*").eq("event_id", body.eventId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!data) return new Response(JSON.stringify({ rubric: null }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ rubric: { id: data.id, eventId: data.event_id, criteria: data.criteria ?? [], createdAt: data.created_at, updatedAt: data.updated_at } }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.action === "create") {
      const enrichedCriteria = body.criteria.map((c) => ({ id: c.id || crypto.randomUUID(), name: c.name, description: c.description, weight: c.weight, maxScore: c.maxScore }));
      const { data, error } = await supabaseClient.from("rubrics").insert({ event_id: body.eventId, name: "Event Rubric", description: null, criteria: enrichedCriteria }).select("*").single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ rubric: { id: data.id, eventId: data.event_id, criteria: data.criteria ?? [], createdAt: data.created_at, updatedAt: data.updated_at } }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.action === "update") {
      const enrichedCriteria = body.criteria.map((c) => ({ id: c.id || crypto.randomUUID(), name: c.name, description: c.description, weight: c.weight, maxScore: c.maxScore }));
      const { data, error } = await supabaseClient.from("rubrics").update({ criteria: enrichedCriteria, updated_at: new Date().toISOString() }).eq("id", body.rubricId).select("*").single();
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ rubric: { id: data.id, eventId: data.event_id, criteria: data.criteria ?? [], createdAt: data.created_at, updatedAt: data.updated_at } }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("judging-rubric error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
