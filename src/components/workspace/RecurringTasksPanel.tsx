import { useState } from 'react';
import { useRecurringTasks } from '@/hooks/useRecurringTasks';
import { RecurringTaskForm } from './RecurringTaskForm';
import { RecurringTask, formatRecurrence, CreateRecurringTaskDTO } from '@/lib/recurringTaskTypes';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, RefreshCw, Calendar, Trash2, Play, Clock, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecurringTasksPanelProps {
  workspaceId: string;
}

export function RecurringTasksPanel({ workspaceId }: RecurringTasksPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const {
    recurringTasks,
    isLoading,
    createRecurringTask,
    deleteRecurringTask,
    toggleActive,
    triggerNow,
    isCreating,
    isDeleting,
    isUpdating,
  } = useRecurringTasks({ workspaceId });

  const handleCreate = async (task: CreateRecurringTaskDTO) => {
    await createRecurringTask(task);
    setShowCreateForm(false);
  };

  const handleTriggerNow = async (task: RecurringTask) => {
    await triggerNow(task);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'HIGH': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
      case 'MEDIUM': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'LOW': return 'bg-slate-500/10 text-slate-700 dark:text-slate-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Recurring Tasks
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {recurringTasks.length} recurring task{recurringTasks.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          New Recurring Task
        </Button>
      </div>

      {/* Stats */}
      {recurringTasks.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="text-2xl font-bold text-foreground">
              {recurringTasks.filter(t => t.isActive).length}
            </div>
            <div className="text-sm text-muted-foreground">Active Rules</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="text-2xl font-bold text-foreground">
              {recurringTasks.reduce((sum, t) => sum + t.occurrenceCount, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Tasks Created</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="text-2xl font-bold text-foreground">
              {recurringTasks.filter(t => t.isActive && new Date(t.nextOccurrence) <= new Date(Date.now() + 86400000)).length}
            </div>
            <div className="text-sm text-muted-foreground">Due Today</div>
          </div>
        </div>
      )}

      {/* Task List */}
      {recurringTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">No Recurring Tasks</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Create recurring tasks to automate routine work that repeats on a schedule.
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Your First Recurring Task
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {recurringTasks.map((task: RecurringTask) => (
            <div
              key={task.id}
              className={cn(
                "rounded-lg border border-border bg-card p-4 transition-opacity",
                !task.isActive && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground truncate">{task.title}</h4>
                    <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
                      {task.priority}
                    </Badge>
                    {!task.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Paused
                      </Badge>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-3.5 w-3.5" />
                      {formatRecurrence(task.recurrenceType, task.recurrenceConfig)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Next: {format(new Date(task.nextOccurrence), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" />
                      {task.occurrenceCount} created
                    </span>
                    {task.endDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Ends: {format(new Date(task.endDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle Active */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={task.isActive}
                      onCheckedChange={(checked) => toggleActive({ id: task.id, isActive: checked })}
                      disabled={isUpdating}
                    />
                  </div>

                  {/* Trigger Now */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleTriggerNow(task)}
                    disabled={!task.isActive}
                    title="Create task now"
                  >
                    <Play className="h-4 w-4" />
                  </Button>

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Recurring Task</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the recurring task rule. Previously created tasks will not be affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteRecurringTask(task.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      <RecurringTaskForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreate}
        isLoading={isCreating}
        workspaceId={workspaceId}
      />
    </div>
  );
}
