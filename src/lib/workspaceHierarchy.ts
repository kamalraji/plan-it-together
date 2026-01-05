import { WorkspaceRole, WorkspaceType } from '@/types';

/**
 * Workspace Hierarchy Level Definitions
 * 
 * Level 1: Workspace Owner - Full control & oversight (ROOT)
 * Level 2: Department Managers - Department strategy, KPIs (DEPARTMENT)
 * Level 3: Team Leads - Committee execution (COMMITTEE)
 * Level 4: Coordinators - Task execution (TEAM)
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
  { id: 'operations', name: 'Operations', description: 'Event logistics, catering, facilities', managerRole: WorkspaceRole.OPERATIONS_MANAGER },
  { id: 'growth', name: 'Growth', description: 'Marketing, sponsorship, communications', managerRole: WorkspaceRole.GROWTH_MANAGER },
  { id: 'content', name: 'Content', description: 'Content creation, speakers, judges, media', managerRole: WorkspaceRole.CONTENT_MANAGER },
  { id: 'tech_finance', name: 'Tech & Finance', description: 'Technical, IT, finance, registration', managerRole: WorkspaceRole.TECH_FINANCE_MANAGER },
  { id: 'volunteers', name: 'Volunteers', description: 'Volunteer coordination and management', managerRole: WorkspaceRole.VOLUNTEERS_MANAGER },
] as const;

export type DepartmentId = typeof WORKSPACE_DEPARTMENTS[number]['id'];

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
 * Get the next workspace type based on current type
 */
export function getNextWorkspaceType(currentType: WorkspaceType | undefined): WorkspaceType | null {
  switch (currentType) {
    case WorkspaceType.ROOT:
      return WorkspaceType.DEPARTMENT;
    case WorkspaceType.DEPARTMENT:
      return WorkspaceType.COMMITTEE;
    case WorkspaceType.COMMITTEE:
      return WorkspaceType.TEAM;
    case WorkspaceType.TEAM:
      return null; // Cannot create below TEAM
    default:
      return WorkspaceType.DEPARTMENT; // Default for undefined/legacy
  }
}

/**
 * Get workspace type label for display
 */
export function getWorkspaceTypeLabel(type: WorkspaceType | undefined): string {
  switch (type) {
    case WorkspaceType.ROOT:
      return 'Workspace';
    case WorkspaceType.DEPARTMENT:
      return 'Department';
    case WorkspaceType.COMMITTEE:
      return 'Committee';
    case WorkspaceType.TEAM:
      return 'Team';
    default:
      return 'Workspace';
  }
}

/**
 * Get creation button label based on parent workspace type
 */
export function getCreateButtonLabel(parentType: WorkspaceType | undefined): string {
  const nextType = getNextWorkspaceType(parentType);
  if (!nextType) return '';
  
  switch (nextType) {
    case WorkspaceType.DEPARTMENT:
      return 'Add Department';
    case WorkspaceType.COMMITTEE:
      return 'Add Committee';
    case WorkspaceType.TEAM:
      return 'Add Team';
    default:
      return 'Add Sub-Workspace';
  }
}

/**
 * Check if workspace can have children
 */
export function canHaveChildren(type: WorkspaceType | undefined): boolean {
  return type !== WorkspaceType.TEAM;
}

/**
 * Get available creation options based on parent workspace type and department
 */
export function getCreationOptions(
  parentType: WorkspaceType | undefined,
  parentDepartmentId?: string
): {
  nextType: WorkspaceType | null;
  options: { id: string; name: string; description?: string }[] | null;
  allowCustomName: boolean;
} {
  const nextType = getNextWorkspaceType(parentType);
  
  if (!nextType) {
    return { nextType: null, options: null, allowCustomName: false };
  }
  
  switch (nextType) {
    case WorkspaceType.DEPARTMENT:
      return {
        nextType,
        options: WORKSPACE_DEPARTMENTS.map(d => ({
          id: d.id,
          name: d.name,
          description: d.description,
        })),
        allowCustomName: false,
      };
    case WorkspaceType.COMMITTEE:
      const committees = parentDepartmentId ? DEPARTMENT_COMMITTEES[parentDepartmentId] : [];
      return {
        nextType,
        options: committees?.map(c => ({ id: c.id, name: c.name })) || [],
        allowCustomName: false,
      };
    case WorkspaceType.TEAM:
      return {
        nextType,
        options: null, // Free-form naming
        allowCustomName: true,
      };
    default:
      return { nextType: null, options: null, allowCustomName: false };
  }
}

/**
 * Map roles to their hierarchy level
 */
export function getWorkspaceRoleLevel(role: WorkspaceRole): WorkspaceHierarchyLevel {
  // Level 1 - Owner
  if (role === WorkspaceRole.WORKSPACE_OWNER) {
    return WorkspaceHierarchyLevel.OWNER;
  }

  // Level 2 - Department Managers
  const managerRoles: WorkspaceRole[] = [
    WorkspaceRole.OPERATIONS_MANAGER,
    WorkspaceRole.GROWTH_MANAGER,
    WorkspaceRole.CONTENT_MANAGER,
    WorkspaceRole.TECH_FINANCE_MANAGER,
    WorkspaceRole.VOLUNTEERS_MANAGER,
  ];
  
  if (managerRoles.includes(role)) {
    return WorkspaceHierarchyLevel.MANAGER;
  }

  // Level 3 - Leads
  const leadRoles: WorkspaceRole[] = [
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
    [WorkspaceRole.OPERATIONS_MANAGER]: 'Operations Manager',
    [WorkspaceRole.GROWTH_MANAGER]: 'Growth Manager',
    [WorkspaceRole.CONTENT_MANAGER]: 'Content Manager',
    [WorkspaceRole.TECH_FINANCE_MANAGER]: 'Tech & Finance Manager',
    [WorkspaceRole.VOLUNTEERS_MANAGER]: 'Volunteers Manager',
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

/**
 * Maps workspace type (level) to the corresponding role category
 * 
 * Workspace Level → Role Mapping:
 * - ROOT (L1) → WORKSPACE_OWNER
 * - DEPARTMENT (L2) → Department-specific Managers
 * - COMMITTEE (L3) → Committee-specific Leads
 * - TEAM (L4) → Committee-specific Coordinators
 */
export function getWorkspaceTypeToRoleMapping(workspaceType: WorkspaceType): {
  level: WorkspaceHierarchyLevel;
  primaryRole: WorkspaceRole | null;
  roleCategory: string;
  description: string;
} {
  switch (workspaceType) {
    case WorkspaceType.ROOT:
      return {
        level: WorkspaceHierarchyLevel.OWNER,
        primaryRole: WorkspaceRole.WORKSPACE_OWNER,
        roleCategory: 'Owner',
        description: 'Full control & oversight of the entire event workspace',
      };
    case WorkspaceType.DEPARTMENT:
      return {
        level: WorkspaceHierarchyLevel.MANAGER,
        primaryRole: null, // Depends on department type
        roleCategory: 'Department Manager',
        description: 'Department strategy, KPIs, and committee oversight',
      };
    case WorkspaceType.COMMITTEE:
      return {
        level: WorkspaceHierarchyLevel.LEAD,
        primaryRole: null, // Depends on committee type
        roleCategory: 'Committee Lead',
        description: 'Committee execution and coordinator management',
      };
    case WorkspaceType.TEAM:
      return {
        level: WorkspaceHierarchyLevel.COORDINATOR,
        primaryRole: null, // Depends on parent committee
        roleCategory: 'Coordinator',
        description: 'Task execution and delivery',
      };
    default:
      return {
        level: WorkspaceHierarchyLevel.COORDINATOR,
        primaryRole: null,
        roleCategory: 'Member',
        description: 'Workspace member',
      };
  }
}

/**
 * Get the responsible role for a workspace based on its type and context
 */
export function getResponsibleRoleForWorkspace(
  workspaceType: WorkspaceType,
  departmentId?: string,
  committeeId?: string
): WorkspaceRole | null {
  switch (workspaceType) {
    case WorkspaceType.ROOT:
      return WorkspaceRole.WORKSPACE_OWNER;
      
    case WorkspaceType.DEPARTMENT:
      // Return department-specific manager role
      const department = WORKSPACE_DEPARTMENTS.find(d => d.id === departmentId);
      return department?.managerRole || null;
      
    case WorkspaceType.COMMITTEE:
      // Return committee-specific lead role
      if (departmentId && committeeId) {
        const committees = DEPARTMENT_COMMITTEES[departmentId];
        const committee = committees?.find(c => c.id === committeeId);
        return committee?.leadRole || null;
      }
      return null;
      
    case WorkspaceType.TEAM:
      // Return committee-specific coordinator role
      if (departmentId && committeeId) {
        const committees = DEPARTMENT_COMMITTEES[departmentId];
        const committee = committees?.find(c => c.id === committeeId);
        return committee?.coordinatorRole || null;
      }
      return null;
      
    default:
      return null;
  }
}

/**
 * Get roles available for a specific workspace type
 */
export function getAvailableRolesForWorkspaceType(
  workspaceType: WorkspaceType,
  departmentId?: string
): WorkspaceRole[] {
  switch (workspaceType) {
    case WorkspaceType.ROOT:
      return [WorkspaceRole.WORKSPACE_OWNER];
      
    case WorkspaceType.DEPARTMENT:
      return WORKSPACE_DEPARTMENTS.map(d => d.managerRole);
      
    case WorkspaceType.COMMITTEE:
      if (departmentId) {
        const committees = DEPARTMENT_COMMITTEES[departmentId];
        return committees?.map(c => c.leadRole) || [];
      }
      // Return all lead roles if no department specified
      return Object.values(DEPARTMENT_COMMITTEES).flat().map(c => c.leadRole);
      
    case WorkspaceType.TEAM:
      if (departmentId) {
        const committees = DEPARTMENT_COMMITTEES[departmentId];
        return committees?.map(c => c.coordinatorRole) || [];
      }
      // Return all coordinator roles if no department specified
      return Object.values(DEPARTMENT_COMMITTEES).flat().map(c => c.coordinatorRole);
      
    default:
      return [];
  }
}

/**
 * Mapping of workspace hierarchy level to workspace type
 */
export const HIERARCHY_LEVEL_TO_TYPE: Record<WorkspaceHierarchyLevel, WorkspaceType> = {
  [WorkspaceHierarchyLevel.OWNER]: WorkspaceType.ROOT,
  [WorkspaceHierarchyLevel.MANAGER]: WorkspaceType.DEPARTMENT,
  [WorkspaceHierarchyLevel.LEAD]: WorkspaceType.COMMITTEE,
  [WorkspaceHierarchyLevel.COORDINATOR]: WorkspaceType.TEAM,
};

/**
 * Mapping of workspace type to hierarchy level
 */
export const TYPE_TO_HIERARCHY_LEVEL: Record<WorkspaceType, WorkspaceHierarchyLevel> = {
  [WorkspaceType.ROOT]: WorkspaceHierarchyLevel.OWNER,
  [WorkspaceType.DEPARTMENT]: WorkspaceHierarchyLevel.MANAGER,
  [WorkspaceType.COMMITTEE]: WorkspaceHierarchyLevel.LEAD,
  [WorkspaceType.TEAM]: WorkspaceHierarchyLevel.COORDINATOR,
};
