/**
 * Column selection constants for Supabase queries
 * Use these instead of select('*') to fetch only needed columns
 * This improves performance by reducing network payload
 */

// Workspace table columns
export const WORKSPACE_COLUMNS = {
  list: 'id, name, slug, workspace_type, parent_workspace_id, event_id, status, created_at',
  detail: 'id, name, slug, workspace_type, parent_workspace_id, event_id, status, description, settings, created_at, updated_at',
  hierarchy: 'id, name, slug, workspace_type, parent_workspace_id, event_id',
  minimal: 'id, name, slug',
} as const;

// Workspace tasks columns
export const WORKSPACE_TASK_COLUMNS = {
  list: 'id, title, status, priority, due_date, assigned_to, workspace_id, created_at',
  detail: 'id, title, description, status, priority, due_date, assigned_to, workspace_id, source_workspace_id, start_date, estimated_hours, actual_hours, tags, created_at, updated_at',
  minimal: 'id, title, status, priority',
  kanban: 'id, title, status, priority, due_date, assigned_to, tags, estimated_hours',
} as const;

// Workspace team members columns
export const WORKSPACE_TEAM_MEMBER_COLUMNS = {
  list: 'id, user_id, workspace_id, role, status, joined_at',
  detail: 'id, user_id, workspace_id, role, status, permissions, joined_at, invited_by',
  minimal: 'id, user_id, role, status',
} as const;

// User profiles columns
export const USER_PROFILE_COLUMNS = {
  list: 'id, full_name, avatar_url, email',
  detail: 'id, full_name, avatar_url, email, bio, phone, location, created_at, updated_at',
  minimal: 'id, full_name, avatar_url',
  display: 'id, full_name, avatar_url, email',
} as const;

// Events columns
export const EVENT_COLUMNS = {
  list: 'id, name, slug, status, start_date, end_date, organization_id, mode, visibility, created_at',
  detail: 'id, name, slug, description, status, start_date, end_date, organization_id, mode, visibility, category, capacity, registration_type, registration_deadline, owner_user_id, branding, created_at, updated_at',
  minimal: 'id, name, slug, status',
  card: 'id, name, slug, status, start_date, end_date, mode, branding',
} as const;

// Organizations columns
export const ORGANIZATION_COLUMNS = {
  list: 'id, name, slug, logo_url, status, created_at',
  detail: 'id, name, slug, description, logo_url, website, status, settings, created_at, updated_at',
  minimal: 'id, name, slug, logo_url',
} as const;

// Registrations columns
export const REGISTRATION_COLUMNS = {
  list: 'id, event_id, user_id, status, ticket_tier_id, created_at',
  detail: 'id, event_id, user_id, status, ticket_tier_id, check_in_status, check_in_time, form_responses, created_at, updated_at',
  checkin: 'id, event_id, user_id, status, check_in_status, check_in_time, ticket_tier_id',
  minimal: 'id, status, created_at',
} as const;

// Ticket tiers columns
export const TICKET_TIER_COLUMNS = {
  list: 'id, name, event_id, price, currency, quantity, available_quantity, tier_type, status',
  detail: 'id, name, description, event_id, price, currency, quantity, available_quantity, tier_type, status, benefits, visibility, sales_start_date, sales_end_date, created_at',
  minimal: 'id, name, price, currency',
} as const;

// Workspace budget columns
export const WORKSPACE_BUDGET_COLUMNS = {
  detail: 'id, workspace_id, total_amount, allocated_amount, spent_amount, currency, fiscal_year, status, created_at, updated_at',
  summary: 'id, total_amount, allocated_amount, spent_amount, currency',
} as const;

// Workspace expenses columns  
export const WORKSPACE_EXPENSE_COLUMNS = {
  list: 'id, workspace_id, amount, currency, category, description, status, expense_date, created_at',
  detail: 'id, workspace_id, amount, currency, category, description, status, expense_date, receipt_url, approved_by, approved_at, created_by, created_at, updated_at',
  minimal: 'id, amount, category, status',
} as const;

// Workspace resources columns
export const WORKSPACE_RESOURCE_COLUMNS = {
  list: 'id, workspace_id, name, type, status, quantity, available_quantity',
  detail: 'id, workspace_id, name, description, type, status, quantity, available_quantity, unit, location, notes, created_at, updated_at',
  minimal: 'id, name, type, status',
} as const;

// Checklists columns
export const CHECKLIST_COLUMNS = {
  list: 'id, workspace_id, title, phase, status, due_date, created_at',
  detail: 'id, workspace_id, title, description, phase, status, due_date, delegated_from_workspace_id, delegation_status, created_at, updated_at',
  minimal: 'id, title, status',
} as const;

// Checklist items columns
export const CHECKLIST_ITEM_COLUMNS = {
  list: 'id, checklist_id, title, is_completed, position',
  detail: 'id, checklist_id, title, description, is_completed, position, completed_at, completed_by',
} as const;

// Task comments columns
export const TASK_COMMENT_COLUMNS = {
  list: 'id, task_id, user_id, content, parent_id, created_at',
  detail: 'id, task_id, user_id, content, parent_id, mentions, is_edited, created_at, updated_at, deleted_at',
} as const;

// Task activities columns
export const TASK_ACTIVITY_COLUMNS = {
  list: 'id, task_id, user_id, activity_type, description, created_at',
  detail: 'id, task_id, user_id, activity_type, description, metadata, created_at',
} as const;

// Volunteer shifts columns
export const VOLUNTEER_SHIFT_COLUMNS = {
  list: 'id, workspace_id, name, start_time, end_time, location, required_volunteers',
  detail: 'id, workspace_id, name, description, start_time, end_time, location, required_volunteers, notes, created_at, updated_at',
} as const;

// Social posts columns
export const SOCIAL_POST_COLUMNS = {
  list: 'id, workspace_id, content, platform, status, scheduled_for, created_at',
  detail: 'id, workspace_id, content, platform, status, scheduled_for, published_at, engagement_metrics, media_urls, created_at, updated_at',
  minimal: 'id, content, platform, status',
} as const;

// Budget requests columns
export const BUDGET_REQUEST_COLUMNS = {
  list: 'id, workspace_id, amount, status, requested_by, created_at',
  detail: 'id, workspace_id, parent_workspace_id, amount, reason, status, requested_by, reviewed_by, reviewed_at, review_notes, created_at, updated_at',
} as const;

// Resource requests columns
export const RESOURCE_REQUEST_COLUMNS = {
  list: 'id, workspace_id, resource_id, quantity, status, created_at',
  detail: 'id, workspace_id, parent_workspace_id, resource_id, quantity, start_date, end_date, purpose, status, requested_by, reviewed_by, reviewed_at, created_at, updated_at',
} as const;

// Milestones columns
export const MILESTONE_COLUMNS = {
  list: 'id, workspace_id, title, due_date, status, created_at',
  detail: 'id, workspace_id, title, description, due_date, status, completed_at, created_at, updated_at',
} as const;

// Goals columns
export const GOAL_COLUMNS = {
  list: 'id, workspace_id, title, target_value, current_value, due_date, status',
  detail: 'id, workspace_id, title, description, target_value, current_value, unit, due_date, status, created_at, updated_at',
} as const;

// Announcements columns
export const ANNOUNCEMENT_COLUMNS = {
  list: 'id, workspace_id, title, priority, status, publish_date, created_at',
  detail: 'id, workspace_id, title, content, priority, status, publish_date, expire_date, target_audience, created_by, created_at, updated_at',
} as const;

// Time entries columns
export const TIME_ENTRY_COLUMNS = {
  list: 'id, workspace_id, user_id, task_id, start_time, end_time, duration_minutes',
  detail: 'id, workspace_id, user_id, task_id, start_time, end_time, duration_minutes, description, billable, created_at, updated_at',
} as const;

/**
 * Helper to build relation selections
 * @example buildRelation('user_profiles', USER_PROFILE_COLUMNS.minimal) 
 * // Returns: 'user_profiles(id, full_name, avatar_url)'
 */
export function buildRelation(table: string, columns: string): string {
  return `${table}(${columns})`;
}

/**
 * Helper to combine multiple column selections
 * @example combineColumns(WORKSPACE_TASK_COLUMNS.list, 'workspace:workspaces(id, name)')
 */
export function combineColumns(...columns: string[]): string {
  return columns.join(', ');
}
