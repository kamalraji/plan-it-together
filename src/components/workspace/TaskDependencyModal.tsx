import { WorkspaceTask } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskDependencyGraph } from './TaskDependencyGraph';
import { findCriticalPath, detectCircularDependencies } from '@/lib/taskDependencyGraph';
import { AlertTriangle, GitBranch, Route } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

interface TaskDependencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: WorkspaceTask[];
  selectedTaskId?: string;
  onTaskClick?: (task: WorkspaceTask) => void;
}

export function TaskDependencyModal({
  isOpen,
  onClose,
  tasks,
  selectedTaskId,
  onTaskClick,
}: TaskDependencyModalProps) {
  const stats = useMemo(() => {
    const tasksWithDeps = tasks.filter(t => 
      t.dependencies?.length || tasks.some(other => other.dependencies?.includes(t.id))
    );
    const criticalPath = findCriticalPath(tasks);
    const cycles = detectCircularDependencies(tasks);

    return {
      totalWithDeps: tasksWithDeps.length,
      criticalPathLength: criticalPath.length,
      hasCircular: cycles.length > 0,
      circularCount: cycles.length,
    };
  }, [tasks]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Task Dependencies
          </DialogTitle>
          <DialogDescription>
            Visualize task relationships and identify blocking chains
          </DialogDescription>
        </DialogHeader>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-3 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {stats.totalWithDeps} tasks with dependencies
            </Badge>
          </div>
          
          {stats.criticalPathLength > 0 && (
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">
                Critical path: {stats.criticalPathLength} tasks
              </span>
            </div>
          )}
          
          {stats.hasCircular && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                {stats.circularCount} circular dependency detected
              </span>
            </div>
          )}
        </div>

        {/* Graph */}
        <div className="flex-1 min-h-0">
          <TaskDependencyGraph
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onTaskClick={(task) => {
              onTaskClick?.(task);
            }}
            className="h-full"
          />
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
          <span className="font-medium">Tips:</span> Click a task to view details. 
          Drag to pan, use controls to zoom. Solid lines = pending, dashed red = blocked.
        </div>
      </DialogContent>
    </Dialog>
  );
}
