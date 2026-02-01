import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Circle, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  workspace_id: string;
  workspace_name?: string;
}

interface MobileTasksDueTodayProps {
  tasks: Task[];
  orgSlug: string;
}

const priorityStyles: Record<string, { dot: string; bg: string }> = {
  HIGH: { dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  MEDIUM: { dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  LOW: { dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
};

export const MobileTasksDueToday: React.FC<MobileTasksDueTodayProps> = ({
  tasks,
  orgSlug,
}) => {
  const navigate = useNavigate();
  const displayTasks = tasks.slice(0, 3);
  const remainingCount = tasks.length - 3;

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-foreground">Due Today</h3>
          <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground text-xs h-8"
          onClick={() => navigate(`/${orgSlug}/workspaces`)}
        >
          View All
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Task List */}
      <div className="divide-y divide-border">
        {displayTasks.map((task) => {
          const styles = priorityStyles[task.priority] || priorityStyles.LOW;
          
          return (
            <button
              key={task.id}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-accent/50 transition-colors active:bg-accent"
              onClick={() => navigate(`/${orgSlug}/workspaces/${task.workspace_id}`)}
            >
              <div className={cn("mt-0.5 p-1 rounded-full", styles.bg)}>
                <Circle className={cn("h-3 w-3", task.status === 'DONE' ? 'text-muted-foreground' : styles.dot.replace('bg-', 'text-'))} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm line-clamp-1",
                  task.status === 'DONE' ? 'text-muted-foreground line-through' : 'text-foreground'
                )}>
                  {task.title}
                </p>
                {task.workspace_name && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {task.workspace_name}
                  </p>
                )}
              </div>

              <div className={cn(
                "shrink-0 px-2 py-0.5 rounded-full text-xs font-medium",
                styles.bg,
                task.priority === 'HIGH' ? 'text-red-700 dark:text-red-400' :
                task.priority === 'MEDIUM' ? 'text-amber-700 dark:text-amber-400' :
                'text-blue-700 dark:text-blue-400'
              )}>
                {task.priority.toLowerCase()}
              </div>
            </button>
          );
        })}
      </div>

      {/* Show More */}
      {remainingCount > 0 && (
        <button
          className="w-full py-3 text-center text-sm text-primary font-medium hover:bg-accent/50 transition-colors border-t border-border"
          onClick={() => navigate(`/${orgSlug}/workspaces`)}
        >
          +{remainingCount} more {remainingCount === 1 ? 'task' : 'tasks'}
        </button>
      )}
    </div>
  );
};
