import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, isBefore, parseISO } from 'date-fns';

interface BurndownChartProps {
  workspaceId?: string;
  sprintStartDate?: Date;
  sprintEndDate?: Date;
}

interface BurndownDataPoint {
  date: string;
  ideal: number;
  actual: number | null;
  remaining: number | null;
}

export function BurndownChart({ workspaceId, sprintStartDate, sprintEndDate }: BurndownChartProps) {
  // Default to current week if no dates provided
  const startDate = sprintStartDate || startOfWeek(new Date(), { weekStartsOn: 1 });
  const endDate = sprintEndDate || endOfWeek(new Date(), { weekStartsOn: 1 });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['burndown-tasks', workspaceId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, status, created_at, updated_at, priority, end_date')
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });

  const burndownData = useMemo((): BurndownDataPoint[] => {
    if (!tasks?.length) return [];

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const totalTasks = tasks.length;
    const tasksPerDay = totalTasks / (days.length - 1 || 1);

    return days.map((day, index) => {
      const dateStr = format(day, 'MMM dd');
      const idealRemaining = Math.max(0, totalTasks - (tasksPerDay * index));

      // Calculate actual remaining on this day
      const isInPast = isBefore(day, new Date()) || format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      
      let actualRemaining: number | null = null;
      if (isInPast) {
        // Use updated_at when status became 'completed' or 'done'
        const completedByThisDay = tasks.filter(t => {
          if (t.status !== 'completed' && t.status !== 'done') return false;
          // Use updated_at as proxy for completion date
          const completedDate = parseISO(t.updated_at);
          return isBefore(completedDate, day) || format(completedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
        }).length;
        actualRemaining = totalTasks - completedByThisDay;
      }

      return {
        date: dateStr,
        ideal: Math.round(idealRemaining),
        actual: actualRemaining,
        remaining: actualRemaining,
      };
    });
  }, [tasks, startDate, endDate]);

  const stats = useMemo(() => {
    if (!tasks?.length) return { totalScope: 0, completed: 0, remaining: 0, onTrack: true };
    
    const completed = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
    const remaining = tasks.length - completed;
    
    // Check if we're on track (actual <= ideal for today)
    const today = burndownData.find(d => d.date === format(new Date(), 'MMM dd'));
    const onTrack = today ? (today.actual ?? 0) <= today.ideal : true;

    return { totalScope: tasks.length, completed, remaining, onTrack };
  }, [tasks, burndownData]);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingDown className="h-5 w-5 text-primary" />
            Burndown Chart
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
            <TrendingDown className="h-5 w-5 text-primary" />
            Burndown Chart
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Scope:</span>
              <span className="font-medium">{stats.totalScope}</span>
            </div>
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              stats.onTrack 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {stats.onTrack ? 'On Track' : 'Behind'}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {burndownData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingDown className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No task data available</p>
              <p className="text-sm">Create tasks to see burndown progress</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
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
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Line 
                  type="linear" 
                  dataKey="ideal" 
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Ideal"
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  name="Actual"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
