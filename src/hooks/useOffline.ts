import { useState, useEffect, useCallback } from 'react';
import { offlineService } from '../services/offlineService';
import { notificationService } from '../services/notificationService';
import { supabase } from '@/integrations/supabase/client';

export interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
  pendingUpdates: number;
  pendingMessages: number;
}

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isInitialized: false,
    pendingUpdates: 0,
    pendingMessages: 0
  });

  // Initialize offline services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        const offlineInitialized = await offlineService.initialize();

        if (offlineInitialized) {
          // Load pending counts
          const [pendingUpdates, pendingMessages] = await Promise.all([
            offlineService.getPendingTaskUpdates(),
            offlineService.getPendingMessages()
          ]);

          setState(prev => ({
            ...prev,
            isInitialized: true,
            pendingUpdates: pendingUpdates.length,
            pendingMessages: pendingMessages.length
          }));
        }
      } catch (_error) {
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    };

    initializeServices();
  }, []);

  // Listen for network changes
  useEffect(() => {
    const cleanup = offlineService.onNetworkChange((isOnline) => {
      setState(prev => ({ ...prev, isOnline }));
      
      if (isOnline) {
        // Trigger sync when coming back online
        syncPendingData();
      }
    });

    return cleanup;
  }, []);

  // Sync pending data
  const syncPendingData = useCallback(async () => {
    try {
      await Promise.all([
        offlineService.syncTaskUpdates(),
        offlineService.syncMessages()
      ]);

      // Update pending counts
      const [pendingUpdates, pendingMessages] = await Promise.all([
        offlineService.getPendingTaskUpdates(),
        offlineService.getPendingMessages()
      ]);

      setState(prev => ({
        ...prev,
        pendingUpdates: pendingUpdates.length,
        pendingMessages: pendingMessages.length
      }));
    } catch (_error) {
      // Sync failures are expected when offline
    }
  }, []);

  // Save task update for offline sync
  const saveTaskUpdate = useCallback(async (workspaceId: string, taskId: string, updateData: any) => {
    try {
      if (state.isOnline) {
        // Try to update immediately via Supabase if online
        const { error } = await supabase
          .from('workspace_tasks')
          .update(updateData)
          .eq('id', taskId)
          .eq('workspace_id', workspaceId);

        if (error) {
          throw new Error(error.message);
        }
      } else {
        // Save for offline sync
        await offlineService.saveTaskUpdate(workspaceId, taskId, updateData);
        
        setState(prev => ({
          ...prev,
          pendingUpdates: prev.pendingUpdates + 1
        }));

        // Show offline notification
        await notificationService.showLocalNotification({
          title: 'Task Update Saved',
          body: 'Your task update will be synced when you\'re back online',
          tag: 'offline-task-update'
        });
      }
    } catch (_error) {
      // Save for offline sync as fallback
      await offlineService.saveTaskUpdate(workspaceId, taskId, updateData);
      
      setState(prev => ({
        ...prev,
        pendingUpdates: prev.pendingUpdates + 1
      }));
    }
  }, [state.isOnline]);

  // Save message for offline sync
  const saveMessage = useCallback(async (channelId: string, content: string): Promise<string> => {
    try {
      if (state.isOnline) {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Try to send immediately via Supabase if online
        const { data, error } = await supabase
          .from('channel_messages')
          .insert({
            channel_id: channelId,
            content,
            sender_id: user.id,
          })
          .select('id')
          .single();

        if (error) {
          throw new Error(error.message);
        }

        return data.id;
      } else {
        // Save for offline sync
        const tempId = await offlineService.saveOfflineMessage(channelId, content);
        
        setState(prev => ({
          ...prev,
          pendingMessages: prev.pendingMessages + 1
        }));

        return tempId;
      }
    } catch (_error) {
      // Save for offline sync as fallback
      const tempId = await offlineService.saveOfflineMessage(channelId, content);
      
      setState(prev => ({
        ...prev,
        pendingMessages: prev.pendingMessages + 1
      }));

      return tempId;
    }
  }, [state.isOnline]);

  // Cache data for offline access
  const cacheData = useCallback(async (key: string, data: any, ttl?: number) => {
    try {
      await offlineService.cacheData(key, data, ttl);
    } catch (_error) {
      // Caching failures are non-critical
    }
  }, []);

  // Get cached data
  const getCachedData = useCallback(async (key: string) => {
    try {
      return await offlineService.getCachedData(key);
    } catch (_error) {
      return null;
    }
  }, []);

  // Clear all offline data
  const clearOfflineData = useCallback(async () => {
    try {
      await offlineService.clearAllOfflineData();
      setState(prev => ({
        ...prev,
        pendingUpdates: 0,
        pendingMessages: 0
      }));
    } catch (_error) {
      // Clear failures are non-critical
    }
  }, []);

  // Get storage usage
  const getStorageUsage = useCallback(async () => {
    try {
      return await offlineService.getStorageUsage();
    } catch (_error) {
      return null;
    }
  }, []);

  return {
    ...state,
    saveTaskUpdate,
    saveMessage,
    cacheData,
    getCachedData,
    syncPendingData,
    clearOfflineData,
    getStorageUsage
  };
}