import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  RecurringTask, 
  CreateRecurringTaskDTO, 
  RecurrenceConfig,
  getNextOccurrences,
  calculateNextOccurrence
} from '@/lib/recurringTaskTypes';
import { TaskPriority, TaskCategory, WorkspaceRoleScope } from '@/types';

interface UseRecurringTasksOptions {
  workspaceId: string;
}

export function useRecurringTasks({ workspaceId }: UseRecurringTasksOptions) {
  const queryClient = useQueryClient();

  // Fetch recurring tasks
  const recurringTasksQuery = useQuery({
    queryKey: ['recurring-tasks', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_recurring_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        title: row.title,
        description: row.description,
        priority: row.priority as TaskPriority,
        category: row.category as TaskCategory | undefined,
        roleScope: row.role_scope as WorkspaceRoleScope | undefined,
        assignedTo: row.assigned_to,
        recurrenceType: row.recurrence_type,
        recurrenceConfig: row.recurrence_config as RecurrenceConfig,
        templateData: row.template_data,
        nextOccurrence: row.next_occurrence,
        lastCreatedAt: row.last_created_at,
        endDate: row.end_date,
        occurrenceCount: row.occurrence_count,
        maxOccurrences: row.max_occurrences,
        isActive: row.is_active,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) as RecurringTask[];
    },
    enabled: !!workspaceId,
  });

  // Create recurring task
  const createMutation = useMutation({
    mutationFn: async (dto: CreateRecurringTaskDTO) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const startDate = new Date(dto.startDate);
      const recurrenceConfig: RecurrenceConfig = dto.recurrenceConfig;

      const insertData = {
        workspace_id: dto.workspaceId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        category: dto.category,
        role_scope: dto.roleScope,
        assigned_to: dto.assignedTo,
        recurrence_type: dto.recurrenceType,
        recurrence_config: recurrenceConfig,
        template_data: dto.templateData || {},
        next_occurrence: startDate.toISOString(),
        end_date: dto.endDate || null,
        max_occurrences: dto.maxOccurrences || null,
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('workspace_recurring_tasks')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Recurring task created');
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks', workspaceId] });
    },
    onError: (error) => {
      toast.error(`Failed to create recurring task: ${error.message}`);
    },
  });

  // Update recurring task
  const updateMutation = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<CreateRecurringTaskDTO> 
    }) => {
      const updateData: Record<string, any> = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.roleScope !== undefined) updateData.role_scope = updates.roleScope;
      if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;
      if (updates.recurrenceType !== undefined) updateData.recurrence_type = updates.recurrenceType;
      if (updates.recurrenceConfig !== undefined) updateData.recurrence_config = updates.recurrenceConfig;
      if (updates.templateData !== undefined) updateData.template_data = updates.templateData;
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
      if (updates.maxOccurrences !== undefined) updateData.max_occurrences = updates.maxOccurrences;

      const { error } = await supabase
        .from('workspace_recurring_tasks')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Recurring task updated');
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks', workspaceId] });
    },
    onError: (error) => {
      toast.error(`Failed to update recurring task: ${error.message}`);
    },
  });

  // Delete recurring task
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_recurring_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Recurring task deleted');
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks', workspaceId] });
    },
    onError: (error) => {
      toast.error(`Failed to delete recurring task: ${error.message}`);
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('workspace_recurring_tasks')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'Recurring task activated' : 'Recurring task paused');
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks', workspaceId] });
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Manually trigger task creation
  const triggerNowMutation = useMutation({
    mutationFn: async (recurringTask: RecurringTask) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a new task instance
      const { error: taskError } = await supabase
        .from('workspace_tasks')
        .insert({
          workspace_id: recurringTask.workspaceId,
          title: recurringTask.title,
          description: recurringTask.description,
          priority: recurringTask.priority,
          category: recurringTask.category,
          role_scope: recurringTask.roleScope,
          assigned_to: recurringTask.assignedTo,
          status: 'NOT_STARTED',
          recurring_task_id: recurringTask.id,
          occurrence_number: recurringTask.occurrenceCount + 1,
        });

      if (taskError) throw taskError;

      // Update the recurring task
      const nextOccurrence = calculateNextOccurrence(
        new Date(),
        recurringTask.recurrenceType,
        recurringTask.recurrenceConfig
      );

      const { error: updateError } = await supabase
        .from('workspace_recurring_tasks')
        .update({
          last_created_at: new Date().toISOString(),
          next_occurrence: nextOccurrence.toISOString(),
          occurrence_count: recurringTask.occurrenceCount + 1,
        })
        .eq('id', recurringTask.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Task created from recurring template');
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
    },
    onError: (error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });

  // Get preview of next occurrences
  const getPreviewOccurrences = (
    startDate: Date,
    recurrenceType: string,
    config: RecurrenceConfig,
    count: number = 5,
    endDate?: Date
  ) => {
    return getNextOccurrences(
      startDate, 
      recurrenceType as any, 
      config, 
      count, 
      endDate
    );
  };

  return {
    recurringTasks: recurringTasksQuery.data || [],
    isLoading: recurringTasksQuery.isLoading,
    isError: recurringTasksQuery.isError,
    
    createRecurringTask: createMutation.mutateAsync,
    updateRecurringTask: updateMutation.mutateAsync,
    deleteRecurringTask: deleteMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
    triggerNow: triggerNowMutation.mutateAsync,
    
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    getPreviewOccurrences,
    refetch: recurringTasksQuery.refetch,
  };
}
