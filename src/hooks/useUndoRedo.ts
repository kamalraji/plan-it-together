import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UndoAction<T = unknown> {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  previousState: T;
  undo: () => Promise<void>;
  redo?: () => Promise<void>;
}

interface UseUndoRedoOptions {
  maxHistory?: number;
  undoTimeout?: number;
}

/**
 * Hook for managing undo/redo operations with toast notifications
 * 
 * Usage:
 * ```
 * const { recordAction, undo, canUndo } = useUndoRedo();
 * 
 * // When deleting a task
 * recordAction({
 *   type: 'delete-task',
 *   description: 'Deleted "My Task"',
 *   previousState: task,
 *   undo: async () => {
 *     await supabase.from('workspace_tasks').insert(task);
 *   }
 * });
 * ```
 */
export function useUndoRedo<T = unknown>(options: UseUndoRedoOptions = {}) {
  const { maxHistory = 10, undoTimeout = 10000 } = options;
  
  const historyRef = useRef<UndoAction<T>[]>([]);
  const redoStackRef = useRef<UndoAction<T>[]>([]);

  const recordAction = useCallback((action: Omit<UndoAction<T>, 'id' | 'timestamp'>) => {
    const undoAction: UndoAction<T> = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    // Add to history
    historyRef.current = [undoAction, ...historyRef.current.slice(0, maxHistory - 1)];
    
    // Clear redo stack when new action is recorded
    redoStackRef.current = [];

    // Show toast with undo button
    toast(action.description, {
      duration: undoTimeout,
      action: {
        label: 'Undo',
        onClick: async () => {
          try {
            await undoAction.undo();
            // Move to redo stack
            historyRef.current = historyRef.current.filter(a => a.id !== undoAction.id);
            if (undoAction.redo) {
              redoStackRef.current = [undoAction, ...redoStackRef.current];
            }
            toast.success('Action undone');
          } catch (error) {
            toast.error('Failed to undo action');
            console.error('Undo failed:', error);
          }
        },
      },
    });

    // Auto-expire old actions
    setTimeout(() => {
      historyRef.current = historyRef.current.filter(a => a.id !== undoAction.id);
    }, undoTimeout);

    return undoAction.id;
  }, [maxHistory, undoTimeout]);

  const undo = useCallback(async () => {
    const lastAction = historyRef.current[0];
    if (!lastAction) return false;

    try {
      await lastAction.undo();
      historyRef.current = historyRef.current.slice(1);
      
      if (lastAction.redo) {
        redoStackRef.current = [lastAction, ...redoStackRef.current];
      }
      
      toast.success('Action undone');
      return true;
    } catch (error) {
      toast.error('Failed to undo action');
      console.error('Undo failed:', error);
      return false;
    }
  }, []);

  const redo = useCallback(async () => {
    const lastRedo = redoStackRef.current[0];
    if (!lastRedo?.redo) return false;

    try {
      await lastRedo.redo();
      redoStackRef.current = redoStackRef.current.slice(1);
      historyRef.current = [lastRedo, ...historyRef.current];
      
      toast.success('Action redone');
      return true;
    } catch (error) {
      toast.error('Failed to redo action');
      console.error('Redo failed:', error);
      return false;
    }
  }, []);

  const canUndo = useCallback(() => historyRef.current.length > 0, []);
  const canRedo = useCallback(() => redoStackRef.current.length > 0 && redoStackRef.current[0]?.redo !== undefined, []);

  const getHistory = useCallback(() => [...historyRef.current], []);
  const getRedoStack = useCallback(() => [...redoStackRef.current], []);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    redoStackRef.current = [];
  }, []);

  return {
    recordAction,
    undo,
    redo,
    canUndo,
    canRedo,
    getHistory,
    getRedoStack,
    clearHistory,
  };
}

/**
 * Create an undo action for task status change
 */
export function createTaskStatusUndoAction(
  taskId: string,
  taskTitle: string,
  previousStatus: string,
  newStatus: string,
  updateFn: (taskId: string, status: string) => Promise<void>
) {
  return {
    type: 'task-status-change',
    description: `Changed "${taskTitle}" to ${newStatus}`,
    previousState: { taskId, status: previousStatus },
    undo: () => updateFn(taskId, previousStatus),
    redo: () => updateFn(taskId, newStatus),
  };
}

/**
 * Create an undo action for task deletion
 */
export function createTaskDeleteUndoAction<T>(
  task: T,
  taskTitle: string,
  restoreFn: (task: T) => Promise<void>,
  deleteFn?: (taskId: string) => Promise<void>
) {
  return {
    type: 'task-delete',
    description: `Deleted "${taskTitle}"`,
    previousState: task,
    undo: () => restoreFn(task),
    redo: deleteFn ? () => deleteFn((task as { id: string }).id) : undefined,
  };
}

/**
 * Create an undo action for bulk operations
 */
export function createBulkOperationUndoAction<T>(
  items: T[],
  operationType: string,
  description: string,
  undoFn: (items: T[]) => Promise<void>,
  redoFn?: (items: T[]) => Promise<void>
) {
  return {
    type: `bulk-${operationType}`,
    description,
    previousState: items,
    undo: () => undoFn(items),
    redo: redoFn ? () => redoFn(items) : undefined,
  };
}
