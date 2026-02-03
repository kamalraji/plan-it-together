import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { queryPresets } from '@/lib/query-config';

/**
 * Hook to prefetch workspace-related data for improved navigation performance.
 * Call prefetch functions when users hover over or are likely to navigate to certain tabs.
 */
export function useWorkspacePrefetch(workspaceId: string) {
  const queryClient = useQueryClient();

  // Prefetch tasks when user might navigate to tasks tab
  const prefetchTasks = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['workspace-tasks', workspaceId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('workspace_tasks')
          .select(`
            *,
            assignee:workspace_team_members!workspace_tasks_assigned_to_fkey(
              id,
              user_id,
              user_profiles:user_id(full_name, avatar_url)
            ),
            creator:workspace_team_members!workspace_tasks_created_by_fkey(
              id,
              user_id,
              user_profiles:user_id(full_name, avatar_url)
            )
          `)
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      staleTime: queryPresets.standard.staleTime,
    });
  }, [queryClient, workspaceId]);

  // Prefetch team members when user might navigate to team tab
  const prefetchTeamMembers = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['workspace-team-members', workspaceId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('workspace_team_members')
          .select(`
            *,
            user_profiles:user_id(full_name, avatar_url, email)
          `)
          .eq('workspace_id', workspaceId)
          .eq('status', 'ACTIVE');
        if (error) throw error;
        return data;
      },
      staleTime: queryPresets.standard.staleTime,
    });
  }, [queryClient, workspaceId]);

  // Prefetch analytics data when user might navigate to analytics tab
  const prefetchAnalytics = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['workspace-analytics', workspaceId],
      queryFn: async () => {
        // Fetch workspace-related analytics data
        const { data, error } = await supabase
          .from('workspace_tasks')
          .select('status, priority, created_at')
          .eq('workspace_id', workspaceId);
        if (error) throw error;
        return data;
      },
      staleTime: queryPresets.standard.staleTime,
    });
  }, [queryClient, workspaceId]);

  // Prefetch communication channels
  const prefetchCommunication = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['workspace-channels', workspaceId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('workspace_channels')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      staleTime: queryPresets.standard.staleTime,
    });
  }, [queryClient, workspaceId]);

  // Prefetch child workspaces when user might navigate to workspace management
  const prefetchChildWorkspaces = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['child-workspaces', workspaceId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('parent_workspace_id', workspaceId)
          .order('name', { ascending: true });
        if (error) throw error;
        return data;
      },
      staleTime: queryPresets.standard.staleTime,
    });
  }, [queryClient, workspaceId]);

  // Prefetch all commonly used data
  const prefetchAll = useCallback(() => {
    prefetchTasks();
    prefetchTeamMembers();
    prefetchAnalytics();
    prefetchCommunication();
  }, [prefetchTasks, prefetchTeamMembers, prefetchAnalytics, prefetchCommunication]);

  return {
    prefetchTasks,
    prefetchTeamMembers,
    prefetchAnalytics,
    prefetchCommunication,
    prefetchChildWorkspaces,
    prefetchAll,
  };
}
