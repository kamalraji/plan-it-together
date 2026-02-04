import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useMyWorkspaces } from './useMyWorkspaces';
import { queryPresets } from '@/lib/query-config';

export interface MyAssignment {
  id: string;
  type: 'task' | 'checklist';
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string | null;
  progress?: number;
  workspace: {
    id: string;
    name: string;
    type: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentStats {
  total: number;
  overdue: number;
  dueToday: number;
  completedThisWeek: number;
  inProgress: number;
}

export function useMyAssignments(eventId?: string) {
  const { user, isLoading: authLoading } = useAuth();
  const { data: myWorkspaces, isLoading: workspacesLoading } = useMyWorkspaces(eventId);

  const query = useQuery({
    queryKey: ['my-assignments', user?.id, eventId, myWorkspaces?.map(w => w.id)],
    enabled: !!user && !authLoading && !workspacesLoading && !!myWorkspaces?.length,
    ...queryPresets.dynamic,
    queryFn: async (): Promise<{ assignments: MyAssignment[]; stats: AssignmentStats }> => {
      if (!user || !myWorkspaces?.length) {
        return { assignments: [], stats: { total: 0, overdue: 0, dueToday: 0, completedThisWeek: 0, inProgress: 0 } };
      }

      const workspaceIds = myWorkspaces.map(w => w.id);
      const workspaceMap = new Map(myWorkspaces.map(w => [w.id, { name: w.name, type: w.workspace_type }]));

      // Fetch tasks assigned to user
      const { data: tasks, error: tasksError } = await supabase
        .from('workspace_tasks')
        .select('id, title, description, status, priority, due_date, progress, workspace_id, created_at, updated_at')
        .eq('assigned_to', user.id)
        .in('workspace_id', workspaceIds)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        throw tasksError;
      }

      // Fetch checklists from user's workspaces (delegated or owned)
      const { data: checklists, error: checklistsError } = await supabase
        .from('workspace_checklists')
        .select('id, title, due_date, delegation_status, workspace_id, created_at, updated_at, items')
        .in('workspace_id', workspaceIds)
        .not('delegation_status', 'is', null)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (checklistsError) {
        console.error('Error fetching checklists:', checklistsError);
        throw checklistsError;
      }

      // Transform tasks to assignments
      const taskAssignments: MyAssignment[] = (tasks || []).map(task => ({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        description: task.description || undefined,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        progress: task.progress || undefined,
        workspace: {
          id: task.workspace_id,
          name: workspaceMap.get(task.workspace_id)?.name || 'Unknown',
          type: workspaceMap.get(task.workspace_id)?.type || null,
        },
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      }));

      // Transform checklists to assignments
      const checklistAssignments: MyAssignment[] = (checklists || []).map(checklist => {
        const items = Array.isArray(checklist.items) ? checklist.items : [];
        const completedItems = items.filter((item: any) => item?.checked === true).length;
        const progress = items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0;
        
        return {
          id: checklist.id,
          type: 'checklist' as const,
          title: checklist.title,
          status: checklist.delegation_status || 'pending',
          priority: 'MEDIUM',
          dueDate: checklist.due_date,
          progress,
          workspace: {
            id: checklist.workspace_id,
            name: workspaceMap.get(checklist.workspace_id)?.name || 'Unknown',
            type: workspaceMap.get(checklist.workspace_id)?.type || null,
          },
          createdAt: checklist.created_at,
          updatedAt: checklist.updated_at,
        };
      });

      const allAssignments = [...taskAssignments, ...checklistAssignments].sort((a, b) => {
        // Sort by due date, nulls last
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: AssignmentStats = {
        total: allAssignments.length,
        overdue: allAssignments.filter(a => {
          if (!a.dueDate || a.status === 'DONE' || a.status === 'completed') return false;
          return new Date(a.dueDate) < today;
        }).length,
        dueToday: allAssignments.filter(a => {
          if (!a.dueDate) return false;
          const dueDate = new Date(a.dueDate);
          return dueDate.toDateString() === today.toDateString();
        }).length,
        completedThisWeek: allAssignments.filter(a => {
          if (a.status !== 'DONE' && a.status !== 'completed') return false;
          const updated = new Date(a.updatedAt);
          return updated >= weekAgo;
        }).length,
        inProgress: allAssignments.filter(a => 
          a.status === 'IN_PROGRESS' || a.status === 'in_progress'
        ).length,
      };

      return { assignments: allAssignments, stats };
    },
  });

  // Derived data
  const assignments = query.data?.assignments || [];
  const stats = query.data?.stats || { total: 0, overdue: 0, dueToday: 0, completedThisWeek: 0, inProgress: 0 };

  const tasks = assignments.filter(a => a.type === 'task');
  const checklists = assignments.filter(a => a.type === 'checklist');
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const overdue = assignments.filter(a => {
    if (!a.dueDate || a.status === 'DONE' || a.status === 'completed') return false;
    return new Date(a.dueDate) < today;
  });

  const dueToday = assignments.filter(a => {
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    return dueDate.toDateString() === today.toDateString();
  });

  return {
    assignments,
    tasks,
    checklists,
    overdue,
    dueToday,
    stats,
    isLoading: query.isLoading || authLoading || workspacesLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
