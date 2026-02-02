import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, subWeeks, parseISO, isWithinInterval } from 'date-fns';

interface VelocityChartProps {
  workspaceId?: string;
  weeksToShow?: number;
}

interface VelocityDataPoint {
  week: string;
  completed: number;
  planned: number;
  velocity: number;
}

export function VelocityChart({ workspaceId, weeksToShow = 6 }: VelocityChartProps) {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['velocity-tasks', workspaceId, weeksToShow],
    queryFn: async () => {
      if (!workspaceId) return [];

      // Get tasks from the last N weeks
      const startDate = startOfWeek(subWeeks(new Date(), weeksToShow), { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, status, created_at, updated_at, priority')
        .eq('workspace_id', workspaceId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  const velocityData = useMemo((): VelocityDataPoint[] => {
    const weeks: VelocityDataPoint[] = [];
    
    for (let i = weeksToShow - 1; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekLabel = format(weekStart, 'MMM d');

      // Count tasks created this week (planned)
      const planned = tasks?.filter(t => {
        const createdAt = parseISO(t.created_at);
        return isWithinInterval(createdAt, { start: weekStart, end: weekEnd });
      }).length || 0;

      // Count tasks completed this week (using updated_at as completion proxy)
      const completed = tasks?.filter(t => {
        if (t.status !== 'completed' && t.status !== 'done') return false;
        // Use updated_at as proxy for when task was completed
        const completedAt = parseISO(t.updated_at);
        return isWithinInterval(completedAt, { start: weekStart, end: weekEnd });
      }).length || 0;

      weeks.push({
        week: weekLabel,
        completed,
        planned,
        velocity: completed,
      });
    }

    return weeks;
  }, [tasks, weeksToShow]);

  const stats = useMemo(() => {
    if (velocityData.length === 0) return { average: 0, trend: 0, lastWeek: 0 };
    
    const velocities = velocityData.map(d => d.velocity);
    const average = Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length);
    const lastWeek = velocities[velocities.length - 1] || 0;
    
    // Calculate trend (compare last 2 weeks average to previous 2 weeks)
    const recentAvg = velocities.slice(-2).reduce((a, b) => a + b, 0) / 2;
    const olderAvg = velocities.slice(-4, -2).reduce((a, b) => a + b, 0) / 2 || recentAvg;
    const trend = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;

    return { average, trend, lastWeek };
  }, [velocityData]);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-amber-500" />
            Velocity Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-amber-500" />
            Velocity Chart
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Avg:</span>
              <span className="font-medium">{stats.average}/week</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              stats.trend >= 0
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              <TrendingUp className={`h-3 w-3 ${stats.trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(stats.trend)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {velocityData.every(d => d.completed === 0 && d.planned === 0) ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Zap className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No velocity data available</p>
              <p className="text-sm">Complete tasks to track velocity</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <ReferenceLine y={stats.average} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar 
                  dataKey="completed" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Completed"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
