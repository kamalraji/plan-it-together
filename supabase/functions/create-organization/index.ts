import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  z,
  emailSchema,
  phoneSchema,
  optionalUrlSchema,
  optionalLongStringSchema,
  parseAndValidate,
} from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Zod schema for organization creation
const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Slug must be at least 3 characters")
  .max(100, "Slug must be less than 100 characters")
  .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens");

const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  slug: slugSchema,
  category: z.string().trim().min(1, "Category is required").max(50, "Category must be less than 50 characters"),
  description: optionalLongStringSchema,
  website: optionalUrlSchema,
  email: emailSchema.optional().nullable(),
  phone: phoneSchema,
});

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

    // Parse and validate input with Zod
    const parseResult = await parseAndValidate(req, createOrganizationSchema, corsHeaders);
    if (!parseResult.success) {
      return parseResult.response;
    }

    const { name, slug, category, description, website, email, phone } = parseResult.data;

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
        description: description ?? null,
        website: website ?? null,
        email: email ?? null,
        phone: phone ?? null,
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

      // Handle row-level security or permission errors with a clearer message
      const message = String((insertError as any).message || "");
      if (message.includes("violates row-level security policy")) {
        return new Response(
          JSON.stringify({ error: "You must be an organizer to create an organization" }),
          {
            status: 403,
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
