import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export interface AuthResult {
  success: true;
  user: { id: string; email?: string };
  serviceClient: SupabaseClient;
}

export interface AuthError {
  success: false;
  response: Response;
}

/**
 * Verify JWT and return authenticated user
 * Use this for endpoints that require user authentication
 */
export async function requireAuth(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<AuthResult | AuthError> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await userSupabase.auth.getUser();
  
  if (userError || !user) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  return {
    success: true,
    user: { id: user.id, email: user.email },
    serviceClient,
  };
}

/**
 * Verify user has workspace management access (owner or team member with management role)
 */
export async function verifyWorkspaceAccess(
  serviceClient: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  // Check if user is workspace owner
  const { data: workspace } = await serviceClient
    .from('workspaces')
    .select('organizer_id')
    .eq('id', workspaceId)
    .single();

  if (workspace?.organizer_id === userId) {
    return true;
  }

  // Check if user is an active team member with management role
  const { data: member } = await serviceClient
    .from('workspace_team_members')
    .select('role, status')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!member) {
    return false;
  }

  const managementRoles = [
    'WORKSPACE_OWNER', 
    'OPERATIONS_MANAGER', 
    'GROWTH_MANAGER',
    'CONTENT_MANAGER', 
    'TECH_FINANCE_MANAGER', 
    'VOLUNTEERS_MANAGER',
    'SOCIAL_MEDIA_LEAD',
    'MEDIA_LEAD',
    'TECHNICAL_LEAD',
    'IT_LEAD',
  ];
  
  return managementRoles.includes(member.role);
}

/**
 * Verify user has admin role (app-level)
 */
export async function verifyAdminRole(
  serviceClient: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await serviceClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return (data as { role: string }).role === 'admin';
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(
  message: string,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: `Forbidden: ${message}` }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Get service client only (for cron/scheduled jobs)
 * Only use this for internal scheduled jobs, not user-facing endpoints
 */
export function getServiceClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey);
}
