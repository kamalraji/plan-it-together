/**
 * Type-safe Supabase query result types
 * Use these instead of `as any` for joined queries
 */

import { Database } from '@/integrations/supabase/types';

// Base table types from generated schema
type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];

// =============================================================================
// WORKSPACE TYPES
// =============================================================================

/** Workspace row from database */
export type Workspace = Tables['workspaces']['Row'];

/** Workspace with parent workspace info */
export interface WorkspaceWithParent extends Workspace {
  parent_workspace?: Pick<Workspace, 'id' | 'name' | 'slug'> | null;
}

/** Workspace with event info */
export interface WorkspaceWithEvent extends Workspace {
  events?: Pick<Tables['events']['Row'], 'id' | 'name' | 'slug' | 'status'> | null;
}

/** Workspace with full hierarchy */
export interface WorkspaceWithHierarchy extends Workspace {
  parent_workspace?: Pick<Workspace, 'id' | 'name' | 'slug' | 'workspace_type'> | null;
  child_workspaces?: Pick<Workspace, 'id' | 'name' | 'slug' | 'workspace_type'>[];
  events?: Pick<Tables['events']['Row'], 'id' | 'name' | 'slug'> | null;
}

/** Workspace list item for dashboard */
export interface WorkspaceListItem {
  id: string;
  name: string;
  slug: string;
  workspace_type: string | null;
  parent_workspace_id: string | null;
  event_id: string | null;
  status: string | null;
  created_at: string;
}

// =============================================================================
// TEAM MEMBER TYPES
// =============================================================================

/** Team member row */
export type WorkspaceTeamMember = Tables['workspace_team_members']['Row'];

/** Team member with user profile */
export interface TeamMemberWithProfile extends WorkspaceTeamMember {
  user_profiles?: Pick<Tables['user_profiles']['Row'], 'id' | 'full_name' | 'avatar_url' | 'email'> | null;
}

/** Team member with workspace info */
export interface TeamMemberWithWorkspace extends TeamMemberWithProfile {
  workspaces?: Pick<Workspace, 'id' | 'name' | 'slug'> | null;
}

// =============================================================================
// TASK TYPES
// =============================================================================

/** Task row */
export type WorkspaceTask = Tables['workspace_tasks']['Row'];

/** Task with assignee profile */
export interface TaskWithAssignee extends WorkspaceTask {
  user_profiles?: Pick<Tables['user_profiles']['Row'], 'id' | 'full_name' | 'avatar_url'> | null;
}

/** Task with full relations */
export interface TaskWithRelations extends WorkspaceTask {
  assignee?: Pick<Tables['user_profiles']['Row'], 'id' | 'full_name' | 'avatar_url'> | null;
  workspace?: Pick<Workspace, 'id' | 'name' | 'slug'> | null;
  source_workspace?: Pick<Workspace, 'id' | 'name' | 'slug'> | null;
}

/** Task list item for display */
export interface TaskListItem {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  assigned_to: string | null;
  workspace_id: string;
  tags: string[] | null;
  estimated_hours: number | null;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

/** Event row */
export type Event = Tables['events']['Row'];

/** Event with organization */
export interface EventWithOrganization extends Event {
  organizations?: Pick<Tables['organizations']['Row'], 'id' | 'name' | 'slug' | 'logo_url'> | null;
}

/** Event list item */
export interface EventListItem {
  id: string;
  name: string;
  slug: string;
  status: Enums['event_status'] | null;
  start_date: string | null;
  end_date: string | null;
  mode: Enums['event_mode'] | null;
  organization_id: string;
  branding: Record<string, unknown> | null;
}

// =============================================================================
// ORGANIZATION TYPES
// =============================================================================

/** Organization row */
export type Organization = Tables['organizations']['Row'];

/** Organization membership row */
export type OrganizationMembership = Tables['organization_memberships']['Row'];

/** Membership with organization */
export interface MembershipWithOrganization extends OrganizationMembership {
  organizations?: Pick<Organization, 'id' | 'name' | 'slug' | 'logo_url'> | null;
}

// =============================================================================
// REGISTRATION TYPES
// =============================================================================

/** Registration with user and ticket */
export interface RegistrationWithDetails {
  id: string;
  event_id: string;
  user_id: string | null;
  status: string | null;
  check_in_status: string | null;
  check_in_time: string | null;
  ticket_tier_id: string | null;
  form_responses: Record<string, unknown> | null;
  created_at: string;
  user_profiles?: Pick<Tables['user_profiles']['Row'], 'id' | 'full_name' | 'email' | 'avatar_url'> | null;
  ticket_tiers?: { id: string; name: string; price: number | null; currency: string | null } | null;
}

// =============================================================================
// BUDGET & EXPENSE TYPES
// =============================================================================

/** Budget row */
export type WorkspaceBudget = Tables['workspace_budgets']['Row'];

/** Expense row */
export type WorkspaceExpense = Tables['workspace_expenses']['Row'];

/** Budget request row */
export type BudgetRequest = Tables['workspace_budget_requests']['Row'];

/** Budget request with workspace info */
export interface BudgetRequestWithWorkspace extends BudgetRequest {
  workspaces?: Pick<Workspace, 'id' | 'name' | 'slug'> | null;
  parent_workspaces?: Pick<Workspace, 'id' | 'name' | 'slug'> | null;
}

// =============================================================================
// RESOURCE TYPES
// =============================================================================

/** Resource row */
export type WorkspaceResource = Tables['workspace_resources']['Row'];

/** Resource request row */
export type ResourceRequest = Tables['workspace_resource_requests']['Row'];

/** Resource request with details */
export interface ResourceRequestWithDetails extends ResourceRequest {
  resources?: Pick<WorkspaceResource, 'id' | 'name' | 'type'> | null;
  workspaces?: Pick<Workspace, 'id' | 'name' | 'slug'> | null;
}

// =============================================================================
// CHECKLIST TYPES
// =============================================================================

/** Checklist interface */
export interface Checklist {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  phase: string | null;
  status: string | null;
  due_date: string | null;
  delegated_from_workspace_id: string | null;
  delegation_status: string | null;
  created_at: string;
  updated_at: string;
}

/** Checklist item interface */
export interface ChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  position: number;
  completed_at: string | null;
  completed_by: string | null;
}

/** Checklist with items */
export interface ChecklistWithItems extends Checklist {
  checklist_items?: ChecklistItem[];
}

/** Minimal user display */
export interface UserDisplay {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Extract row type from a table name */
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];

/** Extract insert type from a table name */
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];

/** Extract update type from a table name */
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update'];

/** Make specific keys optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific keys required */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Nullable version of a type */
export type Nullable<T> = T | null;

/** Deep partial type */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// =============================================================================
// TYPE GUARDS
// =============================================================================

/** Check if value is a non-null object */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Check if value has expected property */
export function hasProperty<K extends string>(
  value: unknown,
  key: K
): value is Record<K, unknown> {
  return isObject(value) && key in value;
}

/** Assert value is defined (non-null/undefined) */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Value is not defined'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/** Type-safe array check */
export function isNonEmptyArray<T>(arr: T[] | null | undefined): arr is [T, ...T[]] {
  return Array.isArray(arr) && arr.length > 0;
}

// =============================================================================
// QUERY RESULT HELPERS
// =============================================================================

/** Safe cast for joined query results */
export function castQueryResult<T>(data: unknown): T | null {
  if (data === null || data === undefined) return null;
  return data as T;
}

/** Safe cast for array query results */
export function castQueryArray<T>(data: unknown): T[] {
  if (!Array.isArray(data)) return [];
  return data as T[];
}

/** Extract single relation from query result */
export function extractRelation<T>(
  data: T | T[] | null | undefined
): T | null {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}
