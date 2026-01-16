import { WorkspaceTask, TaskStatus, TaskPriority } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, ListTodo, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskStatsSummaryProps {
  tasks: WorkspaceTask[];
  className?: string;
}

export function TaskStatsSummary({ tasks, className }: TaskStatsSummaryProps) {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    overdue: tasks.filter(t => {
      if (!t.dueDate || t.status === TaskStatus.COMPLETED) return false;
      return new Date(t.dueDate) < new Date();
    }).length,
    urgent: tasks.filter(t => t.priority === TaskPriority.URGENT && t.status !== TaskStatus.COMPLETED).length,
    blocked: tasks.filter(t => t.status === TaskStatus.BLOCKED).length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const statCards = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: ListTodo,
      color: 'text-foreground',
      bgColor: 'bg-muted/50',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      highlight: stats.overdue > 0,
    },
  ];

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "rounded-xl border border-border p-4 transition-all",
              stat.bgColor,
              stat.highlight && "ring-1 ring-red-500/30"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={cn("h-5 w-5", stat.color)} />
              {stat.highlight && (
                <span className="text-[10px] font-medium uppercase tracking-wider text-red-500">
                  Attention
                </span>
              )}
            </div>
            <div className={cn("text-2xl font-bold", stat.color)}>
              {stat.value}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Completion Rate</span>
          </div>
          <span className="text-sm font-semibold text-primary">{completionRate}%</span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{stats.completed} of {stats.total} tasks completed</span>
          {stats.urgent > 0 && (
            <span className="text-red-500 font-medium">
              {stats.urgent} urgent pending
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
