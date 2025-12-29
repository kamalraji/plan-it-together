import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole = "admin" | "organizer" | "participant" | "judge" | "volunteer" | "speaker";

type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  createdAt: string;
  emailVerified: boolean;
  status: "ACTIVE" | "PENDING";
  appRole: AppRole | null;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required Supabase environment variables for admin-user-roles function");
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Client scoped to the calling user (for auth + has_role checks via RPC)
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: `Bearer ${jwt}` },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      console.error("admin-user-roles: auth.getUser error", userError);
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is an admin using the has_role helper
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

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action, userId, appRole, roles, email, note } = (await req.json().catch(() => ({}))) as {
      action?: "list" | "update" | "lookup";
      userId?: string;
      appRole?: AppRole;
      roles?: AppRole[];
      email?: string;
      note?: string;
    };

    if (action === "list") {
      // List users via auth.admin using the service role key
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

      // Load all roles for these users in one query
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
        admin: 6,
        organizer: 5,
        judge: 4,
        volunteer: 3,
        speaker: 2,
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

    if (action === "lookup") {
      if (!email) {
        return new Response(JSON.stringify({ error: "Missing email" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: userData, error: getUserError } = await (serviceClient as any).auth.admin.getUserByEmail(
        email,
      );

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

    if (action === "update") {
      if (!userId) {
        return new Response(JSON.stringify({ error: "Missing userId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

      // Enforce a clean set of high-level roles per user: clear then insert
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
