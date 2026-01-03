import { Workspace } from '../../types';
import { ClipboardList, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface TaskSummaryCardsProps {
  workspace: Workspace;
  onViewTasks?: () => void;
}

export function TaskSummaryCards({ workspace, onViewTasks }: TaskSummaryCardsProps) {
  const taskSummary = workspace.taskSummary || {
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0
  };

  const completionRate = taskSummary.total > 0 
    ? Math.round((taskSummary.completed / taskSummary.total) * 100) 
    : 0;

  const cards = [
    {
      title: 'Total Tasks',
      value: taskSummary.total,
      icon: <ClipboardList className="w-5 h-5" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30'
    },
    {
      title: 'Completed',
      value: taskSummary.completed,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/30'
    },
    {
      title: 'In Progress',
      value: taskSummary.inProgress,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/30'
    },
    {
      title: 'Overdue',
      value: taskSummary.overdue,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/30'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Task Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, index) => (
          <div key={index} className="bg-card overflow-hidden shadow-sm rounded-xl border border-border">
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 sm:p-2.5 rounded-lg ${card.bgColor}`}>
                  <div className={card.color}>
                    {card.icon}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <dt className="text-xs font-medium text-muted-foreground truncate">
                    {card.title}
                  </dt>
                  <dd className="text-lg sm:text-xl font-semibold text-foreground">
                    {card.value}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Overview */}
      <div className="bg-card overflow-hidden shadow-sm rounded-xl border border-border">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-base sm:text-lg font-medium text-foreground">Task Progress Overview</h3>
            {onViewTasks && (
              <button
                onClick={onViewTasks}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                View All Tasks →
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Completion Rate */}
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Overall Completion</span>
                <span className="font-medium text-foreground">{completionRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            {/* Task Breakdown */}
            {taskSummary.total > 0 && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{taskSummary.completed}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{taskSummary.inProgress}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{taskSummary.overdue}</div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {taskSummary.total === 0 && (
              <div className="text-center py-6 sm:py-8">
                <ClipboardList className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No tasks yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Create tasks to start tracking progress.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
