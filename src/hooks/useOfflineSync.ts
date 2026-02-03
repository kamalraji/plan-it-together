/**
 * useOfflineSync - Hook for managing offline data synchronization
 * Queues changes when offline and syncs when connection is restored
 */
import { useState, useEffect, useCallback } from 'react';
import { offlineDB, SyncQueueItem } from '@/lib/offline/indexedDB';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  errors: string[];
}

const MAX_RETRIES = 3;

export function useOfflineSync() {
  const { isOnline } = useNetworkStatus();
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    errors: [],
  });

  // Process a single sync item
  const processSyncItem = useCallback(async (item: SyncQueueItem): Promise<boolean> => {
    try {
      const { action, entity, entityId, payload } = item;

      // Handle workspace_tasks sync
      if (entity === 'workspace_tasks') {
        switch (action) {
          case 'create': {
            const { error } = await supabase.from('workspace_tasks').insert(payload as never);
            if (error) throw error;
            break;
          }
          case 'update': {
            const { error } = await supabase.from('workspace_tasks').update(payload as never).eq('id', entityId);
            if (error) throw error;
            break;
          }
          case 'delete': {
            const { error } = await supabase.from('workspace_tasks').delete().eq('id', entityId);
            if (error) throw error;
            break;
          }
        }
      }

      // Remove from queue on success
      await offlineDB.delete('syncQueue', item.id);
      return true;
    } catch (error) {
      console.error('Sync item failed:', error);
      
      if (item.retryCount < MAX_RETRIES) {
        await offlineDB.incrementRetryCount(item.id);
      } else {
        // Move to dead letter queue or notify user
        setSyncState(prev => ({
          ...prev,
          errors: [...prev.errors, `Failed to sync ${item.entity} ${item.action}: ${error}`],
        }));
      }
      return false;
    }
  }, []);

  // Sync all pending items
  const syncPendingItems = useCallback(async () => {
    if (!isOnline) return;

    setSyncState(prev => ({ ...prev, isSyncing: true }));

    try {
      const pendingItems = await offlineDB.getPendingSyncItems();
      
      // Sort by timestamp to maintain order
      pendingItems.sort((a, b) => a.timestamp - b.timestamp);

      for (const item of pendingItems) {
        await processSyncItem(item);
      }

      const remainingItems = await offlineDB.getPendingSyncItems();
      
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        pendingCount: remainingItems.length,
        lastSyncAt: new Date(),
      }));
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [isOnline, processSyncItem]);

  // Queue an action for sync
  const queueAction = useCallback(async (
    action: 'create' | 'update' | 'delete',
    entity: string,
    entityId: string,
    payload: Record<string, unknown>
  ) => {
    await offlineDB.addToSyncQueue({
      action,
      entity,
      entityId,
      payload,
    });

    const pendingItems = await offlineDB.getPendingSyncItems();
    setSyncState(prev => ({ ...prev, pendingCount: pendingItems.length }));

    // Try to sync immediately if online
    if (isOnline) {
      syncPendingItems();
    }
  }, [isOnline, syncPendingItems]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncPendingItems();
    }
  }, [isOnline, syncPendingItems]);

  // Load initial pending count
  useEffect(() => {
    const loadPendingCount = async () => {
      const items = await offlineDB.getPendingSyncItems();
      setSyncState(prev => ({ ...prev, pendingCount: items.length }));
    };
    loadPendingCount();
  }, []);

  const clearErrors = useCallback(() => {
    setSyncState(prev => ({ ...prev, errors: [] }));
  }, []);

  return {
    ...syncState,
    isOnline,
    queueAction,
    syncNow: syncPendingItems,
    clearErrors,
  };
}
