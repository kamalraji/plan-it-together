import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WORKSPACE_DEPARTMENTS } from '@/lib/workspaceHierarchy';
import { queryPresets } from '@/lib/query-config';

export interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  workspaceId: string;
  workspaceName: string;
  memberCount: number;
  committeeCount: number;
  tasksTotal: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksBlocked: number;
  budgetAllocated: number;
  budgetUsed: number;
  resourcesTotal: number;
  resourcesAvailable: number;
}

export interface EventHealthMetrics {
  totalWorkspaces: number;
  totalMembers: number;
  totalTasks: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksTodo: number;
  tasksBlocked: number;
  overallProgress: number;
  departmentProgress: Record<string, number>;
  totalBudget: number;
  usedBudget: number;
  budgetUtilization: number;
}

export interface RootDashboardData {
  departments: DepartmentStats[];
  eventHealth: EventHealthMetrics;
  recentActivity: {
    id: string;
    title: string;
    type: string;
    createdAt: string;
    actorName: string | null;
  }[];
  upcomingMilestones: {
    id: string;
    title: string;
    dueDate: string | null;
    workspaceName: string;
    status: string;
  }[];
}

export function useRootDashboard(eventId: string | undefined) {
  // Fetch all workspaces for this event - optimized select
  const workspacesQuery = useQuery({
    queryKey: ['root-dashboard-workspaces', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, status, workspace_type, department_id, parent_workspace_id, created_at')
        .eq('event_id', eventId)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
    staleTime: queryPresets.standard.staleTime,
    gcTime: queryPresets.standard.gcTime,
  });

  // Fetch all tasks across the event - only fields needed for aggregation
  const tasksQuery = useQuery({
    queryKey: ['root-dashboard-tasks', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const workspaceIds = workspacesQuery.data?.map(w => w.id) || [];
      if (workspaceIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, workspace_id, status')
        .in('workspace_id', workspaceIds);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId && (workspacesQuery.data?.length ?? 0) > 0,
    staleTime: queryPresets.dynamic.staleTime,
    gcTime: queryPresets.dynamic.gcTime,
  });

  // Fetch all team members - only fields needed for counting
  const membersQuery = useQuery({
    queryKey: ['root-dashboard-members', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const workspaceIds = workspacesQuery.data?.map(w => w.id) || [];
      if (workspaceIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('id, workspace_id, user_id')
        .in('workspace_id', workspaceIds)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return data;
    },
    enabled: !!eventId && (workspacesQuery.data?.length ?? 0) > 0,
    staleTime: queryPresets.standard.staleTime,
    gcTime: queryPresets.standard.gcTime,
  });

  // Fetch budgets - only fields needed for aggregation
  const budgetsQuery = useQuery({
    queryKey: ['root-dashboard-budgets', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const workspaceIds = workspacesQuery.data?.map(w => w.id) || [];
      if (workspaceIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('workspace_budgets')
        .select('id, workspace_id, allocated, used')
        .in('workspace_id', workspaceIds);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId && (workspacesQuery.data?.length ?? 0) > 0,
    staleTime: queryPresets.standard.staleTime,
    gcTime: queryPresets.standard.gcTime,
  });

  // Fetch resources - only fields needed for aggregation
  const resourcesQuery = useQuery({
    queryKey: ['root-dashboard-resources', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const workspaceIds = workspacesQuery.data?.map(w => w.id) || [];
      if (workspaceIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('workspace_resources')
        .select('id, workspace_id, quantity, available')
        .in('workspace_id', workspaceIds);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId && (workspacesQuery.data?.length ?? 0) > 0,
    staleTime: queryPresets.standard.staleTime,
    gcTime: queryPresets.standard.gcTime,
  });

  // Fetch recent activities - only fields needed for display
  const activitiesQuery = useQuery({
    queryKey: ['root-dashboard-activities', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const workspaceIds = workspacesQuery.data?.map(w => w.id) || [];
      if (workspaceIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('workspace_activities')
        .select('id, title, type, created_at, actor_name')
        .in('workspace_id', workspaceIds)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId && (workspacesQuery.data?.length ?? 0) > 0,
    staleTime: queryPresets.realtime.staleTime,
    gcTime: queryPresets.realtime.gcTime,
  });

  // Fetch upcoming milestones - only fields needed for display
  const milestonesQuery = useQuery({
    queryKey: ['root-dashboard-milestones', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const workspaceIds = workspacesQuery.data?.map(w => w.id) || [];
      if (workspaceIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('workspace_milestones')
        .select('id, title, due_date, workspace_id, status')
        .in('workspace_id', workspaceIds)
        .neq('status', 'completed')
        .order('due_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId && (workspacesQuery.data?.length ?? 0) > 0,
    staleTime: queryPresets.dynamic.staleTime,
    gcTime: queryPresets.dynamic.gcTime,
  });

  // Compute department stats
  const computeDepartmentStats = (): DepartmentStats[] => {
    const workspaces = workspacesQuery.data || [];
    const tasks = tasksQuery.data || [];
    const members = membersQuery.data || [];
    const budgets = budgetsQuery.data || [];
    const resources = resourcesQuery.data || [];

    // Find department workspaces
    const departmentWorkspaces = workspaces.filter(w => w.workspace_type === 'DEPARTMENT');

    return departmentWorkspaces.map(deptWs => {
      const deptInfo = WORKSPACE_DEPARTMENTS.find(d => d.id === deptWs.department_id);
      
      // Get all child workspaces (committees and teams)
      const childIds = new Set<string>();
      const getDescendants = (parentId: string) => {
        workspaces
          .filter(w => w.parent_workspace_id === parentId)
          .forEach(w => {
            childIds.add(w.id);
            getDescendants(w.id);
          });
      };
      childIds.add(deptWs.id);
      getDescendants(deptWs.id);

      // Aggregate stats for department and all descendants
      const deptTasks = tasks.filter(t => childIds.has(t.workspace_id));
      const deptMembers = members.filter(m => childIds.has(m.workspace_id));
      const deptBudgets = budgets.filter(b => childIds.has(b.workspace_id));
      const deptResources = resources.filter(r => childIds.has(r.workspace_id));
      const committeeCount = workspaces.filter(
        w => w.parent_workspace_id === deptWs.id && w.workspace_type === 'COMMITTEE'
      ).length;

      return {
        departmentId: deptWs.department_id || 'unknown',
        departmentName: deptInfo?.name || deptWs.name,
        workspaceId: deptWs.id,
        workspaceName: deptWs.name,
        memberCount: deptMembers.length,
        committeeCount,
        tasksTotal: deptTasks.length,
        tasksCompleted: deptTasks.filter(t => t.status === 'DONE').length,
        tasksInProgress: deptTasks.filter(t => t.status === 'IN_PROGRESS').length,
        tasksBlocked: deptTasks.filter(t => t.status === 'BLOCKED').length,
        budgetAllocated: deptBudgets.reduce((sum, b) => sum + (b.allocated || 0), 0),
        budgetUsed: deptBudgets.reduce((sum, b) => sum + (b.used || 0), 0),
        resourcesTotal: deptResources.reduce((sum, r) => sum + (r.quantity || 0), 0),
        resourcesAvailable: deptResources.reduce((sum, r) => sum + (r.available || 0), 0),
      };
    });
  };

  // Compute event health metrics
  const computeEventHealth = (): EventHealthMetrics => {
    const workspaces = workspacesQuery.data || [];
    const tasks = tasksQuery.data || [];
    const members = membersQuery.data || [];
    const budgets = budgetsQuery.data || [];

    const uniqueMembers = new Set(members.map(m => m.user_id)).size;
    const totalTasks = tasks.length;
    const tasksCompleted = tasks.filter(t => t.status === 'DONE').length;
    const tasksInProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const tasksTodo = tasks.filter(t => t.status === 'TODO').length;
    const tasksBlocked = tasks.filter(t => t.status === 'BLOCKED').length;

    const totalBudget = budgets.reduce((sum, b) => sum + (b.allocated || 0), 0);
    const usedBudget = budgets.reduce((sum, b) => sum + (b.used || 0), 0);

    // Calculate department-level progress
    const departmentProgress: Record<string, number> = {};
    const departmentWorkspaces = workspaces.filter(w => w.workspace_type === 'DEPARTMENT');
    
    departmentWorkspaces.forEach(deptWs => {
      const childIds = new Set<string>();
      const getDescendants = (parentId: string) => {
        workspaces
          .filter(w => w.parent_workspace_id === parentId)
          .forEach(w => {
            childIds.add(w.id);
            getDescendants(w.id);
          });
      };
      childIds.add(deptWs.id);
      getDescendants(deptWs.id);

      const deptTasks = tasks.filter(t => childIds.has(t.workspace_id));
      const deptCompleted = deptTasks.filter(t => t.status === 'DONE').length;
      departmentProgress[deptWs.department_id || deptWs.id] = 
        deptTasks.length > 0 ? (deptCompleted / deptTasks.length) * 100 : 0;
    });

    return {
      totalWorkspaces: workspaces.length,
      totalMembers: uniqueMembers,
      totalTasks,
      tasksCompleted,
      tasksInProgress,
      tasksTodo,
      tasksBlocked,
      overallProgress: totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0,
      departmentProgress,
      totalBudget,
      usedBudget,
      budgetUtilization: totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0,
    };
  };

  // Build recent activity list
  const buildRecentActivity = () => {
    const activities = activitiesQuery.data || [];
    return activities.map(a => ({
      id: a.id,
      title: a.title,
      type: a.type,
      createdAt: a.created_at,
      actorName: a.actor_name,
    }));
  };

  // Build upcoming milestones list
  const buildUpcomingMilestones = () => {
    const milestones = milestonesQuery.data || [];
    const workspaces = workspacesQuery.data || [];
    
    return milestones.map(m => {
      const workspace = workspaces.find(w => w.id === m.workspace_id);
      return {
        id: m.id,
        title: m.title,
        dueDate: m.due_date,
        workspaceName: workspace?.name || 'Unknown',
        status: m.status,
      };
    });
  };

  const isLoading = 
    workspacesQuery.isLoading || 
    tasksQuery.isLoading || 
    membersQuery.isLoading ||
    budgetsQuery.isLoading ||
    resourcesQuery.isLoading;

  const dashboardData: RootDashboardData = {
    departments: computeDepartmentStats(),
    eventHealth: computeEventHealth(),
    recentActivity: buildRecentActivity(),
    upcomingMilestones: buildUpcomingMilestones(),
  };

  return {
    data: dashboardData,
    isLoading,
    refetch: () => {
      workspacesQuery.refetch();
      tasksQuery.refetch();
      membersQuery.refetch();
      budgetsQuery.refetch();
      resourcesQuery.refetch();
      activitiesQuery.refetch();
      milestonesQuery.refetch();
    },
  };
}

/**
 * Get color classes for department based on ID
 */
export function getDepartmentColor(departmentId: string): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  const colors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    operations: { 
      bg: 'bg-info/10', 
      text: 'text-blue-600 dark:text-blue-400', 
      border: 'border-info/20',
      icon: 'text-info',
    },
    growth: { 
      bg: 'bg-success/10', 
      text: 'text-green-600 dark:text-green-400', 
      border: 'border-success/20',
      icon: 'text-success',
    },
    content: { 
      bg: 'bg-primary/10', 
      text: 'text-purple-600 dark:text-purple-400', 
      border: 'border-purple-500/20',
      icon: 'text-primary',
    },
    tech_finance: { 
      bg: 'bg-orange-500/10', 
      text: 'text-orange-600 dark:text-orange-400', 
      border: 'border-orange-500/20',
      icon: 'text-orange-500',
    },
    volunteers: { 
      bg: 'bg-pink-500/10', 
      text: 'text-pink-600 dark:text-pink-400', 
      border: 'border-pink-500/20',
      icon: 'text-pink-500',
    },
  };

  return colors[departmentId] || { 
    bg: 'bg-muted', 
    text: 'text-foreground', 
    border: 'border-border',
    icon: 'text-muted-foreground',
  };
}
