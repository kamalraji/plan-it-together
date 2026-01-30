import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { NOTIFICATION_PREFERENCES_COLUMNS } from '@/lib/supabase-columns';

export interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isInitialized: boolean;
  preferences: {
    workspace_enabled: boolean;
    event_enabled: boolean;
    marketplace_enabled: boolean;
    organization_enabled: boolean;
    system_enabled: boolean;
    sound_enabled: boolean;
    vibration_enabled: boolean;
  } | null;
}

export function useNotifications(userId?: string) {
  const [state, setState] = useState<NotificationState>({
    isSupported: notificationService.isSupported(),
    permission: Notification.permission,
    isSubscribed: false,
    isInitialized: false,
    preferences: null,
  });

  // Initialize notification service
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const initialized = await notificationService.initialize();

        if (initialized) {
          const isSubscribed = await notificationService.isSubscribed();

          setState((prev) => ({
            ...prev,
            isInitialized: true,
            isSubscribed,
            permission: Notification.permission,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isInitialized: true,
          }));
        }
      } catch (_error) {
        setState((prev) => ({
          ...prev,
          isInitialized: true,
        }));
      }
    };

    if (state.isSupported) {
      void initializeNotifications();
    } else {
      setState((prev) => ({ ...prev, isInitialized: true }));
    }
  }, [state.isSupported]);

  // Load and persist per-user notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!userId) {
        setState((prev) => ({ ...prev, preferences: null }));
        return;
      }

      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select(NOTIFICATION_PREFERENCES_COLUMNS.detail)
          .eq('user_id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          return;
        }

        let prefs = data;

        if (!prefs) {
          const { data: inserted, error: insertError } = await supabase
            .from('notification_preferences')
            .insert({ user_id: userId })
            .select(NOTIFICATION_PREFERENCES_COLUMNS.detail)
            .single();

          if (insertError) {
            return;
          }

          prefs = inserted;
        }

        setState((prev) => ({ ...prev, preferences: prefs }));
      } catch (_err) {
        // Loading notification preferences failed silently
      }
    };

    if (state.isSupported) {
      void loadPreferences();
    }
  }, [state.isSupported, userId]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const permission = await notificationService.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission;
    } catch (_error) {
      return 'denied';
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      const subscription = await notificationService.subscribeToPushNotifications();
      const isSubscribed = !!subscription;

      setState((prev) => ({
        ...prev,
        isSubscribed,
        permission: Notification.permission,
      }));

      return isSubscribed;
    } catch (_error) {
      return false;
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const success = await notificationService.unsubscribeFromPushNotifications();

      if (success) {
        setState((prev) => ({ ...prev, isSubscribed: false }));
      }

      return success;
    } catch (_error) {
      return false;
    }
  }, []);

  // Show local notification
  const showNotification = useCallback(
    async (
      title: string,
      options?: {
        body?: string;
        icon?: string;
        tag?: string;
        data?: any;
        requireInteraction?: boolean;
      },
    ) => {
      try {
        await notificationService.showLocalNotification({
          title,
          body: options?.body || '',
          icon: options?.icon,
          tag: options?.tag,
          data: options?.data,
          requireInteraction: options?.requireInteraction,
        });
      } catch (_error) {
        // Show notification failed silently
      }
    },
    [],
  );

  // Workspace-specific notification methods (respecting preferences)
  const shouldSendForWorkspace = () => {
    if (!state.preferences) return true;
    return state.preferences.workspace_enabled;
  };

  const updatePreferences = useCallback(
    async (
      updates: Partial<NonNullable<NotificationState['preferences']>>,
    ) => {
      if (!userId || !state.preferences) return;

      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .update(updates)
          .eq('user_id', userId)
          .select(NOTIFICATION_PREFERENCES_COLUMNS.detail)
          .maybeSingle();

        if (error) {
          return;
        }

        if (data) {
          setState((prev) => ({ ...prev, preferences: data }));
        }
      } catch (_err) {
        // Updating notification preferences failed silently
      }
    },
    [userId, state.preferences],
  );

  const notifyTaskAssignment = useCallback(
    async (taskTitle: string, assigneeName: string, workspaceId: string) => {
      try {
        if (!shouldSendForWorkspace()) return;
        await notificationService.notifyTaskAssignment(taskTitle, assigneeName, workspaceId);
      } catch (_error) {
        // Task assignment notification failed silently
      }
    },
    [state.preferences],
  );

  const notifyTaskDeadline = useCallback(
    async (taskTitle: string, hoursUntilDeadline: number, workspaceId: string) => {
      try {
        if (!shouldSendForWorkspace()) return;
        await notificationService.notifyTaskDeadline(taskTitle, hoursUntilDeadline, workspaceId);
      } catch (_error) {
        // Task deadline notification failed silently
      }
    },
    [state.preferences],
  );

  const notifyNewMessage = useCallback(
    async (senderName: string, channelName: string, workspaceId: string) => {
      try {
        if (!shouldSendForWorkspace()) return;
        await notificationService.notifyNewMessage(senderName, channelName, workspaceId);
      } catch (_error) {
        // New message notification failed silently
      }
    },
    [state.preferences],
  );

  const notifyTeamInvitation = useCallback(
    async (workspaceName: string, inviterName: string) => {
      try {
        if (!shouldSendForWorkspace()) return;
        await notificationService.notifyTeamInvitation(workspaceName, inviterName);
      } catch (_error) {
        // Team invitation notification failed silently
      }
    },
    [state.preferences],
  );

  // Check if notifications can be enabled
  const canEnable = useCallback((): boolean => {
    return state.isSupported && state.permission !== 'denied';
  }, [state.isSupported, state.permission]);

  // Check if notifications are fully enabled
  const isEnabled = useCallback((): boolean => {
    return state.isSupported && state.permission === 'granted' && state.isSubscribed;
  }, [state.isSupported, state.permission, state.isSubscribed]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    notifyTaskAssignment,
    notifyTaskDeadline,
    notifyNewMessage,
    notifyTeamInvitation,
    updatePreferences,
    canEnable,
    isEnabled,
  };
}
