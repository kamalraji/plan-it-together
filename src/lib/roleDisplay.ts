import { UserRole, WorkspaceRole } from '@/types';

/**
 * Role Display Utility
 * Converts enum values to human-friendly display names for UI and error messages
 */

// ============================================================================
// UserRole (app_role) Display Names
// ============================================================================

const USER_ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.ORGANIZER]: 'Organizer',
  [UserRole.PARTICIPANT]: 'Participant',
  [UserRole.VENDOR]: 'Vendor',
};

const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Full system access with administrative privileges',
  [UserRole.ORGANIZER]: 'Can create and manage events and organizations',
  [UserRole.PARTICIPANT]: 'Can register for and attend events',
  [UserRole.VENDOR]: 'Can access marketplace and vendor features',
};

/**
 * Get human-friendly display name for a UserRole
 */
export function getUserRoleDisplayName(role: UserRole | string): string {
  if (role in USER_ROLE_DISPLAY_NAMES) {
    return USER_ROLE_DISPLAY_NAMES[role as UserRole];
  }
  // Fallback: convert SNAKE_CASE to Title Case
  return formatSnakeCaseToTitle(String(role));
}

/**
 * Get description for a UserRole
 */
export function getUserRoleDescription(role: UserRole): string {
  return USER_ROLE_DESCRIPTIONS[role] ?? 'No description available';
}

// ============================================================================
// WorkspaceRole Display Names
// ============================================================================

const WORKSPACE_ROLE_DISPLAY_NAMES: Partial<Record<WorkspaceRole, string>> = {
  // Level 1 - Owner
  [WorkspaceRole.WORKSPACE_OWNER]: 'Workspace Owner',
  
  // Level 2 - Managers
  [WorkspaceRole.OPERATIONS_MANAGER]: 'Operations Manager',
  [WorkspaceRole.GROWTH_MANAGER]: 'Growth Manager',
  [WorkspaceRole.CONTENT_MANAGER]: 'Content Manager',
  [WorkspaceRole.TECH_FINANCE_MANAGER]: 'Tech & Finance Manager',
  [WorkspaceRole.VOLUNTEERS_MANAGER]: 'Volunteers Manager',
  
  // Level 3 - Leads
  [WorkspaceRole.EVENT_LEAD]: 'Event Lead',
  [WorkspaceRole.CATERING_LEAD]: 'Catering Lead',
  [WorkspaceRole.LOGISTICS_LEAD]: 'Logistics Lead',
  [WorkspaceRole.FACILITY_LEAD]: 'Facility Lead',
  [WorkspaceRole.MARKETING_LEAD]: 'Marketing Lead',
  [WorkspaceRole.COMMUNICATION_LEAD]: 'Communication Lead',
  [WorkspaceRole.SPONSORSHIP_LEAD]: 'Sponsorship Lead',
  [WorkspaceRole.SOCIAL_MEDIA_LEAD]: 'Social Media Lead',
  [WorkspaceRole.CONTENT_LEAD]: 'Content Lead',
  [WorkspaceRole.SPEAKER_LIAISON_LEAD]: 'Speaker Liaison Lead',
  [WorkspaceRole.JUDGE_LEAD]: 'Judge Lead',
  [WorkspaceRole.MEDIA_LEAD]: 'Media Lead',
  [WorkspaceRole.FINANCE_LEAD]: 'Finance Lead',
  [WorkspaceRole.REGISTRATION_LEAD]: 'Registration Lead',
  [WorkspaceRole.TECHNICAL_LEAD]: 'Technical Lead',
  [WorkspaceRole.IT_LEAD]: 'IT Lead',
  [WorkspaceRole.VOLUNTEERS_LEAD]: 'Volunteers Lead',
  
  // Level 4 - Coordinators
  [WorkspaceRole.EVENT_COORDINATOR]: 'Event Coordinator',
  [WorkspaceRole.CATERING_COORDINATOR]: 'Catering Coordinator',
  [WorkspaceRole.LOGISTICS_COORDINATOR]: 'Logistics Coordinator',
  [WorkspaceRole.FACILITY_COORDINATOR]: 'Facility Coordinator',
  [WorkspaceRole.MARKETING_COORDINATOR]: 'Marketing Coordinator',
  [WorkspaceRole.COMMUNICATION_COORDINATOR]: 'Communication Coordinator',
  [WorkspaceRole.SPONSORSHIP_COORDINATOR]: 'Sponsorship Coordinator',
  [WorkspaceRole.SOCIAL_MEDIA_COORDINATOR]: 'Social Media Coordinator',
  [WorkspaceRole.CONTENT_COORDINATOR]: 'Content Coordinator',
  [WorkspaceRole.SPEAKER_LIAISON_COORDINATOR]: 'Speaker Liaison Coordinator',
  [WorkspaceRole.JUDGE_COORDINATOR]: 'Judge Coordinator',
  [WorkspaceRole.MEDIA_COORDINATOR]: 'Media Coordinator',
  [WorkspaceRole.FINANCE_COORDINATOR]: 'Finance Coordinator',
  [WorkspaceRole.REGISTRATION_COORDINATOR]: 'Registration Coordinator',
  [WorkspaceRole.TECHNICAL_COORDINATOR]: 'Technical Coordinator',
  [WorkspaceRole.IT_COORDINATOR]: 'IT Coordinator',
  [WorkspaceRole.VOLUNTEER_COORDINATOR]: 'Volunteer Coordinator',
};

const WORKSPACE_ROLE_LEVEL_NAMES: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  lead: 'Lead',
  coordinator: 'Coordinator',
};

/**
 * Get human-friendly display name for a WorkspaceRole
 */
export function getWorkspaceRoleDisplayName(role: WorkspaceRole | string): string {
  if (role in WORKSPACE_ROLE_DISPLAY_NAMES) {
    return WORKSPACE_ROLE_DISPLAY_NAMES[role as WorkspaceRole] ?? formatSnakeCaseToTitle(String(role));
  }
  // Handle legacy 'OWNER' value
  if (role === 'OWNER') {
    return 'Workspace Owner';
  }
  return formatSnakeCaseToTitle(String(role));
}

/**
 * Get the hierarchy level name for a workspace role
 */
export function getWorkspaceRoleLevelName(level: string): string {
  return WORKSPACE_ROLE_LEVEL_NAMES[level.toLowerCase()] ?? formatSnakeCaseToTitle(level);
}

// ============================================================================
// Organization Role Display Names
// ============================================================================

const ORGANIZATION_ROLE_DISPLAY_NAMES: Record<string, string> = {
  OWNER: 'Organization Owner',
  ADMIN: 'Organization Admin',
  ORGANIZER: 'Organizer',
  VIEWER: 'Viewer',
};

/**
 * Get human-friendly display name for an organization role
 */
export function getOrganizationRoleDisplayName(role: string): string {
  return ORGANIZATION_ROLE_DISPLAY_NAMES[role] ?? formatSnakeCaseToTitle(role);
}

// ============================================================================
// Database app_role mapping
// ============================================================================

const DB_APP_ROLE_TO_USER_ROLE: Record<string, UserRole> = {
  admin: UserRole.SUPER_ADMIN,
  organizer: UserRole.ORGANIZER,
  participant: UserRole.PARTICIPANT,
  vendor: UserRole.VENDOR,
};

const USER_ROLE_TO_DB_APP_ROLE: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'admin',
  [UserRole.ORGANIZER]: 'organizer',
  [UserRole.PARTICIPANT]: 'participant',
  [UserRole.VENDOR]: 'vendor',
};

/**
 * Convert database app_role to UserRole enum
 */
export function fromDbAppRole(dbRole: string): UserRole | null {
  return DB_APP_ROLE_TO_USER_ROLE[dbRole] ?? null;
}

/**
 * Convert UserRole enum to database app_role
 */
export function toDbAppRole(userRole: UserRole): string {
  return USER_ROLE_TO_DB_APP_ROLE[userRole];
}

/**
 * Get display name directly from database app_role value
 */
export function getDbAppRoleDisplayName(dbRole: string): string {
  const userRole = fromDbAppRole(dbRole);
  if (userRole) {
    return getUserRoleDisplayName(userRole);
  }
  return formatSnakeCaseToTitle(dbRole);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert SNAKE_CASE or kebab-case to Title Case
 * e.g., 'SUPER_ADMIN' -> 'Super Admin'
 * e.g., 'volunteer-coordinator' -> 'Volunteer Coordinator'
 */
export function formatSnakeCaseToTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Format any role value for display (auto-detects type)
 */
export function formatRoleForDisplay(role: string): string {
  // Check if it's a UserRole
  if (Object.values(UserRole).includes(role as UserRole)) {
    return getUserRoleDisplayName(role as UserRole);
  }
  
  // Check if it's a WorkspaceRole
  if (Object.values(WorkspaceRole).includes(role as WorkspaceRole)) {
    return getWorkspaceRoleDisplayName(role as WorkspaceRole);
  }
  
  // Check if it's an organization role
  if (role in ORGANIZATION_ROLE_DISPLAY_NAMES) {
    return getOrganizationRoleDisplayName(role);
  }
  
  // Check if it's a database app_role
  if (role in DB_APP_ROLE_TO_USER_ROLE) {
    return getDbAppRoleDisplayName(role);
  }
  
  // Fallback
  return formatSnakeCaseToTitle(role);
}

// ============================================================================
// Permission Denial Messages
// ============================================================================

/**
 * Generate a user-friendly permission denied message
 */
export function getPermissionDeniedMessage(
  action: string,
  requiredRole?: string,
  currentRole?: string
): string {
  const baseMessage = `You don't have permission to ${action}.`;
  
  if (requiredRole && currentRole) {
    const requiredDisplay = formatRoleForDisplay(requiredRole);
    const currentDisplay = formatRoleForDisplay(currentRole);
    return `${baseMessage} This action requires the "${requiredDisplay}" role, but you have "${currentDisplay}".`;
  }
  
  if (requiredRole) {
    const requiredDisplay = formatRoleForDisplay(requiredRole);
    return `${baseMessage} This action requires the "${requiredDisplay}" role.`;
  }
  
  return baseMessage;
}

/**
 * Generate a message for insufficient workspace permissions
 */
export function getWorkspacePermissionMessage(
  action: string,
  minimumLevel?: 'owner' | 'manager' | 'lead' | 'coordinator'
): string {
  const levelNames: Record<string, string> = {
    owner: 'Workspace Owner',
    manager: 'Manager or higher',
    lead: 'Lead or higher',
    coordinator: 'Coordinator or higher',
  };
  
  if (minimumLevel) {
    return `You need to be a ${levelNames[minimumLevel]} to ${action}.`;
  }
  
  return `You don't have the required workspace permissions to ${action}.`;
}
