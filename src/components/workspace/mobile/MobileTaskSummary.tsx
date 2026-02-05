import { useQuery } from '@tanstack/react-query';
import { 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { Workspace } from '../../../types';
import { supabase } from '@/integrations/supabase/client';

interface MobileTaskSummaryProps {
  workspace: Workspace;
  onViewTasks: () => void;
}

interface WorkspaceTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
}

export function MobileTaskSummary({ workspace, onViewTasks }: MobileTaskSummaryProps) {
  // Fetch tasks from Supabase
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['workspace-tasks', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, title, status, priority, due_date')
        .eq('workspace_id', workspace.id);
      
      if (error) throw error;
      return data as WorkspaceTask[];
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow-sm p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'COMPLETED').length || 0;
  const inProgressTasks = tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0;
  const overdueTasks = tasks?.filter(t => {
    if (t.status === 'COMPLETED' || !t.due_date) return false;
    return new Date(t.due_date) < new Date();
  }).length || 0;
  const blockedTasks = tasks?.filter(t => t.status === 'BLOCKED').length || 0;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    {
      label: 'Completed',
      value: completedTasks,
      icon: CheckCircleIcon,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'In Progress',
      value: inProgressTasks,
      icon: ClockIcon,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Overdue',
      value: overdueTasks,
      icon: ExclamationCircleIcon,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'Blocked',
      value: blockedTasks,
      icon: ExclamationCircleIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="bg-card rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <ClipboardDocumentListIcon className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">Tasks</h3>
        </div>
        <button
          onClick={onViewTasks}
          className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium min-h-[48px] px-2"
        >
          View All
          <ChevronRightIcon className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Overall Progress</span>
          <span className="text-sm font-semibold text-foreground">{completionRate}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">{completedTasks} of {totalTasks} tasks completed</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.bgColor} rounded-lg p-4 min-h-[80px]`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Tasks Preview */}
      {tasks && tasks.length > 0 && (
        <div className="p-4 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-3">Upcoming Tasks</h4>
          <div className="space-y-2">
            {tasks
              .filter(t => t.status !== 'COMPLETED' && t.due_date)
              .sort((a, b) => {
                if (!a.due_date || !b.due_date) return 0;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
              })
              .slice(0, 3)
              .map((task) => {
                const isOverdue = task.due_date ? new Date(task.due_date) < new Date() : false;
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-md min-h-[56px]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      {task.due_date && (
                        <p className={`text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                      task.priority === 'HIGH' 
                        ? 'bg-destructive/20 text-red-800'
                        : task.priority === 'MEDIUM'
                        ? 'bg-warning/20 text-yellow-800'
                        : 'bg-muted text-foreground'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
