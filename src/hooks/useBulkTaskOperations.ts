import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaskStatus, TaskPriority } from '@/types';
import { toast } from 'sonner';

export function useBulkTaskOperations(workspaceId: string) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectTask = useCallback((taskId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((taskIds: string[], selectAll: boolean) => {
    if (selectAll) {
      setSelectedIds(new Set(taskIds));
    } else {
      setSelectedIds(new Set());
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ taskIds, status }: { taskIds: string[]; status: TaskStatus }) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          completed_at: status === TaskStatus.COMPLETED ? new Date().toISOString() : null
        })
        .in('id', taskIds)
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      return { taskIds, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
    },
    onError: (error) => {
      console.error('Bulk status update failed:', error);
      toast.error('Failed to update task status');
    },
  });

  const bulkPriorityMutation = useMutation({
    mutationFn: async ({ taskIds, priority }: { taskIds: string[]; priority: TaskPriority }) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .update({ priority, updated_at: new Date().toISOString() })
        .in('id', taskIds)
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      return { taskIds, priority };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
    },
    onError: (error) => {
      console.error('Bulk priority update failed:', error);
      toast.error('Failed to update task priority');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .delete()
        .in('id', taskIds)
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      return taskIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
    },
    onError: (error) => {
      console.error('Bulk delete failed:', error);
      toast.error('Failed to delete tasks');
    },
  });

  return {
    selectedIds,
    selectTask,
    selectAll,
    clearSelection,
    bulkStatusChange: async (taskIds: string[], status: TaskStatus) => {
      await bulkStatusMutation.mutateAsync({ taskIds, status });
    },
    bulkPriorityChange: async (taskIds: string[], priority: TaskPriority) => {
      await bulkPriorityMutation.mutateAsync({ taskIds, priority });
    },
    bulkDelete: async (taskIds: string[]) => {
      await bulkDeleteMutation.mutateAsync(taskIds);
    },
    isProcessing: bulkStatusMutation.isPending || bulkPriorityMutation.isPending || bulkDeleteMutation.isPending,
  };
}
