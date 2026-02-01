import { WorkspaceRole, TaskCategory, TaskPriority, TaskStatus } from '@/types';
import { WorkspaceHierarchyLevel } from './workspaceHierarchy';

/**
 * Type of approver for an approval level
 */
export type ApproverType = 'ROLE' | 'USER' | 'HIERARCHY';

/**
 * Decision options for approvers
 */
export type ApprovalDecision = 'APPROVED' | 'REJECTED' | 'DELEGATED';

/**
 * Overall status of an approval request
 */
export type ApprovalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

/**
 * Task approval status on the task itself
 */
export type TaskApprovalStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Single level in an approval chain
 */
export interface ApprovalLevel {
  level: number;
  approverType: ApproverType;
  /** For ROLE type: specific role required */
  requiredRole?: WorkspaceRole;
  /** For USER type: specific user ID */
  userId?: string;
  userName?: string;
  /** For HIERARCHY type: minimum hierarchy level */
  hierarchyLevel?: WorkspaceHierarchyLevel;
  /** Any user at this level can approve (vs specific user) */
  anyoneAtLevel?: boolean;
  /** Send notification when escalated to this level */
  notifyOnEscalation?: boolean;
}

/**
 * Criteria for matching tasks to policies
 */
export interface PolicyCriteria {
  categories?: TaskCategory[];
  priorities?: TaskPriority[];
  roleScopes?: WorkspaceRole[];
  minEstimatedHours?: number;
  isDefault?: boolean;
}

/**
 * Task Approval Policy - configurable rules for when tasks need approval
 */
export interface TaskApprovalPolicy {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  /** Matching criteria */
  appliesToCategories?: TaskCategory[];
  appliesToPriorities?: TaskPriority[];
  appliesToRoleScopes?: WorkspaceRole[];
  minEstimatedHours?: number;
  isDefault: boolean;
  /** Approval chain configuration */
  approvalChain: ApprovalLevel[];
  requireAllLevels: boolean;
  allowSelfApproval: boolean;
  autoApproveAfterHours?: number;
  isEnabled: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Individual decision by an approver
 */
export interface TaskApprovalDecision {
  id: string;
  requestId: string;
  approverId: string;
  approver?: {
    id: string;
    name: string;
    avatarUrl?: string;
    role: WorkspaceRole;
  };
  approverRole: WorkspaceRole;
  level: number;
  decision: ApprovalDecision;
  notes?: string;
  decidedAt: string;
  delegatedTo?: string;
  delegatedToUser?: {
    id: string;
    name: string;
  };
  delegatedReason?: string;
}

/**
 * Approval request for a specific task
 */
export interface TaskApprovalRequest {
  id: string;
  taskId: string;
  task?: {
    id: string;
    title: string;
    category?: TaskCategory;
    priority?: TaskPriority;
    status: TaskStatus;
  };
  policyId?: string;
  policy?: TaskApprovalPolicy;
  requestedBy: string;
  requester?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  requestedAt: string;
  currentLevel: number;
  overallStatus: ApprovalRequestStatus;
  completedAt?: string;
  finalDecisionBy?: string;
  finalDecisionNotes?: string;
  originalStatus: TaskStatus;
  targetStatus: TaskStatus;
  decisions: TaskApprovalDecision[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Form data for creating/editing a policy
 */
export interface ApprovalPolicyFormData {
  name: string;
  description?: string;
  appliesToCategories?: TaskCategory[];
  appliesToPriorities?: TaskPriority[];
  appliesToRoleScopes?: WorkspaceRole[];
  minEstimatedHours?: number;
  isDefault: boolean;
  approvalChain: ApprovalLevel[];
  requireAllLevels: boolean;
  allowSelfApproval: boolean;
  autoApproveAfterHours?: number;
  isEnabled: boolean;
}

/**
 * Display info for approval levels
 */
export const APPROVER_TYPE_INFO: Record<ApproverType, { label: string; description: string }> = {
  ROLE: {
    label: 'By Role',
    description: 'Any user with the specified role can approve',
  },
  USER: {
    label: 'Specific User',
    description: 'Only the designated user can approve',
  },
  HIERARCHY: {
    label: 'By Hierarchy Level',
    description: 'Any user at or above the hierarchy level can approve',
  },
};

/**
 * Display info for decisions
 */
export const DECISION_INFO: Record<ApprovalDecision, { label: string; icon: string; color: string }> = {
  APPROVED: {
    label: 'Approved',
    icon: 'CheckCircle',
    color: 'text-green-600',
  },
  REJECTED: {
    label: 'Rejected',
    icon: 'XCircle',
    color: 'text-red-600',
  },
  DELEGATED: {
    label: 'Delegated',
    icon: 'ArrowRight',
    color: 'text-blue-600',
  },
};

/**
 * Display info for request status
 */
export const REQUEST_STATUS_INFO: Record<ApprovalRequestStatus, { label: string; icon: string; color: string }> = {
  PENDING: {
    label: 'Pending Approval',
    icon: 'Clock',
    color: 'text-amber-600',
  },
  APPROVED: {
    label: 'Approved',
    icon: 'CheckCircle',
    color: 'text-green-600',
  },
  REJECTED: {
    label: 'Rejected',
    icon: 'XCircle',
    color: 'text-red-600',
  },
  EXPIRED: {
    label: 'Expired',
    icon: 'AlertCircle',
    color: 'text-muted-foreground',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: 'Ban',
    color: 'text-muted-foreground',
  },
};
