import { useState } from 'react';
import { WorkspaceTask, TaskStatus, TaskPriority, TaskCategory, TeamMember } from '../../types';
import { cn } from '@/lib/utils';
import { Plus, ClipboardList, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface TaskListProps {
  tasks: WorkspaceTask[];
  teamMembers?: TeamMember[];
  onTaskClick?: (task: WorkspaceTask) => void;
  onTaskEdit?: (task: WorkspaceTask) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
  onCreateTask?: () => void;
  isLoading?: boolean;
}

export function TaskList({
  tasks,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onCreateTask,
  isLoading = false
}: TaskListProps) {
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const getStatusStyles = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return 'bg-muted text-muted-foreground';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case TaskStatus.REVIEW_REQUIRED:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case TaskStatus.COMPLETED:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case TaskStatus.BLOCKED:
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityStyles = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-muted text-muted-foreground';
      case TaskPriority.MEDIUM:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case TaskPriority.HIGH:
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
      case TaskPriority.URGENT:
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryStyles = (category: TaskCategory) => {
    switch (category) {
      case TaskCategory.SETUP:
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case TaskCategory.MARKETING:
        return 'bg-pink-500/10 text-pink-600 dark:text-pink-400';
      case TaskCategory.LOGISTICS:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case TaskCategory.TECHNICAL:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case TaskCategory.REGISTRATION:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const isOverdue = (task: WorkspaceTask) => {
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false;
    return new Date(task.dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="px-6 py-16 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-muted/80 flex items-center justify-center">
            <ClipboardList className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">No tasks found</h3>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
            Get started by creating your first task to organize and track your event activities.
          </p>
          {onCreateTask && (
            <div className="mt-6">
              <Button onClick={onCreateTask} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create your first task
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Task Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Task
              </th>
              <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Priority
              </th>
              <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Assignee
              </th>
              <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                Due Date
              </th>
              <th className="px-4 sm:px-6 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="bg-card hover:bg-muted/30 cursor-pointer transition-colors group"
                onClick={() => onTaskClick?.(task)}
              >
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {task.title}
                        </p>
                        {isOverdue(task) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive">
                            Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          getCategoryStyles(task.category)
                        )}>
                          {task.category.replace('_', ' ')}
                        </span>
                        {task.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                        {task.tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{task.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                    getStatusStyles(task.status)
                  )}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                    getPriorityStyles(task.priority)
                  )}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background">
                        <span className="text-xs font-semibold text-primary">
                          {task.assignee.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-foreground">
                        {task.assignee.user.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Unassigned</span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell">
                  {task.dueDate ? (
                    <span className={cn(
                      'text-foreground',
                      isOverdue(task) && 'text-destructive font-medium'
                    )}>
                      {formatDate(task.dueDate)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">No due date</span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onTaskStatusChange && (
                      <select
                        value={task.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          onTaskStatusChange(task.id, e.target.value as TaskStatus);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                      >
                        {Object.values(TaskStatus).map(status => (
                          <option key={status} value={status}>{status.replace('_', ' ')}</option>
                        ))}
                      </select>
                    )}
                    {onTaskEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskEdit(task);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onTaskDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskToDelete(task.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with count */}
      <div className="px-4 sm:px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{tasks.length}</span> tasks
        </p>
        {onCreateTask && (
          <Button onClick={onCreateTask} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Task
          </Button>
        )}
      </div>

      <ConfirmationDialog
        open={!!taskToDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        title="Delete task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (taskToDelete && onTaskDelete) {
            onTaskDelete(taskToDelete);
            setTaskToDelete(null);
          }
        }}
      />
    </div>
  );
}
