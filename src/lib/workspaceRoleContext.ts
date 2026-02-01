import { WorkspaceRole, WorkspaceType } from '@/types';
import { 
  WORKSPACE_DEPARTMENTS, 
  DEPARTMENT_COMMITTEES,
  getWorkspaceRoleLevel,
  WorkspaceHierarchyLevel,
  getWorkspaceRoleLabel
} from './workspaceHierarchy';

export interface WorkspaceContext {
  workspaceType?: WorkspaceType;
  workspaceName: string;
  departmentId?: string;
}

export interface ContextualRoleOption {
  value: WorkspaceRole;
  label: string;
  isPrimary: boolean;      // Is this THE matching role for this workspace?
  isRecommended: boolean;  // Is this a good fit for this workspace?
  group: 'Owner' | 'Managers' | 'Leads' | 'Coordinators';
  description?: string;
}

/**
 * Infer department ID from workspace name
 */
export function inferDepartmentFromWorkspaceName(name: string): string | null {
  const lower = name.toLowerCase();
  
  // Operations department keywords
  if (lower.includes('operations') || lower.includes('event') || 
      lower.includes('logistics') || lower.includes('catering') || 
      lower.includes('facility')) {
    return 'operations';
  }
  
  // Growth department keywords
  if (lower.includes('growth') || lower.includes('marketing') || 
      lower.includes('sponsor') || lower.includes('communication') || 
      lower.includes('social')) {
    return 'growth';
  }
  
  // Content department keywords
  if (lower.includes('content') || lower.includes('speaker') || 
      lower.includes('judge') || lower.includes('media')) {
    return 'content';
  }
  
  // Tech & Finance keywords
  if (lower.includes('tech') || lower.includes('finance') || 
      lower.includes('registration') || lower.includes('it')) {
    return 'tech_finance';
  }
  
  // Volunteers keywords
  if (lower.includes('volunteer')) {
    return 'volunteers';
  }
  
  return null;
}

/**
 * Infer committee roles from workspace name
 */
export function inferCommitteeRolesFromName(name: string): { 
  leadRole: WorkspaceRole; 
  coordinatorRole: WorkspaceRole;
} | null {
  const lower = name.toLowerCase();
  
  // Check all committees across all departments
  for (const [, committees] of Object.entries(DEPARTMENT_COMMITTEES)) {
    for (const committee of committees) {
      if (lower.includes(committee.id) || lower.includes(committee.name.toLowerCase())) {
        return {
          leadRole: committee.leadRole,
          coordinatorRole: committee.coordinatorRole,
        };
      }
    }
  }
  
  // Fallback based on keywords
  if (lower.includes('event')) return { leadRole: WorkspaceRole.EVENT_LEAD, coordinatorRole: WorkspaceRole.EVENT_COORDINATOR };
  if (lower.includes('catering')) return { leadRole: WorkspaceRole.CATERING_LEAD, coordinatorRole: WorkspaceRole.CATERING_COORDINATOR };
  if (lower.includes('logistics')) return { leadRole: WorkspaceRole.LOGISTICS_LEAD, coordinatorRole: WorkspaceRole.LOGISTICS_COORDINATOR };
  if (lower.includes('facility')) return { leadRole: WorkspaceRole.FACILITY_LEAD, coordinatorRole: WorkspaceRole.FACILITY_COORDINATOR };
  if (lower.includes('marketing')) return { leadRole: WorkspaceRole.MARKETING_LEAD, coordinatorRole: WorkspaceRole.MARKETING_COORDINATOR };
  if (lower.includes('communication')) return { leadRole: WorkspaceRole.COMMUNICATION_LEAD, coordinatorRole: WorkspaceRole.COMMUNICATION_COORDINATOR };
  if (lower.includes('sponsor')) return { leadRole: WorkspaceRole.SPONSORSHIP_LEAD, coordinatorRole: WorkspaceRole.SPONSORSHIP_COORDINATOR };
  if (lower.includes('social')) return { leadRole: WorkspaceRole.SOCIAL_MEDIA_LEAD, coordinatorRole: WorkspaceRole.SOCIAL_MEDIA_COORDINATOR };
  if (lower.includes('content')) return { leadRole: WorkspaceRole.CONTENT_LEAD, coordinatorRole: WorkspaceRole.CONTENT_COORDINATOR };
  if (lower.includes('speaker')) return { leadRole: WorkspaceRole.SPEAKER_LIAISON_LEAD, coordinatorRole: WorkspaceRole.SPEAKER_LIAISON_COORDINATOR };
  if (lower.includes('judge')) return { leadRole: WorkspaceRole.JUDGE_LEAD, coordinatorRole: WorkspaceRole.JUDGE_COORDINATOR };
  if (lower.includes('media')) return { leadRole: WorkspaceRole.MEDIA_LEAD, coordinatorRole: WorkspaceRole.MEDIA_COORDINATOR };
  if (lower.includes('finance')) return { leadRole: WorkspaceRole.FINANCE_LEAD, coordinatorRole: WorkspaceRole.FINANCE_COORDINATOR };
  if (lower.includes('registration')) return { leadRole: WorkspaceRole.REGISTRATION_LEAD, coordinatorRole: WorkspaceRole.REGISTRATION_COORDINATOR };
  if (lower.includes('tech') || lower.includes('it')) return { leadRole: WorkspaceRole.TECHNICAL_LEAD, coordinatorRole: WorkspaceRole.TECHNICAL_COORDINATOR };
  if (lower.includes('volunteer')) return { leadRole: WorkspaceRole.VOLUNTEERS_LEAD, coordinatorRole: WorkspaceRole.VOLUNTEER_COORDINATOR };
  
  return null;
}

/**
 * Get all manager roles
 */
function getAllManagerRoles(): WorkspaceRole[] {
  return WORKSPACE_DEPARTMENTS.map(d => d.managerRole);
}

/**
 * Get all lead roles
 */
function getAllLeadRoles(): WorkspaceRole[] {
  return Object.values(DEPARTMENT_COMMITTEES).flat().map(c => c.leadRole);
}

/**
 * Get all coordinator roles
 */
function getAllCoordinatorRoles(): WorkspaceRole[] {
  return Object.values(DEPARTMENT_COMMITTEES).flat().map(c => c.coordinatorRole);
}

/**
 * Get the matching manager role for a department
 */
function getMatchingManagerRole(workspaceName: string): WorkspaceRole | null {
  const deptId = inferDepartmentFromWorkspaceName(workspaceName);
  if (!deptId) return null;
  
  const dept = WORKSPACE_DEPARTMENTS.find(d => d.id === deptId);
  return dept?.managerRole || null;
}

/**
 * Get contextually appropriate roles for a workspace based on its type and name
 */
export function getContextualRolesForWorkspace(
  context: WorkspaceContext,
  inviterRole?: WorkspaceRole | null
): ContextualRoleOption[] {
  const { workspaceType, workspaceName, departmentId } = context;
  const roles: ContextualRoleOption[] = [];
  
  // Infer committee roles from name
  const committeeRoles = inferCommitteeRolesFromName(workspaceName);
  const matchingManagerRole = getMatchingManagerRole(workspaceName);
  const effectiveDeptId = departmentId || inferDepartmentFromWorkspaceName(workspaceName);
  
  // Get inviter's level to filter what they can assign
  const inviterLevel = inviterRole ? getWorkspaceRoleLevel(inviterRole) : WorkspaceHierarchyLevel.OWNER;
  
  switch (workspaceType) {
    case WorkspaceType.ROOT:
      // ROOT workspace can invite all levels
      // Add managers
      if (inviterLevel <= WorkspaceHierarchyLevel.OWNER) {
        getAllManagerRoles().forEach(role => {
          roles.push({
            value: role,
            label: getWorkspaceRoleLabel(role),
            isPrimary: false,
            isRecommended: false,
            group: 'Managers',
          });
        });
      }
      // Add leads
      if (inviterLevel <= WorkspaceHierarchyLevel.MANAGER) {
        getAllLeadRoles().forEach(role => {
          roles.push({
            value: role,
            label: getWorkspaceRoleLabel(role),
            isPrimary: false,
            isRecommended: false,
            group: 'Leads',
          });
        });
      }
      // Add coordinators
      if (inviterLevel <= WorkspaceHierarchyLevel.LEAD) {
        getAllCoordinatorRoles().forEach(role => {
          roles.push({
            value: role,
            label: getWorkspaceRoleLabel(role),
            isPrimary: false,
            isRecommended: false,
            group: 'Coordinators',
          });
        });
      }
      break;
      
    case WorkspaceType.DEPARTMENT:
      // DEPARTMENT workspace: Primary = Manager, plus Leads/Coordinators for that department
      if (matchingManagerRole && inviterLevel <= WorkspaceHierarchyLevel.OWNER) {
        roles.push({
          value: matchingManagerRole,
          label: getWorkspaceRoleLabel(matchingManagerRole),
          isPrimary: true,
          isRecommended: true,
          group: 'Managers',
          description: 'Primary role for this department',
        });
      }
      
      // Add leads and coordinators for this department
      if (effectiveDeptId) {
        const committees = DEPARTMENT_COMMITTEES[effectiveDeptId] || [];
        committees.forEach(committee => {
          if (inviterLevel <= WorkspaceHierarchyLevel.MANAGER) {
            roles.push({
              value: committee.leadRole,
              label: getWorkspaceRoleLabel(committee.leadRole),
              isPrimary: false,
              isRecommended: false,
              group: 'Leads',
            });
          }
          if (inviterLevel <= WorkspaceHierarchyLevel.LEAD) {
            roles.push({
              value: committee.coordinatorRole,
              label: getWorkspaceRoleLabel(committee.coordinatorRole),
              isPrimary: false,
              isRecommended: false,
              group: 'Coordinators',
            });
          }
        });
      }
      break;
      
    case WorkspaceType.COMMITTEE:
      // COMMITTEE workspace: Primary = Lead, Recommended = Coordinator
      if (committeeRoles) {
        if (inviterLevel <= WorkspaceHierarchyLevel.MANAGER) {
          roles.push({
            value: committeeRoles.leadRole,
            label: getWorkspaceRoleLabel(committeeRoles.leadRole),
            isPrimary: true,
            isRecommended: true,
            group: 'Leads',
            description: 'Lead for this committee',
          });
        }
        if (inviterLevel <= WorkspaceHierarchyLevel.LEAD) {
          roles.push({
            value: committeeRoles.coordinatorRole,
            label: getWorkspaceRoleLabel(committeeRoles.coordinatorRole),
            isPrimary: false,
            isRecommended: true,
            group: 'Coordinators',
            description: 'Coordinator for this committee',
          });
        }
      } else {
        // Fallback: show generic lead/coordinator options
        if (inviterLevel <= WorkspaceHierarchyLevel.MANAGER) {
          roles.push({
            value: WorkspaceRole.EVENT_LEAD,
            label: 'Event Lead',
            isPrimary: false,
            isRecommended: true,
            group: 'Leads',
          });
        }
        if (inviterLevel <= WorkspaceHierarchyLevel.LEAD) {
          roles.push({
            value: WorkspaceRole.EVENT_COORDINATOR,
            label: 'Event Coordinator',
            isPrimary: false,
            isRecommended: true,
            group: 'Coordinators',
          });
        }
      }
      break;
      
    case WorkspaceType.TEAM:
      // TEAM workspace: Only coordinators
      if (committeeRoles && inviterLevel <= WorkspaceHierarchyLevel.LEAD) {
        roles.push({
          value: committeeRoles.coordinatorRole,
          label: getWorkspaceRoleLabel(committeeRoles.coordinatorRole),
          isPrimary: true,
          isRecommended: true,
          group: 'Coordinators',
          description: 'Coordinator for this team',
        });
      } else if (inviterLevel <= WorkspaceHierarchyLevel.LEAD) {
        roles.push({
          value: WorkspaceRole.VOLUNTEER_COORDINATOR,
          label: 'Volunteer Coordinator',
          isPrimary: true,
          isRecommended: true,
          group: 'Coordinators',
        });
      }
      break;
      
    default:
      // Unknown type: show all roles based on inviter level
      if (inviterLevel <= WorkspaceHierarchyLevel.MANAGER) {
        getAllLeadRoles().forEach(role => {
          roles.push({
            value: role,
            label: getWorkspaceRoleLabel(role),
            isPrimary: false,
            isRecommended: false,
            group: 'Leads',
          });
        });
      }
      if (inviterLevel <= WorkspaceHierarchyLevel.LEAD) {
        getAllCoordinatorRoles().forEach(role => {
          roles.push({
            value: role,
            label: getWorkspaceRoleLabel(role),
            isPrimary: false,
            isRecommended: false,
            group: 'Coordinators',
          });
        });
      }
      break;
  }
  
  // Remove duplicates
  const seen = new Set<WorkspaceRole>();
  return roles.filter(role => {
    if (seen.has(role.value)) return false;
    seen.add(role.value);
    return true;
  });
}

/**
 * Get the recommended default role for a workspace
 */
export function getDefaultRoleForWorkspace(context: WorkspaceContext): WorkspaceRole {
  const roles = getContextualRolesForWorkspace(context);
  
  // First try to find the primary role
  const primary = roles.find(r => r.isPrimary);
  if (primary) return primary.value;
  
  // Then try recommended
  const recommended = roles.find(r => r.isRecommended);
  if (recommended) return recommended.value;
  
  // Then prefer coordinators (most common)
  const coordinator = roles.find(r => r.group === 'Coordinators');
  if (coordinator) return coordinator.value;
  
  // Fallback
  return roles[0]?.value || WorkspaceRole.VOLUNTEER_COORDINATOR;
}
