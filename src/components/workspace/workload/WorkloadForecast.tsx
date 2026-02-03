/**
 * WorkloadForecast - Identifies upcoming deadline clusters and capacity gaps
 */
import React, { useMemo } from 'react';
import { Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, addDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  estimated_hours?: number;
  assignee_name?: string;
  status: string;
}

interface WorkloadForecastProps {
  tasks: Task[];
  teamCapacityPerDay?: number; // Total team hours per day
  forecastDays?: number;
  className?: string;
}

interface DayForecast {
  date: Date;
  tasks: Task[];
  totalHours: number;
  capacityUtilization: number;
  isOverloaded: boolean;
}

export const WorkloadForecast: React.FC<WorkloadForecastProps> = ({
  tasks,
  teamCapacityPerDay = 40, // Default 5 people x 8 hours
  forecastDays = 14,
  className,
}) => {
  const forecast = useMemo(() => {
    const today = startOfDay(new Date());
    const days: DayForecast[] = [];

    for (let i = 0; i < forecastDays; i++) {
      const date = addDays(today, i);
      const dayTasks = tasks.filter((task) => {
        if (!task.due_date || task.status === 'completed') return false;
        const dueDate = startOfDay(new Date(task.due_date));
        return dueDate.getTime() === date.getTime();
      });

      const totalHours = dayTasks.reduce(
        (sum, task) => sum + (task.estimated_hours || 2), // Default 2h per task
        0
      );

      const capacityUtilization =
        teamCapacityPerDay > 0 ? (totalHours / teamCapacityPerDay) * 100 : 0;

      days.push({
        date,
        tasks: dayTasks,
        totalHours,
        capacityUtilization,
        isOverloaded: capacityUtilization > 100,
      });
    }

    return days;
  }, [tasks, teamCapacityPerDay, forecastDays]);

  // Find deadline clusters (days with high task counts)
  const clusters = useMemo(() => {
    return forecast.filter((day) => day.tasks.length >= 3 || day.isOverloaded);
  }, [forecast]);

  // Calculate overall health metrics
  const metrics = useMemo(() => {
    const overloadedDays = forecast.filter((d) => d.isOverloaded).length;
    const totalUpcomingTasks = forecast.reduce((sum, d) => sum + d.tasks.length, 0);
    const totalUpcomingHours = forecast.reduce((sum, d) => sum + d.totalHours, 0);
    const avgUtilization =
      forecast.length > 0
        ? forecast.reduce((sum, d) => sum + d.capacityUtilization, 0) / forecast.length
        : 0;

    return {
      overloadedDays,
      totalUpcomingTasks,
      totalUpcomingHours,
      avgUtilization: Math.round(avgUtilization),
    };
  }, [forecast]);

  const getStatusColor = (utilization: number) => {
    if (utilization > 100) return 'bg-destructive';
    if (utilization > 80) return 'bg-yellow-500';
    if (utilization > 50) return 'bg-green-500';
    return 'bg-muted';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {forecastDays}-Day Workload Forecast
          </CardTitle>
          {metrics.overloadedDays > 0 && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {metrics.overloadedDays} overloaded days
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Metrics */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <p className="text-lg font-bold">{metrics.totalUpcomingTasks}</p>
            <p className="text-xs text-muted-foreground">Tasks Due</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <p className="text-lg font-bold">{metrics.totalUpcomingHours}h</p>
            <p className="text-xs text-muted-foreground">Est. Hours</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <p
              className={cn(
                'text-lg font-bold',
                metrics.avgUtilization > 80 ? 'text-yellow-500' : 'text-green-500'
              )}
            >
              {metrics.avgUtilization}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Load</p>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <p className="text-lg font-bold">{clusters.length}</p>
            <p className="text-xs text-muted-foreground">Peak Days</p>
          </div>
        </div>

        {/* Timeline Heatmap */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-2">Daily Load</p>
          <div className="flex gap-1">
            {forecast.map((day, index) => (
              <div
                key={index}
                className="flex-1 group relative"
                title={`${format(day.date, 'MMM d')}: ${day.tasks.length} tasks, ${day.totalHours}h`}
              >
                <div
                  className={cn(
                    'h-8 rounded transition-all cursor-pointer',
                    getStatusColor(day.capacityUtilization),
                    day.tasks.length === 0 && 'bg-muted/30'
                  )}
                  style={{
                    opacity: Math.max(0.3, Math.min(1, day.capacityUtilization / 100)),
                  }}
                />
                <p className="text-[10px] text-center mt-1 text-muted-foreground">
                  {format(day.date, 'd')}
                </p>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-popover border rounded-lg shadow-lg p-2 text-xs whitespace-nowrap">
                    <p className="font-medium">{format(day.date, 'EEE, MMM d')}</p>
                    <p>
                      {day.tasks.length} tasks • {day.totalHours}h
                    </p>
                    <p className={cn(day.isOverloaded && 'text-destructive font-medium')}>
                      {Math.round(day.capacityUtilization)}% capacity
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deadline Clusters / Alerts */}
        {clusters.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Peak Days Requiring Attention
            </p>
            <div className="space-y-2">
              {clusters.slice(0, 5).map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    day.isOverloaded && 'border-destructive/50 bg-destructive/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {format(day.date, 'EEE')}
                      </p>
                      <p className="text-lg font-bold">{format(day.date, 'd')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {day.tasks.length} tasks due
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {day.totalHours}h estimated work
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {day.isOverloaded ? (
                      <Badge variant="destructive">Over Capacity</Badge>
                    ) : (
                      <Badge variant="secondary">High Load</Badge>
                    )}
                    <span
                      className={cn(
                        'text-sm font-medium',
                        day.isOverloaded ? 'text-destructive' : 'text-yellow-500'
                      )}
                    >
                      {Math.round(day.capacityUtilization)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {clusters.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">Workload looks balanced!</p>
            <p className="text-xs">No capacity issues detected in the next {forecastDays} days</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
