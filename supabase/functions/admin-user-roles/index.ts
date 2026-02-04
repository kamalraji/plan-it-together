import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z, uuidSchema, emailSchema, appRoleSchema, parseAndValidate } from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole = z.infer<typeof appRoleSchema>;

type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
  emailVerified: boolean;
  status: "ACTIVE" | "PENDING";
  appRole: AppRole | null;
};

// Zod schemas for different actions (strict mode)
const listActionSchema = z.object({
  action: z.literal("list"),
}).strict();

const lookupActionSchema = z.object({
  action: z.literal("lookup"),
  email: emailSchema,
}).strict();

const updateActionSchema = z.object({
  action: z.literal("update"),
  userId: uuidSchema,
  appRole: appRoleSchema.optional(),
  roles: z.array(appRoleSchema).max(3, "Maximum 3 roles allowed").optional(),
  note: z.string().trim().max(500, "Note too long").optional(),
}).strict();

const requestSchema = z.discriminatedUnion("action", [
  listActionSchema,
  lookupActionSchema,
  updateActionSchema,
]);

// ============= Rate Limiting =============
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

const RATE_LIMIT_CONFIG: RateLimitConfig = { maxRequests: 30, windowSeconds: 60 };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required Supabase environment variables for admin-user-roles function");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(`admin-user-roles:${clientIP}`, RATE_LIMIT_CONFIG);
  
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

    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      console.error("admin-user-roles: auth.getUser error", userError);
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin, error: roleError } = await userClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError) {
      console.error("admin-user-roles: has_role error", roleError);
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

    // Parse and validate request body
    const parseResult = await parseAndValidate(req, requestSchema, corsHeaders);
    if (!parseResult.success) {
      return parseResult.response;
    }

    const validatedData = parseResult.data;
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (validatedData.action === "list") {
      const { data: usersData, error: listError } = await (serviceClient as any).auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });

      if (listError) {
        console.error("admin-user-roles: listUsers error", listError);
        return new Response(JSON.stringify({ error: "Failed to load users" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const users = (usersData?.users ?? []) as Array<{
        id: string;
        email?: string;
        created_at: string;
        email_confirmed_at?: string | null;
        user_metadata?: Record<string, unknown> | null;
      }>;

      const userIds = users.map((u) => u.id);

      const { data: rolesData, error: rolesError } = await serviceClient
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesError) {
        console.error("admin-user-roles: user_roles select error", rolesError);
        return new Response(JSON.stringify({ error: "Failed to load user roles" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const priority: Record<AppRole, number> = {
        admin: 3,
        organizer: 2,
        participant: 1,
      };

      const rolesByUser = new Map<string, AppRole>();
      for (const row of rolesData ?? []) {
        const r = row.role as AppRole;
        const existing = rolesByUser.get(row.user_id as string);
        if (!existing || priority[r] > priority[existing]) {
          rolesByUser.set(row.user_id as string, r);
        }
      }

      const adminUsers: AdminUser[] = users.map((u) => {
        const metadata = (u.user_metadata ?? {}) as { name?: string };
        const emailVerified = !!u.email_confirmed_at;
        const status: AdminUser["status"] = emailVerified ? "ACTIVE" : "PENDING";

        return {
          id: u.id,
          email: u.email ?? "",
          name: metadata.name ?? null,
          createdAt: u.created_at,
          emailVerified,
          status,
          appRole: rolesByUser.get(u.id) ?? null,
        };
      });

      return new Response(JSON.stringify({ users: adminUsers }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (validatedData.action === "lookup") {
      const { email } = validatedData;

      const { data: userData, error: getUserError } = await (serviceClient as any).auth.admin.getUserByEmail(email);

      if (getUserError) {
        console.error("admin-user-roles: getUserByEmail error", getUserError);
        return new Response(JSON.stringify({ error: "Failed to look up user by email" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const authUser = userData?.user;
      if (!authUser) {
        return new Response(JSON.stringify({ error: "No user found for that email" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userIdFromEmail = authUser.id as string;

      const { data: rolesForUser, error: lookupRolesError } = await serviceClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userIdFromEmail);

      if (lookupRolesError) {
        console.error("admin-user-roles: lookup user_roles error", lookupRolesError);
        return new Response(JSON.stringify({ error: "Failed to load user roles" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const currentRoles: AppRole[] = (rolesForUser ?? []).map((r: any) => r.role as AppRole);

      return new Response(
        JSON.stringify({
          user: {
            id: userIdFromEmail,
            email: authUser.email ?? email,
            roles: currentRoles,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (validatedData.action === "update") {
      const { userId, appRole, roles, note } = validatedData;

      const rolesToAssign: AppRole[] = Array.from(
        new Set(
          (roles && roles.length ? roles : appRole ? [appRole] : []).filter(
            (r): r is AppRole =>
              r === "admin" ||
              r === "organizer" ||
              r === "participant" ||
              r === "judge" ||
              r === "volunteer" ||
              r === "speaker",
          ),
        ),
      );

      if (!rolesToAssign.length) {
        return new Response(JSON.stringify({ error: "No valid roles provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: deleteError } = await serviceClient.from("user_roles").delete().eq("user_id", userId);
      if (deleteError) {
        console.error("admin-user-roles: delete user_roles error", deleteError);
        return new Response(JSON.stringify({ error: "Failed to update roles" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rowsToInsert = rolesToAssign.map((r) => ({ user_id: userId, role: r }));

      const { error: insertError } = await serviceClient.from("user_roles").insert(rowsToInsert);

      if (insertError) {
        console.error("admin-user-roles: insert user_roles error", insertError);
        return new Response(JSON.stringify({ error: "Failed to assign roles" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userAgent = req.headers.get('user-agent') || 'unknown';
      await serviceClient.from("admin_audit_logs").insert({
        admin_id: user.id,
        admin_email: user.email,
        action: "ROLE_UPDATE",
        target_type: "user",
        target_id: userId,
        details: { roles: rolesToAssign, note: note ?? null },
        ip_address: clientIP,
        user_agent: userAgent,
      });

      console.log("admin-user-roles: roles updated", {
        actorUserId: user.id,
        targetUserId: userId,
        roles: rolesToAssign,
        note: note ?? null,
        at: new Date().toISOString(),
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("admin-user-roles: unexpected error", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
