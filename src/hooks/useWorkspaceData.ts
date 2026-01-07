import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Workspace,
  WorkspaceStatus,
  WorkspaceType,
  WorkspaceTask,
  TeamMember,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  WorkspaceRoleScope,
} from '@/types';
import { queryPresets } from '@/lib/query-config';

/**
 * Shared hook for fetching workspace data
 * Used by both desktop and mobile workspace dashboards
 */
export function useWorkspaceData(workspaceId: string | undefined) {
  // Fetch workspace - uses standard preset (5 min stale, 30 min gc)
  const workspaceQuery = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, status, created_at, updated_at, event_id, parent_workspace_id, workspace_type, department_id')
        .eq('id', workspaceId as string)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Workspace not found');

      return {
        id: data.id,
        eventId: data.event_id,
        name: data.name,
        status: data.status as WorkspaceStatus,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        description: undefined,
        event: undefined,
        teamMembers: [],
        taskSummary: undefined,
        channels: [],
        parentWorkspaceId: data.parent_workspace_id,
        workspaceType: data.workspace_type as WorkspaceType | undefined,
        departmentId: data.department_id || undefined,
      } as unknown as Workspace;
    },
    enabled: !!workspaceId,
    staleTime: queryPresets.standard.staleTime,
    gcTime: queryPresets.standard.gcTime,
  });

  // Fetch user workspaces for switching (scoped to the same event)
  const userWorkspacesQuery = useQuery({
    queryKey: ['user-workspaces', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [] as Workspace[];

      const { data: current, error: currentError } = await supabase
        .from('workspaces')
        .select('event_id')
        .eq('id', workspaceId as string)
        .maybeSingle();

      if (currentError) throw currentError;

      const eventId = current?.event_id;

      let query = supabase
        .from('workspaces')
        .select('id, name, status, created_at, updated_at, event_id, parent_workspace_id, workspace_type, department_id')
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        name: row.name,
        status: row.status as WorkspaceStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        description: undefined,
        event: undefined,
        teamMembers: [],
        taskSummary: undefined,
        channels: [],
        parentWorkspaceId: row.parent_workspace_id,
        workspaceType: row.workspace_type as WorkspaceType | undefined,
        departmentId: row.department_id || undefined,
      })) as unknown as Workspace[];
    },
    enabled: !!workspaceId,
    staleTime: queryPresets.standard.staleTime,
    gcTime: queryPresets.standard.gcTime,
  });

  // Fetch tasks - uses dynamic preset (1 min stale, 5 min gc) since tasks change frequently
  const tasksQuery = useQuery({
    queryKey: ['workspace-tasks', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, workspace_id, title, description, priority, status, due_date, assigned_to, role_scope')
        .eq('workspace_id', workspaceId as string)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        title: row.title,
        description: row.description || '',
        category: TaskCategory.LOGISTICS,
        priority: row.priority as TaskPriority,
        status: row.status as TaskStatus,
        progress: 0,
        dueDate: row.due_date || undefined,
        dependencies: [],
        tags: [],
        metadata: {},
        roleScope: row.role_scope as WorkspaceRoleScope | undefined,
      })) as unknown as WorkspaceTask[];
    },
    enabled: !!workspaceId,
    staleTime: queryPresets.dynamic.staleTime,
    gcTime: queryPresets.dynamic.gcTime,
  });

  // Fetch team members - uses standard preset (team membership doesn't change often)
  const teamMembersQuery = useQuery({
    queryKey: ['workspace-team-members', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('id, user_id, role, status, joined_at, left_at')
        .eq('workspace_id', workspaceId as string)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        role: row.role,
        status: row.status,
        joinedAt: row.joined_at,
        leftAt: row.left_at || undefined,
        user: {
          id: row.user_id,
          name: 'Member',
          email: '',
        },
      })) as TeamMember[];
    },
    enabled: !!workspaceId,
    staleTime: queryPresets.standard.staleTime,
    gcTime: queryPresets.standard.gcTime,
  });

  return {
    workspace: workspaceQuery.data,
    isLoading: workspaceQuery.isLoading,
    error: workspaceQuery.error,
    userWorkspaces: userWorkspacesQuery.data || [],
    tasks: tasksQuery.data || [],
    isTasksLoading: tasksQuery.isLoading,
    teamMembers: teamMembersQuery.data || [],
  };
}
