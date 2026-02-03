/**
 * VirtualizedTaskList - High-performance task list using @tanstack/react-virtual
 * Efficiently renders large task lists by only rendering visible items
 */
import { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { WorkspaceTask, TaskStatus, TaskPriority, TaskCategory, TeamMember } from '../../types';
import { cn } from '@/lib/utils';
import { Plus, ClipboardList, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface VirtualizedTaskListProps {
  tasks: WorkspaceTask[];
  teamMembers?: TeamMember[];
  onTaskClick?: (task: WorkspaceTask) => void;
  onTaskEdit?: (task: WorkspaceTask) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
  onCreateTask?: () => void;
  isLoading?: boolean;
  estimateSize?: number;
}

export function VirtualizedTaskList({
  tasks,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTaskStatusChange: _onTaskStatusChange,
  onCreateTask,
  isLoading = false,
  estimateSize = 80,
}: VirtualizedTaskListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });

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
            Get started by creating your first task.
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
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 border-b border-border bg-muted/40">
        <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-5">Task</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 hidden md:block">Priority</div>
          <div className="col-span-2 hidden sm:block">Due Date</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
      </div>

      {/* Virtualized List */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: Math.min(tasks.length * estimateSize, 600) }}
        role="list"
        aria-label={`Task list with ${tasks.length} items`}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const task = tasks[virtualRow.index];
            return (
              <div
                key={task.id}
                role="listitem"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="border-b border-border"
              >
                <div
                  className="grid grid-cols-12 gap-4 items-center px-4 sm:px-6 py-3 h-full bg-card hover:bg-muted/30 cursor-pointer transition-colors group"
                  onClick={() => onTaskClick?.(task)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onTaskClick?.(task);
                    }
                  }}
                  aria-label={`Task: ${task.title}, Status: ${task.status}, Priority: ${task.priority}`}
                >
                  {/* Task Title & Category */}
                  <div className="col-span-5 min-w-0">
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
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        getCategoryStyles(task.category)
                      )}>
                        {task.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                      getStatusStyles(task.status)
                    )}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="col-span-2 hidden md:block">
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                      getPriorityStyles(task.priority)
                    )}>
                      {task.priority}
                    </span>
                  </div>

                  {/* Due Date */}
                  <div className="col-span-2 hidden sm:block">
                    {task.dueDate ? (
                      <span className={cn(
                        'text-sm',
                        isOverdue(task) ? 'text-destructive font-medium' : 'text-foreground'
                      )}>
                        {formatDate(task.dueDate)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onTaskEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskEdit(task);
                          }}
                          aria-label={`Edit ${task.title}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {onTaskDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTaskToDelete(task.id);
                          }}
                          aria-label={`Delete ${task.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
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
