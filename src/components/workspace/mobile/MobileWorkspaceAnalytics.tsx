import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, CheckCircle2, Clock, Users, Loader2 } from 'lucide-react';
import { Workspace } from '@/types';

interface MobileWorkspaceAnalyticsProps {
  workspace: Workspace;
}

interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  teamMembers: number;
  completionRate: number;
  weeklyProgress: number[];
}

export function MobileWorkspaceAnalytics({ workspace }: MobileWorkspaceAnalyticsProps) {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['mobile-workspace-analytics', workspace.id],
    queryFn: async () => {
      // Fetch task statistics
      const [totalRes, completedRes, overdueRes] = await Promise.all([
        supabase
          .from('workspace_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id),
        supabase
          .from('workspace_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
          .eq('status', 'COMPLETED'),
        supabase
          .from('workspace_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
          .neq('status', 'COMPLETED')
          .lt('due_date', new Date().toISOString()),
      ]);

      const totalTasks = totalRes.count ?? 0;
      const completedTasks = completedRes.count ?? 0;
      const overdueTasks = overdueRes.count ?? 0;
      const teamMembers = workspace.teamMembers?.length ?? 0;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Mock weekly progress (in production, calculate from actual data)
      const weeklyProgress = [65, 72, 68, 75, 80, 78, completionRate];

      return {
        totalTasks,
        completedTasks,
        overdueTasks,
        teamMembers,
        completionRate,
        weeklyProgress,
      };
    },
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      icon: CheckCircle2,
      label: 'Completed',
      value: analytics?.completedTasks ?? 0,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Clock,
      label: 'Overdue',
      value: analytics?.overdueTasks ?? 0,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      icon: BarChart3,
      label: 'Total Tasks',
      value: analytics?.totalTasks ?? 0,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Users,
      label: 'Team Size',
      value: analytics?.teamMembers ?? 0,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Completion Rate Card */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Task Completion</h3>
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
        
        <div className="flex items-end gap-4">
          <div className="text-4xl font-bold text-foreground">
            {analytics?.completionRate ?? 0}%
          </div>
          <div className="text-sm text-muted-foreground mb-1">
            completion rate
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
            style={{ width: `${analytics?.completionRate ?? 0}%` }}
          />
        </div>

        {/* Weekly mini chart */}
        <div className="mt-4 flex items-end gap-1 h-12">
          {analytics?.weeklyProgress.map((value, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t transition-all duration-300 ${
                i === analytics.weeklyProgress.length - 1 
                  ? 'bg-primary' 
                  : 'bg-muted-foreground/20'
              }`}
              style={{ height: `${value}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Mon</span>
          <span>Today</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick insights */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-foreground mb-3">Quick Insights</h3>
        <div className="space-y-3">
          {analytics && analytics.overdueTasks > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">
                {analytics.overdueTasks} task{analytics.overdueTasks !== 1 ? 's' : ''} overdue
              </span>
            </div>
          )}
          {analytics && analytics.completionRate >= 80 && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">
                Great progress! Keep it up
              </span>
            </div>
          )}
          {analytics && analytics.completionRate < 50 && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">
                Focus on completing pending tasks
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
