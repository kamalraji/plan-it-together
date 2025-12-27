import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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
    const { action, eventId, rubricId, criteria } = await req.json();

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get") {
      if (!eventId) {
        return new Response(JSON.stringify({ error: "Missing eventId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabaseClient
        .from("rubrics")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching rubric", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!data) {
        return new Response(JSON.stringify({ rubric: null }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const mapped = {
        id: data.id,
        eventId: data.event_id,
        criteria: data.criteria ?? [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return new Response(JSON.stringify({ rubric: mapped }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create" || action === "update") {
      if (!eventId || !criteria) {
        return new Response(JSON.stringify({ error: "Missing eventId or criteria" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const totalWeight = (criteria as any[]).reduce(
        (sum, c) => sum + (Number(c.weight) || 0),
        0,
      );
      if (totalWeight !== 100) {
        return new Response(
          JSON.stringify({ error: `Total weight must equal 100. Current total: ${totalWeight}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const enrichedCriteria = (criteria as any[]).map((c) => ({
        id: c.id || crypto.randomUUID(),
        name: String(c.name ?? "").trim(),
        description: String(c.description ?? "").trim(),
        weight: Number(c.weight),
        maxScore: Number(c.maxScore),
      }));

      if (action === "create") {
        const { data, error } = await supabaseClient
          .from("rubrics")
          .insert({
            event_id: eventId,
            name: "Event Rubric",
            description: null,
            criteria: enrichedCriteria,
          })
          .select("*")
          .single();

        if (error) {
          console.error("Error creating rubric", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const mapped = {
          id: data.id,
          eventId: data.event_id,
          criteria: data.criteria ?? [],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        return new Response(JSON.stringify({ rubric: mapped }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        if (!rubricId) {
          return new Response(JSON.stringify({ error: "Missing rubricId" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabaseClient
          .from("rubrics")
          .update({ criteria: enrichedCriteria, updated_at: new Date().toISOString() })
          .eq("id", rubricId)
          .select("*")
          .single();

        if (error) {
          console.error("Error updating rubric", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const mapped = {
          id: data.id,
          eventId: data.event_id,
          criteria: data.criteria ?? [],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        return new Response(JSON.stringify({ rubric: mapped }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("judging-rubric error", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
