import { TaskStatus, TaskPriority, TaskCategory, WorkspaceRole } from '@/types';

// Trigger types
export type AutomationTrigger = 
  | 'DUE_DATE_APPROACHING'    // X hours before due date
  | 'DEPENDENCY_COMPLETED'    // All blocking tasks completed
  | 'STATUS_CHANGED'          // Task status changed to specific value
  | 'TASK_CREATED'            // New task created matching conditions
  | 'SUBTASKS_COMPLETED'      // All subtasks marked complete
  | 'OVERDUE'                 // Task passed due date
  | 'ASSIGNED'                // Task assigned to someone
  | 'UNASSIGNED';             // Task unassigned

// Action types
export type AutomationAction =
  | 'CHANGE_STATUS'           // Auto-change task status
  | 'SEND_NOTIFICATION'       // Send notification to assignees/creator
  | 'AUTO_ASSIGN'             // Assign to specific user or role
  | 'UPDATE_PRIORITY'         // Change priority level
  | 'ADD_TAG'                 // Add tag to task
  | 'REMOVE_TAG'              // Remove tag from task
  | 'SET_BLOCKED';            // Mark task as blocked

// Trigger configuration
export interface TriggerConfig {
  hoursBeforeDue?: number;       // For DUE_DATE_APPROACHING
  fromStatus?: TaskStatus;       // For STATUS_CHANGED
  toStatus?: TaskStatus;         // For STATUS_CHANGED
}

// Action configuration
export interface ActionConfig {
  newStatus?: TaskStatus;        // For CHANGE_STATUS
  notificationTitle?: string;    // For SEND_NOTIFICATION
  notificationMessage?: string;  // For SEND_NOTIFICATION
  notifyAssignees?: boolean;     // For SEND_NOTIFICATION
  notifyCreator?: boolean;       // For SEND_NOTIFICATION
  assignToUserId?: string;       // For AUTO_ASSIGN
  assignToRole?: WorkspaceRole;  // For AUTO_ASSIGN
  newPriority?: TaskPriority;    // For UPDATE_PRIORITY
  tag?: string;                  // For ADD_TAG / REMOVE_TAG
}

// Filtering conditions
export interface AutomationConditions {
  priority?: TaskPriority[];
  category?: TaskCategory[];
  status?: TaskStatus[];
  hasAssignee?: boolean;
}

// Full automation rule
export interface AutomationRule {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  triggerType: AutomationTrigger;
  triggerConfig: TriggerConfig;
  actionType: AutomationAction;
  actionConfig: ActionConfig;
  conditions?: AutomationConditions;
  isEnabled: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Execution log
export interface AutomationExecutionLog {
  id: string;
  ruleId: string;
  taskId: string;
  triggeredAt: string;
  actionTaken: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

// Trigger display info
export const TRIGGER_INFO: Record<AutomationTrigger, { label: string; description: string; icon: string }> = {
  DUE_DATE_APPROACHING: {
    label: 'Due Date Approaching',
    description: 'Triggers X hours before a task is due',
    icon: 'Clock',
  },
  DEPENDENCY_COMPLETED: {
    label: 'Dependencies Completed',
    description: 'Triggers when all blocking tasks are completed',
    icon: 'Link',
  },
  STATUS_CHANGED: {
    label: 'Status Changed',
    description: 'Triggers when task status changes',
    icon: 'RefreshCw',
  },
  TASK_CREATED: {
    label: 'Task Created',
    description: 'Triggers when a new task is created',
    icon: 'Plus',
  },
  SUBTASKS_COMPLETED: {
    label: 'Subtasks Completed',
    description: 'Triggers when all subtasks are done',
    icon: 'CheckSquare',
  },
  OVERDUE: {
    label: 'Task Overdue',
    description: 'Triggers when a task passes its due date',
    icon: 'AlertTriangle',
  },
  ASSIGNED: {
    label: 'Task Assigned',
    description: 'Triggers when a task is assigned to someone',
    icon: 'UserPlus',
  },
  UNASSIGNED: {
    label: 'Task Unassigned',
    description: 'Triggers when assignee is removed',
    icon: 'UserMinus',
  },
};

// Action display info
export const ACTION_INFO: Record<AutomationAction, { label: string; description: string; icon: string }> = {
  CHANGE_STATUS: {
    label: 'Change Status',
    description: 'Automatically update the task status',
    icon: 'RefreshCw',
  },
  SEND_NOTIFICATION: {
    label: 'Send Notification',
    description: 'Notify assignees or creator',
    icon: 'Bell',
  },
  AUTO_ASSIGN: {
    label: 'Auto-Assign',
    description: 'Assign task to a user or role',
    icon: 'UserCheck',
  },
  UPDATE_PRIORITY: {
    label: 'Update Priority',
    description: 'Change the task priority level',
    icon: 'Flag',
  },
  ADD_TAG: {
    label: 'Add Tag',
    description: 'Add a tag to the task',
    icon: 'Tag',
  },
  REMOVE_TAG: {
    label: 'Remove Tag',
    description: 'Remove a tag from the task',
    icon: 'XCircle',
  },
  SET_BLOCKED: {
    label: 'Set Blocked',
    description: 'Mark the task as blocked',
    icon: 'Ban',
  },
};

// Preset automation templates
export const AUTOMATION_PRESETS: Array<{
  name: string;
  description: string;
  triggerType: AutomationTrigger;
  triggerConfig: TriggerConfig;
  actionType: AutomationAction;
  actionConfig: ActionConfig;
}> = [
  {
    name: 'Remind Before Due',
    description: 'Send notification 24 hours before due date',
    triggerType: 'DUE_DATE_APPROACHING',
    triggerConfig: { hoursBeforeDue: 24 },
    actionType: 'SEND_NOTIFICATION',
    actionConfig: {
      notificationTitle: 'Task Due Soon',
      notificationMessage: 'Your task is due in 24 hours',
      notifyAssignees: true,
    },
  },
  {
    name: 'Unblock When Dependencies Met',
    description: 'Move task to In Progress when all dependencies complete',
    triggerType: 'DEPENDENCY_COMPLETED',
    triggerConfig: {},
    actionType: 'CHANGE_STATUS',
    actionConfig: { newStatus: TaskStatus.IN_PROGRESS },
  },
  {
    name: 'Escalate Overdue Tasks',
    description: 'Set priority to Urgent when task becomes overdue',
    triggerType: 'OVERDUE',
    triggerConfig: {},
    actionType: 'UPDATE_PRIORITY',
    actionConfig: { newPriority: TaskPriority.URGENT },
  },
  {
    name: 'Notify on High Priority Assignment',
    description: 'Send notification when high priority task is assigned',
    triggerType: 'ASSIGNED',
    triggerConfig: {},
    actionType: 'SEND_NOTIFICATION',
    actionConfig: {
      notificationTitle: 'High Priority Task Assigned',
      notificationMessage: 'You have been assigned a high priority task',
      notifyAssignees: true,
    },
  },
  {
    name: 'Auto-Review When Complete',
    description: 'Move to Review when status changes to Completed',
    triggerType: 'STATUS_CHANGED',
    triggerConfig: { toStatus: TaskStatus.COMPLETED },
    actionType: 'CHANGE_STATUS',
    actionConfig: { newStatus: TaskStatus.REVIEW_REQUIRED },
  },
];
