/**
 * DraggableTaskCard - Task card with drag capabilities
 */
import { DragEvent, useState } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, Calendar, User, Flag } from 'lucide-react';
import { WorkspaceTask, TaskStatus, TaskPriority } from '@/types';
import { Badge } from '@/components/ui/badge';

interface DraggableTaskCardProps {
  task: WorkspaceTask;
  onClick?: () => void;
  className?: string;
}

export function DraggableTaskCard({ task, onClick, className }: DraggableTaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    
    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.textContent = task.title;
    dragImage.style.cssText = 'position: absolute; top: -1000px; padding: 8px 12px; background: hsl(var(--primary)); color: white; border-radius: 6px; font-size: 14px;';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'text-destructive';
      case TaskPriority.HIGH: return 'text-orange-500';
      case TaskPriority.MEDIUM: return 'text-info';
      case TaskPriority.LOW: return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'bg-emerald-500/10 text-emerald-600';
      case TaskStatus.IN_PROGRESS: return 'bg-info/10 text-info';
      case TaskStatus.BLOCKED: return 'bg-destructive/10 text-destructive';
      case TaskStatus.REVIEW_REQUIRED: return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={cn(
        'group relative flex items-start gap-3 p-4 rounded-lg border border-border bg-card cursor-grab active:cursor-grabbing transition-all duration-200',
        isDragging && 'opacity-50 scale-95 ring-2 ring-primary',
        !isDragging && 'hover:shadow-md hover:border-primary/30',
        className
      )}
    >
      {/* Drag Handle */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm truncate">{task.title}</h4>
          <Badge variant="secondary" className={cn('flex-shrink-0 text-xs', getStatusColor(task.status))}>
            {task.status.replace('_', ' ')}
          </Badge>
        </div>

        {task.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {/* Priority */}
          <div className={cn('flex items-center gap-1', getPriorityColor(task.priority))}>
            <Flag className="h-3 w-3" />
            {task.priority}
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <div className={cn('flex items-center gap-1', isOverdue && 'text-destructive')}>
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}

          {/* Assignee */}
          {task.assignee && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {typeof task.assignee === 'string' ? task.assignee : task.assignee?.user?.name || 'Assigned'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
