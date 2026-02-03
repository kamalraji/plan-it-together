/**
 * Real-Time Notifications Hook
 * Subscribes to notifications table and shows toast notifications
 * for important events like task assignments, mentions, and escalations
 */
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

interface NotificationPayload {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

interface UseRealtimeNotificationsOptions {
  userId?: string;
  enabled?: boolean;
  onNotification?: (notification: NotificationPayload) => void;
  showToasts?: boolean;
}

const notificationIcons: Record<string, string> = {
  task_assigned: '📋',
  task_completed: '✅',
  mention: '@',
  approval_pending: '⏳',
  approval_approved: '✓',
  approval_rejected: '✗',
  escalation: '⚠️',
  message: '💬',
  deadline_reminder: '⏰',
  budget_alert: '💰',
};

export function useRealtimeNotifications({
  userId,
  enabled = true,
  onNotification,
  showToasts = true,
}: UseRealtimeNotificationsOptions = {}) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleNotification = useCallback((payload: NotificationPayload) => {
    // Call custom handler if provided
    onNotification?.(payload);

    // Show toast notification
    if (showToasts) {
      const icon = notificationIcons[payload.type] || '🔔';
      const variant = payload.type === 'escalation' || payload.type === 'approval_rejected' 
        ? 'destructive' 
        : 'default';

      toast({
        title: `${icon} ${payload.title}`,
        description: payload.message,
        variant,
      });
    }
  }, [onNotification, showToasts]);

  useEffect(() => {
    if (!enabled || !userId) return;

    channelRef.current = supabase.channel(`notifications:${userId}`);

    // Subscribe to new notifications
    channelRef.current
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as NotificationPayload;
          handleNotification(notification);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enabled, handleNotification]);

  return null;
}

// Helper hook for workspace-specific notifications (task assignments, etc.)
export function useWorkspaceRealtimeNotifications(workspaceId: string, userId?: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!workspaceId || !userId) return;

    channelRef.current = supabase.channel(`workspace-notifications:${workspaceId}:${userId}`);

    // Subscribe to task assignments
    channelRef.current
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workspace_task_assignments',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Fetch task details
          const { data: task } = await supabase
            .from('workspace_tasks')
            .select('title')
            .eq('id', payload.new.task_id)
            .single();

          toast({
            title: '📋 New Task Assigned',
            description: task?.title || 'You have been assigned a new task',
          });
        }
      )
      // Subscribe to mentions in messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'channel_messages',
        },
        (payload) => {
          const content = (payload.new as any).content || '';
          // Check if user is mentioned
          if (content.includes(`@${userId}`) || content.includes(`<@${userId}>`)) {
            toast({
              title: '@ You were mentioned',
              description: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
            });
          }
        }
      )
      // Subscribe to escalations
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'escalation_history',
          filter: `escalated_to=eq.${userId}`,
        },
        async (payload) => {
          const { data: task } = await supabase
            .from('workspace_tasks')
            .select('title')
            .eq('id', (payload.new as any).task_id)
            .single();

          toast({
            title: '⚠️ Task Escalated to You',
            description: task?.title || 'A task has been escalated to you',
            variant: 'destructive',
          });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, userId]);
}
