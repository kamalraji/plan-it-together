import { supabase } from '@/integrations/supabase/client';
import { ActivityType } from './commentTypes';

interface LogActivityParams {
  taskId: string;
  userId: string;
  activityType: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
}

export async function logTaskActivity({
  taskId,
  userId,
  activityType,
  description,
  metadata = {},
}: LogActivityParams): Promise<void> {
  try {
    const { error } = await supabase.from('task_activities').insert([{
      task_id: taskId,
      user_id: userId,
      activity_type: activityType,
      description,
      metadata: metadata as Record<string, string | number | boolean | null | undefined>,
    }]);

    if (error) {
      // Activity logging failed - non-critical
    }
  } catch {
    // Activity logging failed - non-critical
  }
}

export function logStatusChange(
  taskId: string,
  userId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  return logTaskActivity({
    taskId,
    userId,
    activityType: 'status_changed',
    description: `Changed status from ${formatStatus(oldStatus)} to ${formatStatus(newStatus)}`,
    metadata: { old_status: oldStatus, new_status: newStatus },
  });
}

export function logAssignmentChange(
  taskId: string,
  userId: string,
  oldAssignee: string | null,
  newAssignee: string | null,
  oldAssigneeName?: string,
  newAssigneeName?: string
): Promise<void> {
  if (newAssignee && !oldAssignee) {
    return logTaskActivity({
      taskId,
      userId,
      activityType: 'assigned',
      description: `Assigned to ${newAssigneeName || 'a team member'}`,
      metadata: { new_assignee: newAssignee, new_assignee_name: newAssigneeName },
    });
  } else if (!newAssignee && oldAssignee) {
    return logTaskActivity({
      taskId,
      userId,
      activityType: 'unassigned',
      description: `Unassigned from ${oldAssigneeName || 'team member'}`,
      metadata: { old_assignee: oldAssignee, old_assignee_name: oldAssigneeName },
    });
  } else {
    return logTaskActivity({
      taskId,
      userId,
      activityType: 'assigned',
      description: `Reassigned from ${oldAssigneeName || 'unknown'} to ${newAssigneeName || 'unknown'}`,
      metadata: {
        old_assignee: oldAssignee,
        new_assignee: newAssignee,
        old_assignee_name: oldAssigneeName,
        new_assignee_name: newAssigneeName,
      },
    });
  }
}

export function logPriorityChange(
  taskId: string,
  userId: string,
  oldPriority: string,
  newPriority: string
): Promise<void> {
  return logTaskActivity({
    taskId,
    userId,
    activityType: 'priority_changed',
    description: `Changed priority from ${formatPriority(oldPriority)} to ${formatPriority(newPriority)}`,
    metadata: { old_priority: oldPriority, new_priority: newPriority },
  });
}

export function logDueDateChange(
  taskId: string,
  userId: string,
  oldDate: string | null,
  newDate: string | null
): Promise<void> {
  const oldFormatted = oldDate ? new Date(oldDate).toLocaleDateString() : 'none';
  const newFormatted = newDate ? new Date(newDate).toLocaleDateString() : 'none';

  return logTaskActivity({
    taskId,
    userId,
    activityType: 'due_date_changed',
    description: `Changed due date from ${oldFormatted} to ${newFormatted}`,
    metadata: { old_due_date: oldDate, new_due_date: newDate },
  });
}

export function logTaskCreated(
  taskId: string,
  userId: string,
  taskTitle: string
): Promise<void> {
  return logTaskActivity({
    taskId,
    userId,
    activityType: 'created',
    description: `Created task "${taskTitle}"`,
    metadata: { task_title: taskTitle },
  });
}

export function logCommentAdded(
  taskId: string,
  userId: string
): Promise<void> {
  return logTaskActivity({
    taskId,
    userId,
    activityType: 'comment_added',
    description: 'Added a comment',
    metadata: {},
  });
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
}

function formatPriority(priority: string): string {
  return priority.toLowerCase().replace(/^\w/, c => c.toUpperCase());
}
