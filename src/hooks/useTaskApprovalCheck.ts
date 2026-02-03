import { useMemo, useCallback } from 'react';
import { 
  TaskApprovalPolicy, 
  TaskApprovalRequest, 
  ApprovalLevel 
} from '@/lib/taskApprovalTypes';
import { WorkspaceRole, TaskCategory, TaskPriority } from '@/types';
import { getWorkspaceRoleLevel, WorkspaceHierarchyLevel } from '@/lib/workspaceHierarchy';

interface Task {
  id: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  roleScope?: WorkspaceRole;
  estimatedHours?: number;
}

interface UseTaskApprovalCheckResult {
  /** Check if a task requires approval based on policies */
  checkIfTaskRequiresApproval: (task: Task) => boolean;
  /** Get the applicable policy for a task */
  getApplicablePolicy: (task: Task) => TaskApprovalPolicy | null;
  /** Get users who can approve at the current level */
  getNextApprovers: (request: TaskApprovalRequest) => ApprovalLevel | null;
  /** Check if a user can approve at the current level */
  canUserApprove: (
    request: TaskApprovalRequest,
    userId: string,
    userRole: WorkspaceRole
  ) => boolean;
  /** Check if the user requesting is different from approver (self-approval check) */
  isSelfApproval: (request: TaskApprovalRequest, userId: string) => boolean;
}

/**
 * Hook for checking task approval requirements
 */
export function useTaskApprovalCheck(
  policies: TaskApprovalPolicy[]
): UseTaskApprovalCheckResult {
  
  // Get enabled policies sorted by specificity
  const enabledPolicies = useMemo(() => {
    return policies
      .filter(p => p.isEnabled)
      .sort((a, b) => {
        // More specific policies first (more criteria = more specific)
        const aSpecificity = getSpecificity(a);
        const bSpecificity = getSpecificity(b);
        return bSpecificity - aSpecificity;
      });
  }, [policies]);

  const checkIfTaskRequiresApproval = useCallback((task: Task): boolean => {
    return enabledPolicies.some(policy => matchesPolicy(task, policy));
  }, [enabledPolicies]);

  const getApplicablePolicy = useCallback((task: Task): TaskApprovalPolicy | null => {
    return enabledPolicies.find(policy => matchesPolicy(task, policy)) || null;
  }, [enabledPolicies]);

  const getNextApprovers = useCallback((request: TaskApprovalRequest): ApprovalLevel | null => {
    if (!request.policy?.approvalChain) return null;
    
    const currentLevel = request.currentLevel;
    const chain = request.policy.approvalChain;
    
    // Find the approval level for current level
    return chain.find(level => level.level === currentLevel) || null;
  }, []);

  const canUserApprove = useCallback((
    request: TaskApprovalRequest,
    userId: string,
    userRole: WorkspaceRole
  ): boolean => {
    const approvalLevel = getNextApprovers(request);
    if (!approvalLevel) return false;

    // Check if already decided at this level by this user
    const alreadyDecided = request.decisions.some(
      d => d.approverId === userId && d.level === request.currentLevel
    );
    if (alreadyDecided) return false;

    // Check based on approver type
    switch (approvalLevel.approverType) {
      case 'USER':
        // Check for delegation
        const delegatedToUser = request.decisions.find(
          d => d.decision === 'DELEGATED' && 
               d.delegatedTo === userId &&
               d.level === request.currentLevel
        );
        return approvalLevel.userId === userId || !!delegatedToUser;

      case 'ROLE':
        return approvalLevel.requiredRole === userRole;

      case 'HIERARCHY':
        if (!approvalLevel.hierarchyLevel) return false;
        const userLevel = getWorkspaceRoleLevel(userRole);
        return userLevel <= approvalLevel.hierarchyLevel;

      default:
        return false;
    }
  }, [getNextApprovers]);

  const isSelfApproval = useCallback((
    request: TaskApprovalRequest,
    userId: string
  ): boolean => {
    return request.requestedBy === userId;
  }, []);

  return {
    checkIfTaskRequiresApproval,
    getApplicablePolicy,
    getNextApprovers,
    canUserApprove,
    isSelfApproval,
  };
}

/**
 * Calculate policy specificity score (higher = more specific)
 */
function getSpecificity(policy: TaskApprovalPolicy): number {
  let score = 0;
  
  if (policy.appliesToCategories?.length) score += policy.appliesToCategories.length;
  if (policy.appliesToPriorities?.length) score += policy.appliesToPriorities.length;
  if (policy.appliesToRoleScopes?.length) score += policy.appliesToRoleScopes.length;
  if (policy.minEstimatedHours) score += 1;
  
  // Default policies are least specific
  if (policy.isDefault) score = -1;
  
  return score;
}

/**
 * Check if a task matches a policy's criteria
 */
function matchesPolicy(task: Task, policy: TaskApprovalPolicy): boolean {
  // Default policy matches all tasks
  if (policy.isDefault) return true;

  // Check categories
  if (policy.appliesToCategories?.length) {
    if (!task.category || !policy.appliesToCategories.includes(task.category)) {
      return false;
    }
  }

  // Check priorities
  if (policy.appliesToPriorities?.length) {
    if (!task.priority || !policy.appliesToPriorities.includes(task.priority)) {
      return false;
    }
  }

  // Check role scopes
  if (policy.appliesToRoleScopes?.length) {
    if (!task.roleScope || !policy.appliesToRoleScopes.includes(task.roleScope)) {
      return false;
    }
  }

  // Check estimated hours
  if (policy.minEstimatedHours !== undefined && policy.minEstimatedHours > 0) {
    if (!task.estimatedHours || task.estimatedHours < policy.minEstimatedHours) {
      return false;
    }
  }

  // If no specific criteria, don't match (unless default)
  const hasCriteria = 
    (policy.appliesToCategories?.length ?? 0) > 0 ||
    (policy.appliesToPriorities?.length ?? 0) > 0 ||
    (policy.appliesToRoleScopes?.length ?? 0) > 0 ||
    (policy.minEstimatedHours ?? 0) > 0;

  return hasCriteria;
}

/**
 * Get display text for an approval level
 */
export function getApprovalLevelDisplay(level: ApprovalLevel): string {
  switch (level.approverType) {
    case 'USER':
      return level.userName || 'Specific User';
    case 'ROLE':
      return `Role: ${formatRole(level.requiredRole)}`;
    case 'HIERARCHY':
      return `${formatHierarchyLevel(level.hierarchyLevel)} or above`;
    default:
      return 'Unknown';
  }
}

function formatRole(role?: WorkspaceRole): string {
  if (!role) return 'Unknown';
  return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatHierarchyLevel(level?: WorkspaceHierarchyLevel): string {
  switch (level) {
    case WorkspaceHierarchyLevel.OWNER:
      return 'Owner';
    case WorkspaceHierarchyLevel.MANAGER:
      return 'Manager';
    case WorkspaceHierarchyLevel.LEAD:
      return 'Lead';
    case WorkspaceHierarchyLevel.COORDINATOR:
      return 'Coordinator';
    default:
      return 'Unknown';
  }
}
