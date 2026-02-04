import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceType, WorkspaceStatus } from '@/types';

export interface WorkspaceWithStats {
  id: string;
  name: string;
  slug: string | null;
  workspaceType: WorkspaceType;
  status: WorkspaceStatus;
  parentWorkspaceId: string | null;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
  inProgressTaskCount: number;
}

export interface WorkspaceHierarchyStats {
  totalWorkspaces: number;
  byType: Record<WorkspaceType, number>;
  byStatus: Record<string, number>;
  totalMembers: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
}

export function useAllWorkspacesData(eventId: string | undefined) {
  return useQuery({
    queryKey: ['all-workspaces-management', eventId],
    queryFn: async () => {
      if (!eventId) return { workspaces: [], stats: getEmptyStats() };

      // Fetch all workspaces for this event
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select('id, name, slug, workspace_type, status, parent_workspace_id, department_id, created_at, updated_at')
        .eq('event_id', eventId)
        .order('workspace_type')
        .order('name');

      if (workspacesError) throw workspacesError;

      // Fetch member counts per workspace
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_team_members')
        .select('workspace_id')
        .in('workspace_id', workspacesData?.map(w => w.id) || [])
        .eq('status', 'ACTIVE');

      if (membersError) throw membersError;

      // Fetch task counts per workspace
      const { data: tasksData, error: tasksError } = await supabase
        .from('workspace_tasks')
        .select('workspace_id, status')
        .in('workspace_id', workspacesData?.map(w => w.id) || []);

      if (tasksError) throw tasksError;

      // Aggregate member counts
      const memberCountMap = new Map<string, number>();
      membersData?.forEach(m => {
        memberCountMap.set(m.workspace_id, (memberCountMap.get(m.workspace_id) || 0) + 1);
      });

      // Aggregate task counts
      const taskCountMap = new Map<string, { total: number; completed: number; inProgress: number }>();
      tasksData?.forEach(t => {
        const current = taskCountMap.get(t.workspace_id) || { total: 0, completed: 0, inProgress: 0 };
        current.total += 1;
        if (t.status === 'COMPLETED') current.completed += 1;
        if (t.status === 'IN_PROGRESS') current.inProgress += 1;
        taskCountMap.set(t.workspace_id, current);
      });

      // Build workspace list with stats
      const workspaces: WorkspaceWithStats[] = (workspacesData || []).map(ws => {
        const tasks = taskCountMap.get(ws.id) || { total: 0, completed: 0, inProgress: 0 };
        return {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          workspaceType: ws.workspace_type as WorkspaceType,
          status: ws.status as WorkspaceStatus,
          parentWorkspaceId: ws.parent_workspace_id,
          departmentId: ws.department_id,
          createdAt: ws.created_at,
          updatedAt: ws.updated_at,
          memberCount: memberCountMap.get(ws.id) || 0,
          taskCount: tasks.total,
          completedTaskCount: tasks.completed,
          inProgressTaskCount: tasks.inProgress,
        };
      });

      // Calculate aggregate stats
      const stats = calculateStats(workspaces);

      return { workspaces, stats };
    },
    enabled: !!eventId,
    staleTime: 30000, // 30 seconds
  });
}

function getEmptyStats(): WorkspaceHierarchyStats {
  return {
    totalWorkspaces: 0,
    byType: {
      [WorkspaceType.ROOT]: 0,
      [WorkspaceType.DEPARTMENT]: 0,
      [WorkspaceType.COMMITTEE]: 0,
      [WorkspaceType.TEAM]: 0,
    },
    byStatus: {},
    totalMembers: 0,
    totalTasks: 0,
    completedTasks: 0,
    taskCompletionRate: 0,
  };
}

function calculateStats(workspaces: WorkspaceWithStats[]): WorkspaceHierarchyStats {
  const stats = getEmptyStats();
  
  workspaces.forEach(ws => {
    stats.totalWorkspaces += 1;
    stats.byType[ws.workspaceType] = (stats.byType[ws.workspaceType] || 0) + 1;
    stats.byStatus[ws.status] = (stats.byStatus[ws.status] || 0) + 1;
    stats.totalMembers += ws.memberCount;
    stats.totalTasks += ws.taskCount;
    stats.completedTasks += ws.completedTaskCount;
  });
  
  stats.taskCompletionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;
  
  return stats;
}
