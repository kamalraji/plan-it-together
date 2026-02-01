import { useMemo } from 'react';
import { WorkspaceRole } from '@/types';
import {
  getWorkspaceRoleLevel,
  canManageRole,
  getAssignableRoles,
  WorkspaceHierarchyLevel,
} from '@/lib/workspaceHierarchy';

// Re-export workspace-role mapping utilities for convenience
export {
  HIERARCHY_LEVEL_TO_TYPE,
  TYPE_TO_HIERARCHY_LEVEL,
  getResponsibleRoleForWorkspace,
  getWorkspaceTypeToRoleMapping,
  getAvailableRolesForWorkspaceType,
} from '@/lib/workspaceHierarchy';

export interface WorkspaceRBACResult {
  /** Current user's hierarchy level */
  userLevel: WorkspaceHierarchyLevel;
  /** Check if user can manage a specific role */
  canManage: (targetRole: WorkspaceRole) => boolean;
  /** Check if user can assign a specific role to someone */
  canAssign: (targetRole: WorkspaceRole) => boolean;
  /** Get all roles the user can assign */
  assignableRoles: WorkspaceRole[];
  /** Check if user can edit team member with specific role */
  canEditMember: (memberRole: WorkspaceRole) => boolean;
  /** Check if user can remove team member with specific role */
  canRemoveMember: (memberRole: WorkspaceRole) => boolean;
  /** Check if user can create tasks for a specific role scope */
  canCreateTaskForRole: (roleScope: WorkspaceRole) => boolean;
  /** Check if user is owner level */
  isOwner: boolean;
  /** Check if user is manager level or above */
  isManagerOrAbove: boolean;
  /** Check if user is lead level or above */
  isLeadOrAbove: boolean;
  /** Get permission description for current role */
  permissionDescription: string;
}

/**
 * Hook for workspace role-based access control
 * Enforces the 4-level hierarchy:
 * - Level 1: Owner - can manage all levels
 * - Level 2: Manager - can manage Leads and Coordinators
 * - Level 3: Lead - can only manage Coordinators
 * - Level 4: Coordinator - cannot manage anyone
 */
export function useWorkspaceRBAC(userRole: WorkspaceRole | null): WorkspaceRBACResult {
  return useMemo(() => {
    if (!userRole) {
      return {
        userLevel: WorkspaceHierarchyLevel.COORDINATOR,
        canManage: () => false,
        canAssign: () => false,
        assignableRoles: [],
        canEditMember: () => false,
        canRemoveMember: () => false,
        canCreateTaskForRole: () => false,
        isOwner: false,
        isManagerOrAbove: false,
        isLeadOrAbove: false,
        permissionDescription: 'No permissions',
      };
    }

    const userLevel = getWorkspaceRoleLevel(userRole);
    const assignableRoles = getAssignableRoles(userRole);

    const canManage = (targetRole: WorkspaceRole): boolean => {
      return canManageRole(userRole, targetRole);
    };

    const canAssign = (targetRole: WorkspaceRole): boolean => {
      // Can only assign roles that are below the user's level
      return assignableRoles.includes(targetRole);
    };

    const canEditMember = (memberRole: WorkspaceRole): boolean => {
      // Can edit members at lower hierarchy levels
      return canManageRole(userRole, memberRole);
    };

    const canRemoveMember = (memberRole: WorkspaceRole): boolean => {
      // Can remove members at lower hierarchy levels
      return canManageRole(userRole, memberRole);
    };

    const canCreateTaskForRole = (roleScope: WorkspaceRole): boolean => {
      // Can create tasks for own level or below
      const targetLevel = getWorkspaceRoleLevel(roleScope);
      return userLevel <= targetLevel;
    };

    const isOwner = userLevel === WorkspaceHierarchyLevel.OWNER;
    const isManagerOrAbove = userLevel <= WorkspaceHierarchyLevel.MANAGER;
    const isLeadOrAbove = userLevel <= WorkspaceHierarchyLevel.LEAD;

    const getPermissionDescription = (): string => {
      switch (userLevel) {
        case WorkspaceHierarchyLevel.OWNER:
          return 'Full access: Can manage all team members and settings';
        case WorkspaceHierarchyLevel.MANAGER:
          return 'Can manage Leads and Coordinators within your department';
        case WorkspaceHierarchyLevel.LEAD:
          return 'Can manage Coordinators within your committee';
        case WorkspaceHierarchyLevel.COORDINATOR:
          return 'Task execution only, no team management access';
        default:
          return 'Limited access';
      }
    };

    return {
      userLevel,
      canManage,
      canAssign,
      assignableRoles,
      canEditMember,
      canRemoveMember,
      canCreateTaskForRole,
      isOwner,
      isManagerOrAbove,
      isLeadOrAbove,
      permissionDescription: getPermissionDescription(),
    };
  }, [userRole]);
}

/**
 * Get a human-readable description of what a role can manage
 */
export function getRoleManagementCapabilities(role: WorkspaceRole): string {
  const level = getWorkspaceRoleLevel(role);
  
  switch (level) {
    case WorkspaceHierarchyLevel.OWNER:
      return 'Manages: Department Managers, all Leads, all Coordinators';
    case WorkspaceHierarchyLevel.MANAGER:
      return 'Manages: Leads and Coordinators in department';
    case WorkspaceHierarchyLevel.LEAD:
      return 'Manages: Coordinators in committee only';
    case WorkspaceHierarchyLevel.COORDINATOR:
      return 'No team management access';
    default:
      return 'Unknown';
  }
}

/**
 * Get roles that can manage the given role
 */
export function getRolesThatCanManage(targetRole: WorkspaceRole): WorkspaceRole[] {
  const targetLevel = getWorkspaceRoleLevel(targetRole);
  
  return Object.values(WorkspaceRole).filter(role => {
    const managerLevel = getWorkspaceRoleLevel(role);
    return managerLevel < targetLevel;
  });
}
