import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type WebhookNotificationType = 'broadcast' | 'task_assignment' | 'deadline_reminder' | 'channel_message';

interface WebhookNotificationPayload {
  workspace_id: string;
  notification_type: WebhookNotificationType;
  title: string;
  message: string;
  metadata?: {
    task_id?: string;
    channel_id?: string;
    sender_name?: string;
    due_date?: string;
    priority?: string;
    url?: string;
  };
}

export function useWebhookNotifications() {
  const sendWebhookNotification = useCallback(async (payload: WebhookNotificationPayload) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-webhook-notification', {
        body: payload,
      });

      if (error) {
        console.error('Webhook notification error:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
      return { success: false, error };
    }
  }, []);

  const notifyBroadcast = useCallback(async (
    workspaceId: string,
    title: string,
    message: string,
    senderName?: string
  ) => {
    return sendWebhookNotification({
      workspace_id: workspaceId,
      notification_type: 'broadcast',
      title,
      message,
      metadata: {
        sender_name: senderName,
      },
    });
  }, [sendWebhookNotification]);

  const notifyTaskAssignment = useCallback(async (
    workspaceId: string,
    taskTitle: string,
    assigneeName: string,
    taskId: string,
    priority?: string
  ) => {
    return sendWebhookNotification({
      workspace_id: workspaceId,
      notification_type: 'task_assignment',
      title: '📋 New Task Assignment',
      message: `"${taskTitle}" has been assigned to ${assigneeName}`,
      metadata: {
        task_id: taskId,
        priority,
      },
    });
  }, [sendWebhookNotification]);

  const notifyDeadlineReminder = useCallback(async (
    workspaceId: string,
    taskTitle: string,
    dueDate: string,
    taskId: string
  ) => {
    return sendWebhookNotification({
      workspace_id: workspaceId,
      notification_type: 'deadline_reminder',
      title: '⏰ Deadline Reminder',
      message: `Task "${taskTitle}" is due ${dueDate}`,
      metadata: {
        task_id: taskId,
        due_date: dueDate,
      },
    });
  }, [sendWebhookNotification]);

  const notifyChannelMessage = useCallback(async (
    workspaceId: string,
    channelName: string,
    message: string,
    senderName: string,
    channelId: string
  ) => {
    return sendWebhookNotification({
      workspace_id: workspaceId,
      notification_type: 'channel_message',
      title: `💬 New message in #${channelName}`,
      message: `${senderName}: ${message}`,
      metadata: {
        channel_id: channelId,
        sender_name: senderName,
      },
    });
  }, [sendWebhookNotification]);

  return {
    sendWebhookNotification,
    notifyBroadcast,
    notifyTaskAssignment,
    notifyDeadlineReminder,
    notifyChannelMessage,
  };
}
