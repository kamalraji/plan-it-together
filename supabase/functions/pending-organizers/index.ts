import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole = "admin" | "moderator" | "user";

type PendingOrganizer = {
  userId: string;
  email: string;
  name?: string | null;
  firstOrganizationId: string | null;
  firstOrganizationName: string | null;
  requestedAt: string | null;
};

// ============= Rate Limiting (inline for edge function) =============
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  
  // Cleanup expired entries occasionally
  if (Math.random() < 0.1) {
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) rateLimitStore.delete(key);
    }
  }

  const existing = rateLimitStore.get(identifier);
  
  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (existing.count >= config.maxRequests) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetAt: existing.resetAt, retryAfter };
  }

  existing.count++;
  rateLimitStore.set(identifier, existing);
  return { allowed: true, remaining: config.maxRequests - existing.count, resetAt: existing.resetAt };
}

function getClientIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

// Rate limit: 20 requests per minute per IP
const RATE_LIMIT_CONFIG: RateLimitConfig = { maxRequests: 20, windowSeconds: 60 };

// ============= End Rate Limiting =============

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(`pending-organizers:${clientIP}`, RATE_LIMIT_CONFIG);
  
  if (!rateLimitResult.allowed) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ error: "Too many requests", retryAfter: rateLimitResult.retryAfter }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(rateLimitResult.retryAfter || 60),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
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

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure caller is admin in app_role
    const { data: isAdmin, error: roleError } = await userClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin" as AppRole,
    });

    if (roleError) {
      console.error("pending-organizers: has_role error", roleError);
      return new Response(JSON.stringify({ error: "Unable to verify permissions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get distinct users from onboarding_checklist as potential organizers
    const { data: checklistRows, error: checklistError } = await serviceClient
      .from("onboarding_checklist")
      .select("user_id, organization_id, completed_at")
      .order("completed_at", { ascending: true });

    if (checklistError) {
      console.error("pending-organizers: onboarding_checklist error", checklistError);
      return new Response(JSON.stringify({ error: "Failed to load onboarding data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const byUser = new Map<string, { firstOrgId: string | null; requestedAt: string | null }>();
    for (const row of checklistRows ?? []) {
      const uid = row.user_id as string;
      if (!byUser.has(uid)) {
        byUser.set(uid, {
          firstOrgId: (row.organization_id as string | null) ?? null,
          requestedAt: row.completed_at as string | null,
        });
      }
    }

    const userIds = Array.from(byUser.keys());
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ organizers: [] as PendingOrganizer[] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter out users who already have moderator role
    const { data: rolesData, error: rolesError } = await serviceClient
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    if (rolesError) {
      console.error("pending-organizers: user_roles error", rolesError);
      return new Response(JSON.stringify({ error: "Failed to load roles" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hasOrganizer = new Set<string>();
    for (const row of rolesData ?? []) {
      if (row.role === "organizer") {
        hasOrganizer.add(row.user_id as string);
      }
    }

    const pendingUserIds = userIds.filter((id) => !hasOrganizer.has(id));

    if (pendingUserIds.length === 0) {
      return new Response(JSON.stringify({ organizers: [] as PendingOrganizer[] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load auth user details via admin API
    const { data: usersData, error: listError } = await (serviceClient as any).auth.admin.listUsers({
      page: 1,
      perPage: 500,
    });

    if (listError) {
      console.error("pending-organizers: listUsers error", listError);
      return new Response(JSON.stringify({ error: "Failed to load users" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allUsers = (usersData?.users ?? []) as Array<{
      id: string;
      email?: string;
      user_metadata?: Record<string, unknown> | null;
    }>;

    const organizers: PendingOrganizer[] = [];
    for (const u of allUsers) {
      if (!pendingUserIds.includes(u.id)) continue;
      const basic = byUser.get(u.id)!;
      const metadata = (u.user_metadata ?? {}) as { name?: string | null };

      organizers.push({
        userId: u.id,
        email: u.email ?? "",
        name: metadata.name ?? null,
        firstOrganizationId: basic.firstOrgId,
        firstOrganizationName: null,
        requestedAt: basic.requestedAt,
      });
    }

    return new Response(JSON.stringify({ organizers }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("pending-organizers: unexpected error", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});