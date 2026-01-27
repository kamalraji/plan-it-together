import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaskPriority, TaskStatus, WorkspaceRoleScope, WorkspaceTask, TaskCategory, WorkspaceRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { TablesInsert } from '@/integrations/supabase/types';
import { optimisticHelpers } from './useOptimisticMutation';

interface UseWorkspaceMutationsProps {
  workspaceId: string | undefined;
  eventId?: string;
  activeRoleSpace?: WorkspaceRoleScope;
}

/**
 * Shared hook for workspace mutations (task CRUD, event publish, role views)
 * Uses optimistic updates for instant UI feedback
 */
export function useWorkspaceMutations({
  workspaceId,
  eventId,
  activeRoleSpace = 'ALL',
}: UseWorkspaceMutationsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryKey = ['workspace-tasks', workspaceId];

  // Create task with optimistic update
  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      const { data, error } = await supabase
        .from('workspace_tasks')
        .insert({
          workspace_id: workspaceId,
          title: 'New task',
          description: '',
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.NOT_STARTED,
          role_scope: activeRoleSpace === 'ALL' ? null : activeRoleSpace,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<WorkspaceTask[]>(queryKey);
      
      // Create optimistic task with required fields
      const now = new Date().toISOString();
      const optimisticTask: WorkspaceTask = {
        id: `temp-${Date.now()}`,
        workspaceId: workspaceId!,
        title: 'New task',
        description: '',
        category: TaskCategory.LOGISTICS,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.NOT_STARTED,
        progress: 0,
        dependencies: [],
        tags: [],
        metadata: {},
        roleScope: activeRoleSpace === 'ALL' ? undefined : activeRoleSpace,
        creator: {
          id: user?.id || 'temp',
          userId: user?.id || 'temp',
          role: WorkspaceRole.EVENT_COORDINATOR,
          user: { id: user?.id || 'temp', name: user?.email || 'You' },
        },
        createdAt: now,
        updatedAt: now,
      };
      
      queryClient.setQueryData(queryKey, optimisticHelpers.appendToList(previousTasks, optimisticTask));
      return { previousTasks };
    },
    onError: (error, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
      toast({
        title: 'Failed to create task',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Update task status with optimistic update
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .update({ status })
        .eq('id', taskId)
        .eq('workspace_id', workspaceId as string);

      if (error) throw error;
      return { taskId, status };
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<WorkspaceTask[]>(queryKey);
      
      queryClient.setQueryData(
        queryKey,
        optimisticHelpers.updateInList(previousTasks, taskId, { status })
      );
      
      return { previousTasks };
    },
    onError: (error, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
      toast({
        title: 'Failed to update task',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Delete task with optimistic update
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .delete()
        .eq('id', taskId)
        .eq('workspace_id', workspaceId as string);

      if (error) throw error;
      return taskId;
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<WorkspaceTask[]>(queryKey);
      
      queryClient.setQueryData(
        queryKey,
        optimisticHelpers.removeFromList(previousTasks, taskId)
      );
      
      return { previousTasks };
    },
    onError: (error, _, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
      toast({
        title: 'Failed to delete task',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({ title: 'Task deleted' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Publish event
  const publishEventMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error('No event linked to this workspace');

      const { error } = await supabase
        .from('events')
        .update({ status: 'PUBLISHED' })
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Event published',
        description: 'Your event has been marked as published.',
      });
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to publish event',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Upsert role view
  type WorkspaceRoleViewInsert = TablesInsert<'workspace_role_views'>;

  const upsertRoleViewMutation = useMutation({
    mutationFn: async ({
      roleScope,
      lastActiveTab,
    }: {
      roleScope: WorkspaceRoleScope;
      lastActiveTab: string;
    }) => {
      if (!workspaceId || !user?.id) return;

      const payload: WorkspaceRoleViewInsert = {
        workspace_id: workspaceId,
        user_id: user.id,
        role_scope: roleScope,
        last_active_tab: lastActiveTab,
      };

      const { error } = await supabase
        .from('workspace_role_views')
        .upsert(payload, { onConflict: 'workspace_id,user_id,role_scope' });

      if (error) throw error;
    },
  });

  return {
    createTask: () => createTaskMutation.mutate(),
    isCreatingTask: createTaskMutation.isPending,
    updateTaskStatus: (taskId: string, status: TaskStatus) =>
      updateTaskStatusMutation.mutate({ taskId, status }),
    isUpdatingTaskStatus: updateTaskStatusMutation.isPending,
    deleteTask: (taskId: string) => deleteTaskMutation.mutate(taskId),
    isDeletingTask: deleteTaskMutation.isPending,
    publishEvent: () => publishEventMutation.mutate(),
    isPublishingEvent: publishEventMutation.isPending,
    upsertRoleView: (roleScope: WorkspaceRoleScope, lastActiveTab: string) =>
      upsertRoleViewMutation.mutate({ roleScope, lastActiveTab }),
  };
}
