/**
 * useOfflineTasks - Hook for offline-capable task management
 * Stores tasks locally and syncs with server when online
 */
import { useState, useEffect, useCallback } from 'react';
import { offlineDB, OfflineTask } from '@/lib/offline/indexedDB';
import { useOfflineSync } from './useOfflineSync';
import { WorkspaceTask } from '@/types';

export function useOfflineTasks(workspaceId: string) {
  const [localTasks, setLocalTasks] = useState<WorkspaceTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { queueAction, isOnline, pendingCount } = useOfflineSync();

  // Load tasks from IndexedDB
  const loadLocalTasks = useCallback(async () => {
    try {
      const offlineTasks = await offlineDB.getAll<OfflineTask>('tasks');
      const tasks = offlineTasks
        .filter(t => (t.data as { workspace_id?: string }).workspace_id === workspaceId)
        .map(t => t.data as unknown as WorkspaceTask);
      setLocalTasks(tasks);
    } catch (error) {
      console.error('Failed to load local tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  // Cache tasks locally
  const cacheTasks = useCallback(async (tasks: WorkspaceTask[]) => {
    for (const task of tasks) {
      await offlineDB.put<OfflineTask>('tasks', {
        id: task.id,
        data: task as unknown as Record<string, unknown>,
        syncStatus: 'synced',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    setLocalTasks(tasks);
  }, []);

  // Create task (works offline)
  const createTask = useCallback(async (taskData: Partial<WorkspaceTask>) => {
    const tempId = crypto.randomUUID();
    const newTask: WorkspaceTask = {
      ...taskData,
      id: tempId,
      workspace_id: workspaceId,
    } as WorkspaceTask;

    // Save locally first
    await offlineDB.put<OfflineTask>('tasks', {
      id: tempId,
      data: newTask as unknown as Record<string, unknown>,
      syncStatus: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    setLocalTasks(prev => [...prev, newTask]);

    // Queue for sync
    await queueAction('create', 'workspace_tasks', tempId, taskData as Record<string, unknown>);

    return newTask;
  }, [workspaceId, queueAction]);

  // Update task (works offline)
  const updateTask = useCallback(async (taskId: string, updates: Partial<WorkspaceTask>) => {
    // Update local copy
    setLocalTasks(prev => 
      prev.map(t => t.id === taskId ? { ...t, ...updates } : t)
    );

    const existing = await offlineDB.get<OfflineTask>('tasks', taskId);
    if (existing) {
      await offlineDB.put<OfflineTask>('tasks', {
        ...existing,
        data: { ...existing.data, ...updates },
        syncStatus: 'pending',
        updatedAt: Date.now(),
      });
    }

    // Queue for sync
    await queueAction('update', 'workspace_tasks', taskId, updates as Record<string, unknown>);
  }, [queueAction]);

  // Delete task (works offline)
  const deleteTask = useCallback(async (taskId: string) => {
    setLocalTasks(prev => prev.filter(t => t.id !== taskId));
    await offlineDB.delete('tasks', taskId);
    await queueAction('delete', 'workspace_tasks', taskId, {});
  }, [queueAction]);

  useEffect(() => {
    loadLocalTasks();
  }, [loadLocalTasks]);

  return {
    tasks: localTasks,
    isLoading,
    isOnline,
    pendingCount,
    cacheTasks,
    createTask,
    updateTask,
    deleteTask,
    refreshLocal: loadLocalTasks,
  };
}
