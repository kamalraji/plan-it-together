import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/notificationService';

interface TaskNotificationData {
  taskId: string;
  taskTitle: string;
  workspaceId: string;
  workspaceName?: string;
  assigneeIds?: string[];
  dueDate?: string;
}

/**
 * Hook for sending task-related notifications
 * Inserts into notifications table and triggers push notifications
 */
export function useTaskNotifications() {
  const { user } = useAuth();

  /**
   * Notify users when they are assigned to a task
   */
  const notifyTaskAssigned = async ({
    taskId,
    taskTitle,
    workspaceId,
    assigneeIds,
  }: TaskNotificationData) => {
    if (!assigneeIds?.length || !user?.id) return;

    // Filter out current user (don't notify yourself)
    const recipientIds = assigneeIds.filter((id) => id !== user.id);
    if (!recipientIds.length) return;

    const assignerName = user.email?.split('@')[0] || 'Someone';

    // Insert notifications for each assignee
    const notifications = recipientIds.map((userId) => ({
      user_id: userId,
      title: 'New Task Assignment',
      message: `${assignerName} assigned you to "${taskTitle}"`,
      type: 'task',
      category: 'workspace',
      action_url: `/workspaces/${workspaceId}/tasks`,
      action_label: 'View Task',
      metadata: { taskId, workspaceId, type: 'TASK_ASSIGNED' },
    }));

    try {
      await supabase.from('notifications').insert(notifications);

      // Also trigger local push notification for current browser
      // (Server-side push would be handled separately via edge function)
      if (notificationService.isPermissionGranted()) {
        await notificationService.notifyTaskAssignment(
          taskTitle,
          assignerName,
          workspaceId
        );
      }
    } catch (error) {
      console.error('Failed to send task assignment notifications:', error);
    }
  };

  /**
   * Notify when a task is created (for workspace admins/coordinators)
   */
  const notifyTaskCreated = async ({
    taskId,
    taskTitle,
    workspaceId,
  }: TaskNotificationData) => {
    if (!user?.id) return;

    // This could be expanded to notify workspace admins
    // For now, we'll just log the activity
    try {
      await supabase.from('workspace_activities').insert({
        workspace_id: workspaceId,
        type: 'task',
        title: `Task "${taskTitle}" created`,
        description: `A new task was added to the workspace.`,
        actor_id: user.id,
        metadata: { taskId },
      });
    } catch (error) {
      console.error('Failed to log task creation:', error);
    }
  };

  /**
   * Notify when task is approaching due date
   */
  const notifyTaskDueSoon = async ({
    taskId,
    taskTitle,
    workspaceId,
    assigneeIds,
    dueDate,
  }: TaskNotificationData) => {
    if (!assigneeIds?.length || !dueDate) return;

    const hoursUntilDue = Math.round(
      (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60)
    );

    if (hoursUntilDue > 24 || hoursUntilDue < 0) return;

    const notifications = assigneeIds.map((userId) => ({
      user_id: userId,
      title: hoursUntilDue <= 2 ? 'Urgent: Task Due Soon' : 'Task Deadline Reminder',
      message: `Task "${taskTitle}" is due in ${hoursUntilDue} hours`,
      type: 'deadline',
      category: 'workspace',
      action_url: `/workspaces/${workspaceId}/tasks`,
      action_label: 'View Task',
      metadata: { taskId, workspaceId, type: 'TASK_DUE_SOON', hoursUntilDue },
    }));

    try {
      await supabase.from('notifications').insert(notifications);

      if (notificationService.isPermissionGranted()) {
        await notificationService.notifyTaskDeadline(
          taskTitle,
          hoursUntilDue,
          workspaceId
        );
      }
    } catch (error) {
      console.error('Failed to send task due soon notifications:', error);
    }
  };

  /**
   * Notify when a subtask is completed
   */
  const notifySubtaskCompleted = async ({
    taskId,
    taskTitle,
    workspaceId,
    assigneeIds,
  }: TaskNotificationData & { subtaskTitle?: string; completedBy?: string }) => {
    if (!assigneeIds?.length || !user?.id) return;

    const recipientIds = assigneeIds.filter((id) => id !== user.id);
    if (!recipientIds.length) return;

    const completerName = user.email?.split('@')[0] || 'Someone';

    const notifications = recipientIds.map((userId) => ({
      user_id: userId,
      title: 'Subtask Completed',
      message: `${completerName} completed a subtask on "${taskTitle}"`,
      type: 'task',
      category: 'workspace',
      action_url: `/workspaces/${workspaceId}/tasks`,
      action_label: 'View Task',
      metadata: { taskId, workspaceId, type: 'SUBTASK_COMPLETED' },
    }));

    try {
      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Failed to send subtask completion notifications:', error);
    }
  };

  return {
    notifyTaskAssigned,
    notifyTaskCreated,
    notifyTaskDueSoon,
    notifySubtaskCompleted,
  };
}
