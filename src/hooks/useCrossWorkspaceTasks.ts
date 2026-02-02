import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { queryPresets } from '@/lib/query-config';

export interface CrossWorkspaceTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  parentTaskId: string | null;
  targetWorkspace: {
    id: string;
    name: string;
    type: string | null;
  };
  assignee: {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
  // Sync status indicator
  isSynced: boolean;
}

interface UseCrossWorkspaceTasksOptions {
  sourceWorkspaceId: string;
}

/**
 * Hook to fetch tasks that were delegated to child workspaces from this workspace.
 * These are tasks where source_workspace_id matches the current workspace.
 */
export function useCrossWorkspaceTasks({ sourceWorkspaceId }: UseCrossWorkspaceTasksOptions) {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['cross-workspace-tasks', sourceWorkspaceId],
    enabled: !!user && !authLoading && !!sourceWorkspaceId,
    ...queryPresets.standard,
    queryFn: async (): Promise<CrossWorkspaceTask[]> => {
      if (!sourceWorkspaceId) return [];

      // Fetch tasks where source_workspace_id = sourceWorkspaceId
      // This means they were created from this workspace and assigned to child workspaces
      const { data: tasks, error: tasksError } = await supabase
        .from('workspace_tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          due_date,
          created_at,
          workspace_id,
          assigned_to,
          parent_task_id
        `)
        .eq('source_workspace_id', sourceWorkspaceId)
        .order('created_at', { ascending: false });

      if (tasksError) {
        throw tasksError;
      }

      if (!tasks?.length) return [];

      // Get workspace info for target workspaces
      const workspaceIds = [...new Set(tasks.map(t => t.workspace_id))];
      const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id, name, workspace_type')
        .in('id', workspaceIds);

      if (wsError) {
        // Workspace fetch failed - continue with empty map
      }

      // Get assignee profiles
      const assigneeIds = tasks.map(t => t.assigned_to).filter(Boolean) as string[];
      let profiles: { id: string; full_name: string | null; avatar_url: string | null }[] = [];
      
      if (assigneeIds.length > 0) {
        const { data: profileData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .in('id', assigneeIds);

        if (profilesError) {
          // Profile fetch failed - continue with empty profiles
        } else {
          profiles = profileData || [];
        }
      }

      // Build workspace and profile maps
      const workspaceMap = new Map(workspaces?.map(w => [w.id, w]) || []);
      const profileMap = new Map(profiles.map(p => [p.id, p]));

      // Transform to CrossWorkspaceTask format
      return tasks.map(task => {
        const workspace = workspaceMap.get(task.workspace_id);
        const profile = task.assigned_to ? profileMap.get(task.assigned_to) : null;

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.due_date,
          createdAt: task.created_at,
          parentTaskId: task.parent_task_id,
          targetWorkspace: {
            id: task.workspace_id,
            name: workspace?.name || 'Unknown',
            type: workspace?.workspace_type || null,
          },
          assignee: profile ? {
            userId: task.assigned_to!,
            fullName: profile.full_name || 'Unknown',
            avatarUrl: profile.avatar_url,
          } : null,
          isSynced: !!task.parent_task_id, // Task is synced if it has a parent
        };
      });
    },
  });
}
