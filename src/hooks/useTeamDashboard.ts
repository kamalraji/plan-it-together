import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { optimisticHelpers } from './useOptimisticMutation';
import { queryPresets } from '@/lib/query-config';

export interface TeamAssignment {
  id: string;
  workspace_id: string;
  user_id: string;
  task_id: string | null;
  hours_allocated: number;
  hours_logged: number;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
  task?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
  };
}

export interface TeamMemberWorkload {
  userId: string;
  name: string;
  avatarUrl?: string;
  totalHoursAllocated: number;
  totalHoursLogged: number;
  activeAssignments: number;
  completedAssignments: number;
  tasksCompleted: number;
  tasksInProgress: number;
}

export function useTeamAssignments(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ['team-assignments', workspaceId];

  const assignmentsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_team_assignments')
        .select(`
          id, workspace_id, user_id, task_id, hours_allocated, hours_logged, status, created_at, updated_at,
          task:workspace_tasks(id, title, status, priority, due_date)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TeamAssignment[];
    },
    enabled: !!workspaceId,
    staleTime: queryPresets.dynamic.staleTime,
    gcTime: queryPresets.dynamic.gcTime,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (assignment: Omit<TeamAssignment, 'id' | 'created_at' | 'updated_at' | 'task'>) => {
      const { data, error } = await supabase
        .from('workspace_team_assignments')
        .insert(assignment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (newAssignment) => {
      await queryClient.cancelQueries({ queryKey });
      const previousAssignments = queryClient.getQueryData<TeamAssignment[]>(queryKey);
      
      const optimisticAssignment: TeamAssignment = {
        ...newAssignment,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData(queryKey, optimisticHelpers.prependToList(previousAssignments, optimisticAssignment));
      return { previousAssignments };
    },
    onError: (error, _, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(queryKey, context.previousAssignments);
      }
      toast({
        title: 'Failed to create assignment',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({ title: 'Assignment created' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamAssignment> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_team_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousAssignments = queryClient.getQueryData<TeamAssignment[]>(queryKey);
      
      queryClient.setQueryData(
        queryKey,
        optimisticHelpers.updateInList(previousAssignments, id, updates)
      );
      
      return { previousAssignments };
    },
    onError: (error, _, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(queryKey, context.previousAssignments);
      }
      toast({
        title: 'Failed to update assignment',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const logHoursMutation = useMutation({
    mutationFn: async ({ id, hours }: { id: string; hours: number }) => {
      const assignment = assignmentsQuery.data?.find(a => a.id === id);
      if (!assignment) throw new Error('Assignment not found');

      const newHoursLogged = assignment.hours_logged + hours;
      const { data, error } = await supabase
        .from('workspace_team_assignments')
        .update({ hours_logged: newHoursLogged })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, hours }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousAssignments = queryClient.getQueryData<TeamAssignment[]>(queryKey);
      const assignment = previousAssignments?.find(a => a.id === id);
      
      if (assignment) {
        queryClient.setQueryData(
          queryKey,
          optimisticHelpers.updateInList(previousAssignments, id, {
            hours_logged: assignment.hours_logged + hours,
          })
        );
      }
      
      return { previousAssignments };
    },
    onError: (error, _, context) => {
      if (context?.previousAssignments) {
        queryClient.setQueryData(queryKey, context.previousAssignments);
      }
      toast({
        title: 'Failed to log hours',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({ title: 'Hours logged' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    assignments: assignmentsQuery.data ?? [],
    isLoading: assignmentsQuery.isLoading,
    createAssignment: createAssignmentMutation.mutate,
    isCreatingAssignment: createAssignmentMutation.isPending,
    updateAssignment: updateAssignmentMutation.mutate,
    isUpdatingAssignment: updateAssignmentMutation.isPending,
    logHours: logHoursMutation.mutate,
    isLoggingHours: logHoursMutation.isPending,
  };
}

export function useTeamWorkload(workspaceId: string | undefined) {
  const workloadQuery = useQuery({
    queryKey: ['team-workload', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      // Get team members
      const { data: members, error: membersError } = await supabase
        .from('workspace_team_members')
        .select('user_id')
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE');
      if (membersError) throw membersError;

      if (!members.length) return [];

      const userIds = members.map(m => m.user_id);

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      if (profilesError) throw profilesError;

      // Get assignments for these users in this workspace
      const { data: assignments, error: assignmentsError } = await supabase
        .from('workspace_team_assignments')
        .select('user_id, hours_allocated, hours_logged, status')
        .eq('workspace_id', workspaceId)
        .in('user_id', userIds);
      if (assignmentsError) throw assignmentsError;

      // Get tasks assigned to these users
      const { data: tasks, error: tasksError } = await supabase
        .from('workspace_tasks')
        .select('id, assigned_to, status')
        .eq('workspace_id', workspaceId)
        .in('assigned_to', userIds);
      if (tasksError) throw tasksError;

      // Compute workload per user
      const workloadMap: Record<string, TeamMemberWorkload> = {};

      profiles?.forEach(profile => {
        const userAssignments = assignments?.filter(a => a.user_id === profile.id) ?? [];
        const userTasks = tasks?.filter(t => t.assigned_to === profile.id) ?? [];

        workloadMap[profile.id] = {
          userId: profile.id,
          name: profile.full_name || 'Unknown',
          avatarUrl: profile.avatar_url || undefined,
          totalHoursAllocated: userAssignments.reduce((sum, a) => sum + (a.hours_allocated || 0), 0),
          totalHoursLogged: userAssignments.reduce((sum, a) => sum + (a.hours_logged || 0), 0),
          activeAssignments: userAssignments.filter(a => a.status === 'active').length,
          completedAssignments: userAssignments.filter(a => a.status === 'completed').length,
          tasksCompleted: userTasks.filter(t => t.status === 'DONE').length,
          tasksInProgress: userTasks.filter(t => t.status === 'IN_PROGRESS').length,
        };
      });

      return Object.values(workloadMap);
    },
    enabled: !!workspaceId,
    staleTime: queryPresets.dynamic.staleTime,
    gcTime: queryPresets.dynamic.gcTime,
  });

  return {
    workload: workloadQuery.data ?? [],
    isLoading: workloadQuery.isLoading,
  };
}

export function usePersonalProgress(workspaceId: string | undefined, userId: string | undefined) {
  const progressQuery = useQuery({
    queryKey: ['personal-progress', workspaceId, userId],
    queryFn: async () => {
      if (!workspaceId || !userId) return null;

      // Get user's tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('workspace_tasks')
        .select('id, title, status, priority, due_date')
        .eq('workspace_id', workspaceId)
        .eq('assigned_to', userId);
      if (tasksError) throw tasksError;

      // Get user's assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('workspace_team_assignments')
        .select('hours_allocated, hours_logged')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);
      if (assignmentsError) throw assignmentsError;

      const totalTasks = tasks?.length ?? 0;
      const completedTasks = tasks?.filter(t => t.status === 'DONE').length ?? 0;
      const inProgressTasks = tasks?.filter(t => t.status === 'IN_PROGRESS').length ?? 0;
      const overdueTasks = tasks?.filter(t => 
        t.due_date && new Date(t.due_date) < new Date() && t.status !== 'DONE'
      ).length ?? 0;

      const hoursAllocated = assignments?.reduce((sum, a) => sum + (a.hours_allocated || 0), 0) ?? 0;
      const hoursLogged = assignments?.reduce((sum, a) => sum + (a.hours_logged || 0), 0) ?? 0;

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        hoursAllocated,
        hoursLogged,
        hoursRemaining: Math.max(0, hoursAllocated - hoursLogged),
        recentTasks: tasks?.slice(0, 5) ?? [],
      };
    },
    enabled: !!workspaceId && !!userId,
    staleTime: queryPresets.dynamic.staleTime,
    gcTime: queryPresets.dynamic.gcTime,
  });

  return {
    progress: progressQuery.data,
    isLoading: progressQuery.isLoading,
  };
}
