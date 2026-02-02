/**
 * Task Progress Mutation Hook
 * Handles progress updates with optimistic updates and persistence
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceTask, TaskStatus } from '@/types';
import { toast } from 'sonner';
import { optimisticHelpers } from './useOptimisticMutation';

interface UseTaskProgressMutationProps {
  workspaceId: string | undefined;
}

export function useTaskProgressMutation({ workspaceId }: UseTaskProgressMutationProps) {
  const queryClient = useQueryClient();
  const queryKey = ['workspace-tasks', workspaceId];

  const updateProgressMutation = useMutation({
    mutationFn: async ({ taskId, progress }: { taskId: string; progress: number }) => {
      if (!workspaceId) throw new Error('Workspace ID is required');

      // Clamp progress between 0 and 100
      const clampedProgress = Math.max(0, Math.min(100, progress));

      // Determine if task should auto-complete
      const updates: Record<string, unknown> = {
        progress: clampedProgress,
        updated_at: new Date().toISOString(),
      };

      // Auto-complete when progress hits 100%
      if (clampedProgress === 100) {
        updates.status = TaskStatus.COMPLETED;
        updates.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('workspace_tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('workspace_id', workspaceId);

      if (updateError) throw updateError;

      return { taskId, progress: clampedProgress, autoCompleted: clampedProgress === 100 };
    },
    onMutate: async ({ taskId, progress }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<WorkspaceTask[]>(queryKey);

      const clampedProgress = Math.max(0, Math.min(100, progress));
      const updates: Partial<WorkspaceTask> = { progress: clampedProgress };
      
      if (clampedProgress === 100) {
        updates.status = TaskStatus.COMPLETED;
      }

      queryClient.setQueryData(
        queryKey,
        optimisticHelpers.updateInList(previousTasks, taskId, updates)
      );

      return { previousTasks };
    },
    onError: (_err, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
      toast.error('Failed to update progress');
    },
    onSuccess: ({ autoCompleted }) => {
      if (autoCompleted) {
        toast.success('Task marked as complete!');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    updateProgress: (taskId: string, progress: number) =>
      updateProgressMutation.mutate({ taskId, progress }),
    isUpdating: updateProgressMutation.isPending,
  };
}
