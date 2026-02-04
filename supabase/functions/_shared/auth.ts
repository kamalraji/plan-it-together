import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============================================================================
// WORKSPACE ROLE HIERARCHY (4 Levels)
// ============================================================================

/**
 * Level 1: Owner - Full workspace control
 */
export const LEVEL_1_OWNER_ROLES = [
  'WORKSPACE_OWNER',
] as const;

/**
 * Level 2: Department Managers - High-level operational control
 */
export const LEVEL_2_MANAGER_ROLES = [
  'OPERATIONS_MANAGER',
  'GROWTH_MANAGER',
  'CONTENT_MANAGER',
  'TECH_FINANCE_MANAGER',
  'VOLUNTEERS_MANAGER',
] as const;

/**
 * Level 3: Team Leads - Team-level oversight and execution
 */
export const LEVEL_3_LEAD_ROLES = [
  'EVENT_LEAD',
  'CATERING_LEAD',
  'LOGISTICS_LEAD',
  'FACILITY_LEAD',
  'MARKETING_LEAD',
  'COMMUNICATION_LEAD',
  'SPONSORSHIP_LEAD',
  'SOCIAL_MEDIA_LEAD',
  'CONTENT_LEAD',
  'SPEAKER_LIAISON_LEAD',
  'JUDGE_LEAD',
  'MEDIA_LEAD',
  'FINANCE_LEAD',
  'REGISTRATION_LEAD',
  'TECHNICAL_LEAD',
  'IT_LEAD',
  'VOLUNTEERS_LEAD',
] as const;

/**
 * Level 4: Coordinators - Task execution and support
 */
export const LEVEL_4_COORDINATOR_ROLES = [
  'EVENT_COORDINATOR',
  'CATERING_COORDINATOR',
  'LOGISTICS_COORDINATOR',
  'FACILITY_COORDINATOR',
  'MARKETING_COORDINATOR',
  'COMMUNICATION_COORDINATOR',
  'SPONSORSHIP_COORDINATOR',
  'SOCIAL_MEDIA_COORDINATOR',
  'CONTENT_COORDINATOR',
  'SPEAKER_LIAISON_COORDINATOR',
  'JUDGE_COORDINATOR',
  'MEDIA_COORDINATOR',
  'FINANCE_COORDINATOR',
  'REGISTRATION_COORDINATOR',
  'TECHNICAL_COORDINATOR',
  'IT_COORDINATOR',
  'VOLUNTEER_COORDINATOR',
] as const;

// ============================================================================
// COMBINED ROLE SETS FOR ACCESS CHECKS
// ============================================================================

/** Level 1 only - Owner access */
export const OWNER_ACCESS_ROLES = [...LEVEL_1_OWNER_ROLES] as const;

/** Level 1-2 - Manager access (Owner + Managers) */
export const MANAGER_ACCESS_ROLES = [
  ...LEVEL_1_OWNER_ROLES,
  ...LEVEL_2_MANAGER_ROLES,
] as const;

/** Level 1-3 - Lead access (Owner + Managers + Leads) */
export const LEAD_ACCESS_ROLES = [
  ...LEVEL_1_OWNER_ROLES,
  ...LEVEL_2_MANAGER_ROLES,
  ...LEVEL_3_LEAD_ROLES,
] as const;

/** Level 1-4 - Any team member access (all roles) */
export const TEAM_MEMBER_ACCESS_ROLES = [
  ...LEVEL_1_OWNER_ROLES,
  ...LEVEL_2_MANAGER_ROLES,
  ...LEVEL_3_LEAD_ROLES,
  ...LEVEL_4_COORDINATOR_ROLES,
] as const;

// Type exports
export type OwnerRole = typeof LEVEL_1_OWNER_ROLES[number];
export type ManagerRole = typeof LEVEL_2_MANAGER_ROLES[number];
export type LeadRole = typeof LEVEL_3_LEAD_ROLES[number];
export type CoordinatorRole = typeof LEVEL_4_COORDINATOR_ROLES[number];
export type WorkspaceRole = OwnerRole | ManagerRole | LeadRole | CoordinatorRole;

// ============================================================================
// ACCESS LEVEL ENUM
// ============================================================================

export enum AccessLevel {
  OWNER = 1,      // Level 1 only
  MANAGER = 2,    // Level 1-2
  LEAD = 3,       // Level 1-3
  TEAM_MEMBER = 4 // Level 1-4 (any active member)
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthResult {
  success: true;
  user: { id: string; email?: string };
  serviceClient: SupabaseClient;
}

export interface AuthError {
  success: false;
  response: Response;
}

export interface WorkspaceAccessResult {
  hasAccess: boolean;
  role: string | null;
  level: AccessLevel | null;
}

// ============================================================================
// AUTH FUNCTIONS
// ============================================================================

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
 * Get user's role level in a workspace
 */
function getRoleLevel(role: string): AccessLevel | null {
  if ((LEVEL_1_OWNER_ROLES as readonly string[]).includes(role)) return AccessLevel.OWNER;
  if ((LEVEL_2_MANAGER_ROLES as readonly string[]).includes(role)) return AccessLevel.MANAGER;
  if ((LEVEL_3_LEAD_ROLES as readonly string[]).includes(role)) return AccessLevel.LEAD;
  if ((LEVEL_4_COORDINATOR_ROLES as readonly string[]).includes(role)) return AccessLevel.TEAM_MEMBER;
  return null;
}

/**
 * Get detailed workspace access information for a user
 */
export async function getWorkspaceAccess(
  serviceClient: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<WorkspaceAccessResult> {
  // Check if user is workspace owner (organizer_id)
  const { data: workspace } = await serviceClient
    .from('workspaces')
    .select('organizer_id')
    .eq('id', workspaceId)
    .single();

  if (workspace?.organizer_id === userId) {
    return { hasAccess: true, role: 'WORKSPACE_OWNER', level: AccessLevel.OWNER };
  }

  // Check team membership
  const { data: member } = await serviceClient
    .from('workspace_team_members')
    .select('role, status')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!member) {
    return { hasAccess: false, role: null, level: null };
  }

  const level = getRoleLevel(member.role);
  return { hasAccess: level !== null, role: member.role, level };
}

/**
 * Verify user has workspace access at specified level or higher
 * @param requiredLevel - Minimum access level required (default: LEAD for backward compatibility)
 */
export async function verifyWorkspaceAccess(
  serviceClient: SupabaseClient,
  userId: string,
  workspaceId: string,
  requiredLevel: AccessLevel = AccessLevel.LEAD
): Promise<boolean> {
  const access = await getWorkspaceAccess(serviceClient, userId, workspaceId);
  
  if (!access.hasAccess || access.level === null) {
    return false;
  }

  // Lower level number = higher access (OWNER=1 > MANAGER=2 > LEAD=3 > TEAM_MEMBER=4)
  return access.level <= requiredLevel;
}

/**
 * Verify user has owner-level access (Level 1)
 */
export async function verifyOwnerAccess(
  serviceClient: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  return verifyWorkspaceAccess(serviceClient, userId, workspaceId, AccessLevel.OWNER);
}

/**
 * Verify user has manager-level access (Level 1-2)
 */
export async function verifyManagerAccess(
  serviceClient: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  return verifyWorkspaceAccess(serviceClient, userId, workspaceId, AccessLevel.MANAGER);
}

/**
 * Verify user has lead-level access (Level 1-3)
 */
export async function verifyLeadAccess(
  serviceClient: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  return verifyWorkspaceAccess(serviceClient, userId, workspaceId, AccessLevel.LEAD);
}

/**
 * Verify user is any active team member (Level 1-4)
 */
export async function verifyTeamMemberAccess(
  serviceClient: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  return verifyWorkspaceAccess(serviceClient, userId, workspaceId, AccessLevel.TEAM_MEMBER);
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
