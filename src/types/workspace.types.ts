/**
 * Consolidated workspace types
 * Single source of truth for workspace-related type definitions
 */

export type WorkspaceType = 
  | 'ROOT'
  | 'DEPARTMENT'
  | 'COMMITTEE'
  | 'TEAM';

export type WorkspaceTab = 
  | 'overview'
  | 'tasks'
  | 'announcements'
  | 'members'
  | 'budget'
  | 'resources'
  | 'timeline'
  | 'communication'
  | 'files'
  | 'event-space'
  | 'settings';

export type TaskStatus = 
  | 'TODO'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'BLOCKED'
  | 'DONE';

export type TaskPriority = 
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'URGENT';

export type ApprovalStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ESCALATED';

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceMemberRole;
  permissions?: WorkspacePermissions;
  joinedAt: string;
  // Resolved user data
  user?: {
    id: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
  };
}

export type WorkspaceMemberRole = 
  | 'OWNER'
  | 'ADMIN'
  | 'LEAD'
  | 'MEMBER'
  | 'VIEWER';

export interface WorkspacePermissions {
  canManageTasks?: boolean;
  canManageMembers?: boolean;
  canManageBudget?: boolean;
  canManageResources?: boolean;
  canApprove?: boolean;
  canEditSettings?: boolean;
  canViewAnalytics?: boolean;
}

export interface WorkspaceTask {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  // Dependencies
  dependsOn?: string[];
  blockedBy?: string[];
  // Metadata
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  // Resolved data
  assignee?: WorkspaceMember['user'];
  subtasks?: WorkspaceSubtask[];
}

export interface WorkspaceSubtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface WorkspaceBudgetRequest {
  id: string;
  workspaceId: string;
  requesterId: string;
  amount: number;
  purpose: string;
  category: string;
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  // Resolved data
  requester?: WorkspaceMember['user'];
  approver?: WorkspaceMember['user'];
}

export interface WorkspaceResourceRequest {
  id: string;
  workspaceId: string;
  requesterId: string;
  resourceType: string;
  resourceName: string;
  quantity: number;
  reason: string;
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  // Resolved data
  requester?: WorkspaceMember['user'];
  approver?: WorkspaceMember['user'];
}

export interface WorkspaceAnnouncement {
  id: string;
  workspaceId: string;
  authorId: string;
  title: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isPinned: boolean;
  publishedAt: string;
  expiresAt?: string;
  // Resolved data
  author?: WorkspaceMember['user'];
  readBy?: string[];
}

export interface WorkspaceHierarchy {
  id: string;
  name: string;
  type: WorkspaceType;
  parentId?: string;
  children?: WorkspaceHierarchy[];
  depth: number;
  path: string[];
}

/**
 * Query key factory for workspace-related queries
 */
export const workspaceQueryKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceQueryKeys.all, 'list'] as const,
  list: (eventId: string) => [...workspaceQueryKeys.lists(), eventId] as const,
  details: () => [...workspaceQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...workspaceQueryKeys.details(), id] as const,
  hierarchy: (eventId: string) => [...workspaceQueryKeys.all, 'hierarchy', eventId] as const,
  tasks: (workspaceId: string) => [...workspaceQueryKeys.detail(workspaceId), 'tasks'] as const,
  task: (workspaceId: string, taskId: string) => 
    [...workspaceQueryKeys.tasks(workspaceId), taskId] as const,
  members: (workspaceId: string) => [...workspaceQueryKeys.detail(workspaceId), 'members'] as const,
  budget: (workspaceId: string) => [...workspaceQueryKeys.detail(workspaceId), 'budget'] as const,
  resources: (workspaceId: string) => [...workspaceQueryKeys.detail(workspaceId), 'resources'] as const,
  announcements: (workspaceId: string) => 
    [...workspaceQueryKeys.detail(workspaceId), 'announcements'] as const,
};

/**
 * Type guard to check if workspace is at a specific level
 */
export function isWorkspaceType(type: string, expected: WorkspaceType): boolean {
  return type === expected;
}

/**
 * Get workspace level depth from type
 */
export function getWorkspaceDepth(type: WorkspaceType): number {
  switch (type) {
    case 'ROOT':
      return 0;
    case 'DEPARTMENT':
      return 1;
    case 'COMMITTEE':
      return 2;
    case 'TEAM':
      return 3;
    default:
      return -1;
  }
}

/**
 * Check if user has permission for an action
 */
export function hasWorkspacePermission(
  role: WorkspaceMemberRole,
  action: keyof WorkspacePermissions
): boolean {
  const rolePermissions: Record<WorkspaceMemberRole, WorkspacePermissions> = {
    OWNER: {
      canManageTasks: true,
      canManageMembers: true,
      canManageBudget: true,
      canManageResources: true,
      canApprove: true,
      canEditSettings: true,
      canViewAnalytics: true,
    },
    ADMIN: {
      canManageTasks: true,
      canManageMembers: true,
      canManageBudget: true,
      canManageResources: true,
      canApprove: true,
      canEditSettings: true,
      canViewAnalytics: true,
    },
    LEAD: {
      canManageTasks: true,
      canManageMembers: false,
      canManageBudget: false,
      canManageResources: true,
      canApprove: false,
      canEditSettings: false,
      canViewAnalytics: true,
    },
    MEMBER: {
      canManageTasks: true,
      canManageMembers: false,
      canManageBudget: false,
      canManageResources: false,
      canApprove: false,
      canEditSettings: false,
      canViewAnalytics: false,
    },
    VIEWER: {
      canManageTasks: false,
      canManageMembers: false,
      canManageBudget: false,
      canManageResources: false,
      canApprove: false,
      canEditSettings: false,
      canViewAnalytics: false,
    },
  };

  return rolePermissions[role]?.[action] ?? false;
}
