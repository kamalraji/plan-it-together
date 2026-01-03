import { WorkspaceRole } from '@/types';

/**
 * Workspace Hierarchy Level Definitions
 * 
 * Level 1: Workspace Owner - Full control & oversight
 * Level 2: Department Managers - Department strategy, KPIs, manages all sub-levels
 * Level 3: Team Leads - Committee execution, manages coordinators
 * Level 4: Coordinators - Task execution, limited to assigned tasks
 */
export enum WorkspaceHierarchyLevel {
  OWNER = 1,
  MANAGER = 2,
  LEAD = 3,
  COORDINATOR = 4,
}

/**
 * Department definitions for Level 2 sub-workspaces
 */
export const WORKSPACE_DEPARTMENTS = [
  { id: 'operations', name: 'Operations', description: 'Event logistics, catering, facilities' },
  { id: 'growth', name: 'Growth', description: 'Marketing, sponsorship, communications' },
  { id: 'content', name: 'Content', description: 'Content creation, speakers, judges, media' },
  { id: 'tech_finance', name: 'Tech & Finance', description: 'Technical, IT, finance, registration' },
  { id: 'volunteers', name: 'Volunteers', description: 'Volunteer coordination and management' },
] as const;

/**
 * Committee definitions mapped to departments
 */
export const DEPARTMENT_COMMITTEES: Record<string, { id: string; name: string; leadRole: WorkspaceRole; coordinatorRole: WorkspaceRole }[]> = {
  operations: [
    { id: 'event', name: 'Event', leadRole: WorkspaceRole.EVENT_LEAD, coordinatorRole: WorkspaceRole.EVENT_COORDINATOR },
    { id: 'catering', name: 'Catering', leadRole: WorkspaceRole.CATERING_LEAD, coordinatorRole: WorkspaceRole.CATERING_COORDINATOR },
    { id: 'logistics', name: 'Logistics', leadRole: WorkspaceRole.LOGISTICS_LEAD, coordinatorRole: WorkspaceRole.LOGISTICS_COORDINATOR },
    { id: 'facility', name: 'Facility', leadRole: WorkspaceRole.FACILITY_LEAD, coordinatorRole: WorkspaceRole.FACILITY_COORDINATOR },
  ],
  growth: [
    { id: 'marketing', name: 'Marketing', leadRole: WorkspaceRole.MARKETING_LEAD, coordinatorRole: WorkspaceRole.MARKETING_COORDINATOR },
    { id: 'communication', name: 'Communication', leadRole: WorkspaceRole.COMMUNICATION_LEAD, coordinatorRole: WorkspaceRole.COMMUNICATION_COORDINATOR },
    { id: 'sponsorship', name: 'Sponsorship', leadRole: WorkspaceRole.SPONSORSHIP_LEAD, coordinatorRole: WorkspaceRole.SPONSORSHIP_COORDINATOR },
    { id: 'social_media', name: 'Social Media', leadRole: WorkspaceRole.SOCIAL_MEDIA_LEAD, coordinatorRole: WorkspaceRole.SOCIAL_MEDIA_COORDINATOR },
  ],
  content: [
    { id: 'content', name: 'Content', leadRole: WorkspaceRole.CONTENT_LEAD, coordinatorRole: WorkspaceRole.CONTENT_COORDINATOR },
    { id: 'speaker_liaison', name: 'Speaker Liaison', leadRole: WorkspaceRole.SPEAKER_LIAISON_LEAD, coordinatorRole: WorkspaceRole.SPEAKER_LIAISON_COORDINATOR },
    { id: 'judge', name: 'Judge', leadRole: WorkspaceRole.JUDGE_LEAD, coordinatorRole: WorkspaceRole.JUDGE_COORDINATOR },
    { id: 'media', name: 'Media', leadRole: WorkspaceRole.MEDIA_LEAD, coordinatorRole: WorkspaceRole.MEDIA_COORDINATOR },
  ],
  tech_finance: [
    { id: 'finance', name: 'Finance', leadRole: WorkspaceRole.FINANCE_LEAD, coordinatorRole: WorkspaceRole.FINANCE_COORDINATOR },
    { id: 'registration', name: 'Registration', leadRole: WorkspaceRole.REGISTRATION_LEAD, coordinatorRole: WorkspaceRole.REGISTRATION_COORDINATOR },
    { id: 'technical', name: 'Technical', leadRole: WorkspaceRole.TECHNICAL_LEAD, coordinatorRole: WorkspaceRole.TECHNICAL_COORDINATOR },
    { id: 'it', name: 'IT', leadRole: WorkspaceRole.IT_LEAD, coordinatorRole: WorkspaceRole.IT_COORDINATOR },
  ],
  volunteers: [
    { id: 'volunteers', name: 'Volunteers', leadRole: WorkspaceRole.VOLUNTEERS_LEAD, coordinatorRole: WorkspaceRole.VOLUNTEER_COORDINATOR },
  ],
};

/**
 * Map roles to their hierarchy level
 */
export function getWorkspaceRoleLevel(role: WorkspaceRole): WorkspaceHierarchyLevel {
  // Level 1 - Owner
  if (role === WorkspaceRole.WORKSPACE_OWNER) {
    return WorkspaceHierarchyLevel.OWNER;
  }

  // Level 2 - Managers
  if (role === WorkspaceRole.DEPARTMENT_MANAGER) {
    return WorkspaceHierarchyLevel.MANAGER;
  }

  // Level 3 - Leads
  const leadRoles: WorkspaceRole[] = [
    WorkspaceRole.TEAM_LEAD,
    WorkspaceRole.EVENT_LEAD,
    WorkspaceRole.CATERING_LEAD,
    WorkspaceRole.LOGISTICS_LEAD,
    WorkspaceRole.FACILITY_LEAD,
    WorkspaceRole.MARKETING_LEAD,
    WorkspaceRole.COMMUNICATION_LEAD,
    WorkspaceRole.SPONSORSHIP_LEAD,
    WorkspaceRole.SOCIAL_MEDIA_LEAD,
    WorkspaceRole.CONTENT_LEAD,
    WorkspaceRole.SPEAKER_LIAISON_LEAD,
    WorkspaceRole.JUDGE_LEAD,
    WorkspaceRole.MEDIA_LEAD,
    WorkspaceRole.FINANCE_LEAD,
    WorkspaceRole.REGISTRATION_LEAD,
    WorkspaceRole.TECHNICAL_LEAD,
    WorkspaceRole.IT_LEAD,
    WorkspaceRole.VOLUNTEERS_LEAD,
    // Legacy lead-level roles
    WorkspaceRole.VOLUNTEER_MANAGER,
    WorkspaceRole.TECHNICAL_SPECIALIST,
  ];
  
  if (leadRoles.includes(role)) {
    return WorkspaceHierarchyLevel.LEAD;
  }

  // Level 4 - Coordinators (default)
  return WorkspaceHierarchyLevel.COORDINATOR;
}

/**
 * Get human-readable label for a workspace role
 */
export function getWorkspaceRoleLabel(role: WorkspaceRole): string {
  const labels: Record<WorkspaceRole, string> = {
    [WorkspaceRole.WORKSPACE_OWNER]: 'Workspace Owner',
    [WorkspaceRole.DEPARTMENT_MANAGER]: 'Department Manager',
    [WorkspaceRole.TEAM_LEAD]: 'Team Lead',
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
    [WorkspaceRole.VOLUNTEER_MANAGER]: 'Volunteer Manager',
    [WorkspaceRole.TECHNICAL_SPECIALIST]: 'Technical Specialist',
    [WorkspaceRole.GENERAL_VOLUNTEER]: 'General Volunteer',
  };

  return labels[role] || role;
}

/**
 * Check if a role can manage another role based on hierarchy
 */
export function canManageRole(managerRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
  const managerLevel = getWorkspaceRoleLevel(managerRole);
  const targetLevel = getWorkspaceRoleLevel(targetRole);
  
  // Can only manage roles at lower levels (higher number = lower in hierarchy)
  return managerLevel < targetLevel;
}

/**
 * Get all roles that a given role can assign to others
 */
export function getAssignableRoles(role: WorkspaceRole): WorkspaceRole[] {
  const level = getWorkspaceRoleLevel(role);
  
  return Object.values(WorkspaceRole).filter(r => {
    const targetLevel = getWorkspaceRoleLevel(r);
    return targetLevel > level;
  });
}

/**
 * Group roles by hierarchy level for display
 */
export function getRolesByLevel(): Record<WorkspaceHierarchyLevel, WorkspaceRole[]> {
  const result: Record<WorkspaceHierarchyLevel, WorkspaceRole[]> = {
    [WorkspaceHierarchyLevel.OWNER]: [],
    [WorkspaceHierarchyLevel.MANAGER]: [],
    [WorkspaceHierarchyLevel.LEAD]: [],
    [WorkspaceHierarchyLevel.COORDINATOR]: [],
  };

  Object.values(WorkspaceRole).forEach(role => {
    const level = getWorkspaceRoleLevel(role);
    result[level].push(role);
  });

  return result;
}

/**
 * Get the maximum allowed nesting depth for workspaces
 * (matches the 4-level hierarchy)
 */
export const MAX_WORKSPACE_DEPTH = 4;

/**
 * Calculate workspace depth based on parent chain
 */
export function calculateWorkspaceDepth(parentWorkspaceId: string | null, workspaceParentMap: Map<string, string | null>): number {
  if (!parentWorkspaceId) return 1;
  
  let depth = 1;
  let currentParentId: string | null = parentWorkspaceId;
  
  while (currentParentId && depth < MAX_WORKSPACE_DEPTH) {
    depth++;
    currentParentId = workspaceParentMap.get(currentParentId) ?? null;
  }
  
  return depth + 1; // Add 1 for the new workspace being created
}

/**
 * Validate if a workspace can be created at the given parent
 */
export function canCreateSubWorkspace(parentWorkspaceId: string | null, workspaceParentMap: Map<string, string | null>): boolean {
  const depth = calculateWorkspaceDepth(parentWorkspaceId, workspaceParentMap);
  return depth <= MAX_WORKSPACE_DEPTH;
}
