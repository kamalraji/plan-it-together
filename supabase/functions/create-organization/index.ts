import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// Use the built-in anon key env var provided by the platform
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing authentication token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: `Bearer ${jwt}` },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // Basic input validation and normalization
    const name = String(body.name ?? "").trim();
    const slug = String(body.slug ?? "").trim().toLowerCase();
    const category = String(body.category ?? "").trim();
    const description = body.description ? String(body.description).trim() : null;
    const website = body.website ? String(body.website).trim() : null;
    const email = body.email ? String(body.email).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;

    if (!name || !slug || !category) {
      return new Response(JSON.stringify({ error: "Name, slug and category are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (name.length > 200 || slug.length > 100) {
      return new Response(JSON.stringify({ error: "Name or slug too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure slug is unique
    const { data: existing, error: existingError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingError) {
      console.error("create-organization: slug check error", existingError);
      return new Response(JSON.stringify({ error: "Failed to validate slug" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existing) {
      return new Response(JSON.stringify({ error: "This URL handle is already taken" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("organizations")
      .insert({
        owner_id: user.id,
        name,
        slug,
        category,
        description,
        website,
        email,
        phone,
      })
      .select("id, slug, name, category, description, website, email, phone")
      .single();

    if (insertError) {
      console.error("create-organization: insert error", insertError);

      // Handle unique constraint violation on slug more gracefully
      if ((insertError as any).code === "23505") {
        return new Response(
          JSON.stringify({ error: "This URL handle is already taken" }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify({ error: "Failed to create organization" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ organization: inserted }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-organization: unexpected error", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
