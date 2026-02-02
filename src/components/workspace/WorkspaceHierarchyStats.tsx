import { useQuery } from '@tanstack/react-query';
import { Users, CheckCircle2, Clock, AlertCircle, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { MAX_WORKSPACE_DEPTH } from '@/lib/workspaceHierarchy';

interface WorkspaceHierarchyStatsProps {
  eventId: string;
}

interface LevelStats {
  level: number;
  label: string;
  workspaceCount: number;
  totalMembers: number;
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
  };
  membersByRole: Record<string, number>;
}

export function WorkspaceHierarchyStats({
  eventId,
}: WorkspaceHierarchyStatsProps) {
  // Fetch all workspaces for the event
  const { data: workspaces } = useQuery({
    queryKey: ['hierarchy-stats-workspaces', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, parent_workspace_id')
        .eq('event_id', eventId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  // Fetch all team members for these workspaces
  const { data: teamMembers } = useQuery({
    queryKey: ['hierarchy-stats-members', eventId],
    queryFn: async () => {
      if (!workspaces?.length) return [];

      const workspaceIds = workspaces.map((ws) => ws.id);
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('workspace_id, role, status')
        .in('workspace_id', workspaceIds)
        .eq('status', 'ACTIVE');

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaces?.length,
  });

  // Fetch all tasks for these workspaces
  const { data: tasks } = useQuery({
    queryKey: ['hierarchy-stats-tasks', eventId],
    queryFn: async () => {
      if (!workspaces?.length) return [];

      const workspaceIds = workspaces.map((ws) => ws.id);
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('workspace_id, status')
        .in('workspace_id', workspaceIds);

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaces?.length,
  });

  // Calculate depth for each workspace and aggregate stats by level
  const levelStats = (() => {
    if (!workspaces) return [];

    // Build parent map
    const parentMap = new Map<string, string | null>();
    workspaces.forEach((ws) => parentMap.set(ws.id, ws.parent_workspace_id));

    // Calculate depth for each workspace
    const getDepth = (id: string): number => {
      let depth = 1;
      let currentId: string | null = parentMap.get(id) ?? null;
      while (currentId) {
        depth++;
        currentId = parentMap.get(currentId) ?? null;
      }
      return depth;
    };

    // Group workspaces by depth
    const workspacesByDepth = new Map<number, string[]>();
    workspaces.forEach((ws) => {
      const depth = getDepth(ws.id);
      const existing = workspacesByDepth.get(depth) || [];
      existing.push(ws.id);
      workspacesByDepth.set(depth, existing);
    });

    // Aggregate stats for each level
    const stats: LevelStats[] = [];

    for (let level = 1; level <= MAX_WORKSPACE_DEPTH; level++) {
      const wsIds = workspacesByDepth.get(level) || [];

      // Count members in these workspaces
      const levelMembers = teamMembers?.filter((m) => wsIds.includes(m.workspace_id)) || [];
      const membersByRole: Record<string, number> = {};
      levelMembers.forEach((m) => {
        membersByRole[m.role] = (membersByRole[m.role] || 0) + 1;
      });

      // Count tasks in these workspaces
      const levelTasks = tasks?.filter((t) => wsIds.includes(t.workspace_id)) || [];
      const taskStats = {
        total: levelTasks.length,
        completed: levelTasks.filter((t) => t.status === 'COMPLETED').length,
        inProgress: levelTasks.filter((t) => t.status === 'IN_PROGRESS').length,
        blocked: levelTasks.filter((t) => t.status === 'BLOCKED').length,
      };

      const label =
        level === 1
          ? 'Root'
          : level === 2
          ? 'Departments'
          : level === 3
          ? 'Committees'
          : 'Teams';

      stats.push({
        level,
        label,
        workspaceCount: wsIds.length,
        totalMembers: levelMembers.length,
        taskStats,
        membersByRole,
      });
    }

    return stats;
  })();

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return {
          bg: 'bg-primary/10',
          border: 'border-primary/20',
          text: 'text-primary',
          progress: 'bg-primary',
        };
      case 2:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-600 dark:text-blue-400',
          progress: 'bg-blue-500',
        };
      case 3:
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-800',
          text: 'text-amber-600 dark:text-amber-400',
          progress: 'bg-amber-500',
        };
      case 4:
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-emerald-200 dark:border-emerald-800',
          text: 'text-emerald-600 dark:text-emerald-400',
          progress: 'bg-emerald-500',
        };
      default:
        return {
          bg: 'bg-muted',
          border: 'border-border',
          text: 'text-muted-foreground',
          progress: 'bg-muted-foreground',
        };
    }
  };

  const totalMembers = levelStats.reduce((sum, l) => sum + l.totalMembers, 0);
  const totalTasks = levelStats.reduce((sum, l) => sum + l.taskStats.total, 0);
  const totalCompleted = levelStats.reduce((sum, l) => sum + l.taskStats.completed, 0);
  const overallProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Hierarchy Overview</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          {totalMembers} members · {totalTasks} tasks
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-medium text-foreground">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Level Cards */}
      <div className="space-y-3">
        {levelStats.map((stat) => {
          const colors = getLevelColor(stat.level);
          const progress =
            stat.taskStats.total > 0
              ? Math.round((stat.taskStats.completed / stat.taskStats.total) * 100)
              : 0;

          // Skip levels with no workspaces
          if (stat.workspaceCount === 0) return null;

          return (
            <div
              key={stat.level}
              className={cn(
                'rounded-lg border p-3 transition-all',
                colors.bg,
                colors.border,
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
                      colors.text,
                      colors.bg,
                    )}
                  >
                    L{stat.level}
                  </span>
                  <span className="text-sm font-medium text-foreground">{stat.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({stat.workspaceCount} workspace{stat.workspaceCount !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{stat.totalMembers}</span>
                  <span className="text-muted-foreground">members</span>
                </div>

                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', colors.progress)}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-medium w-8 text-right">{progress}%</span>
                </div>
              </div>

              {/* Task Breakdown */}
              {stat.taskStats.total > 0 && (
                <div className="flex items-center gap-3 mt-2 text-[10px]">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>{stat.taskStats.completed} done</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span>{stat.taskStats.inProgress} in progress</span>
                  </div>
                  {stat.taskStats.blocked > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <span>{stat.taskStats.blocked} blocked</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {levelStats.every((s) => s.workspaceCount === 0) && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No workspaces found for this event.
        </div>
      )}
    </div>
  );
}
