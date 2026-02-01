import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaskStatus } from '@/types';
import { queryKeys, queryPresets } from '@/lib/query-config';

export interface CommitteeStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  pendingApprovals: number;
  teamMembers: number;
  completionRate: number;
  upcomingDeadlines: number;
  recentActivity: number;
}

/**
 * Hook for fetching real committee statistics from workspace data
 * Uses centralized query key factory for cache consistency
 */
export function useCommitteeStats(workspaceId: string) {

  return useQuery({
    queryKey: queryKeys.workspaces.committeeStats(workspaceId),
    ...queryPresets.dynamic,
    queryFn: async (): Promise<CommitteeStats> => {
      const now = new Date().toISOString();
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Fetch tasks with status counts
      const { data: tasks, error: tasksError } = await supabase
        .from('workspace_tasks')
        .select('id, status, due_date, updated_at')
        .eq('workspace_id', workspaceId);

      if (tasksError) throw tasksError;

      // Fetch team members count
      const { count: teamMembersCount, error: membersError } = await supabase
        .from('workspace_team_members')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      if (membersError) throw membersError;

      // Fetch pending approvals - skip if no tasks
      let pendingApprovalsCount = 0;
      if (tasks && tasks.length > 0) {
        const { count } = await supabase
          .from('task_approval_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'PENDING')
          .in('task_id', tasks.map((t) => t.id));
        pendingApprovalsCount = count || 0;
      }

      // Calculate stats from tasks
      const taskList = tasks || [];
      const totalTasks = taskList.length;
      const completedTasks = taskList.filter(
        (t) => t.status === TaskStatus.COMPLETED
      ).length;
      const inProgressTasks = taskList.filter(
        (t) => t.status === TaskStatus.IN_PROGRESS
      ).length;
      const overdueTasks = taskList.filter(
        (t) =>
          t.due_date &&
          new Date(t.due_date) < new Date(now) &&
          t.status !== TaskStatus.COMPLETED
      ).length;
      const upcomingDeadlines = taskList.filter(
        (t) =>
          t.due_date &&
          new Date(t.due_date) >= new Date(now) &&
          new Date(t.due_date) <= new Date(weekFromNow) &&
          t.status !== TaskStatus.COMPLETED
      ).length;
      const recentActivity = taskList.filter(
        (t) => t.updated_at && new Date(t.updated_at) >= new Date(dayAgo)
      ).length;

      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        pendingApprovals: pendingApprovalsCount || 0,
        teamMembers: teamMembersCount || 0,
        completionRate,
        upcomingDeadlines,
        recentActivity,
      };
    },
    enabled: !!workspaceId,
    staleTime: 30000, // 30 seconds - stats update frequently
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook for fetching aggregated department stats (combines child workspaces)
 */
export function useDepartmentStats(workspaceId: string) {
  const queryKey = ['department-stats', workspaceId];

  return useQuery({
    queryKey,
    queryFn: async () => {
      // Get child workspaces
      const { data: childWorkspaces, error: childError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('parent_workspace_id', workspaceId);

      if (childError) throw childError;

      const workspaceIds = [workspaceId, ...(childWorkspaces?.map((w) => w.id) || [])];

      const now = new Date().toISOString();

      // Fetch all tasks across all child workspaces
      const { data: tasks, error: tasksError } = await supabase
        .from('workspace_tasks')
        .select('id, status, due_date')
        .in('workspace_id', workspaceIds);

      if (tasksError) throw tasksError;

      // Fetch team members count across all workspaces
      const { count: teamMembersCount, error: membersError } = await supabase
        .from('workspace_team_members')
        .select('id', { count: 'exact', head: true })
        .in('workspace_id', workspaceIds);

      if (membersError) throw membersError;

      const taskList = tasks || [];
      const totalTasks = taskList.length;
      const completedTasks = taskList.filter(
        (t) => t.status === TaskStatus.COMPLETED
      ).length;
      const inProgressTasks = taskList.filter(
        (t) => t.status === TaskStatus.IN_PROGRESS
      ).length;
      const overdueTasks = taskList.filter(
        (t) =>
          t.due_date &&
          new Date(t.due_date) < new Date(now) &&
          t.status !== TaskStatus.COMPLETED
      ).length;

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        teamMembers: teamMembersCount || 0,
        childWorkspaces: childWorkspaces?.length || 0,
        completionRate:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    },
    enabled: !!workspaceId,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });
}
