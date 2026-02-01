import { useState, useRef, useCallback } from 'react';
import { WorkspaceTask, TaskStatus, TaskPriority } from '@/types';
import { getTaskPosition } from '@/lib/ganttUtils';
import { cn } from '@/lib/utils';
import { Diamond, GripVertical } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface GanttTaskRowProps {
  task: WorkspaceTask;
  timelineStart: Date;
  dayWidth: number;
  rowHeight: number;
  rowIndex: number;
  isSelected: boolean;
  isDragging: boolean;
  isDrawingDependency: boolean;
  isDependencySource: boolean;
  onDragStart: () => void;
  onDragEnd: (newStart: Date, newEnd: Date) => void;
  onDependencyStart: () => void;
  onDependencyEnd: () => void;
  onClick: () => void;
}

const PRIORITY_COLORS = {
  [TaskPriority.URGENT]: 'bg-red-500 hover:bg-red-600',
  [TaskPriority.HIGH]: 'bg-orange-500 hover:bg-orange-600',
  [TaskPriority.MEDIUM]: 'bg-blue-500 hover:bg-blue-600',
  [TaskPriority.LOW]: 'bg-green-500 hover:bg-green-600',
};

const STATUS_OPACITY = {
  [TaskStatus.NOT_STARTED]: 'opacity-60',
  [TaskStatus.IN_PROGRESS]: '',
  [TaskStatus.REVIEW_REQUIRED]: '',
  [TaskStatus.COMPLETED]: 'opacity-70',
  [TaskStatus.BLOCKED]: 'opacity-50',
};

export function GanttTaskRow({
  task,
  timelineStart,
  dayWidth,
  rowHeight,
  rowIndex,
  isSelected,
  isDragging,
  isDrawingDependency,
  isDependencySource,
  onDragStart,
  onDragEnd,
  onDependencyStart,
  onDependencyEnd,
  onClick,
}: GanttTaskRowProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize-left' | 'resize-right' | null;
    startX: number;
    originalLeft: number;
    originalWidth: number;
  } | null>(null);

  const position = getTaskPosition(task, timelineStart, dayWidth);
  const isMilestone = task.metadata?.isMilestone as boolean || false;

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize-left' | 'resize-right') => {
    e.stopPropagation();
    if (!position) return;

    onDragStart();
    setDragState({
      type,
      startX: e.clientX,
      originalLeft: position.left,
      originalWidth: position.width,
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragState && !barRef.current) return;
      
      // Update position visually (actual save happens on mouseup)
      const deltaX = moveEvent.clientX - e.clientX;
      const newPosition = { ...position };

      if (type === 'move') {
        newPosition.left = position.left + deltaX;
      } else if (type === 'resize-left') {
        newPosition.left = position.left + deltaX;
        newPosition.width = position.width - deltaX;
      } else if (type === 'resize-right') {
        newPosition.width = position.width + deltaX;
      }

      if (barRef.current) {
        barRef.current.style.left = `${newPosition.left}px`;
        barRef.current.style.width = `${Math.max(newPosition.width, dayWidth)}px`;
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      const deltaX = upEvent.clientX - e.clientX;
      const deltaDays = Math.round(deltaX / dayWidth);
      
      if (deltaDays !== 0) {
        const startDate = task.metadata?.startDate 
          ? new Date(task.metadata.startDate as string)
          : (task.dueDate ? new Date(task.dueDate) : new Date());
        const endDate = task.metadata?.endDate
          ? new Date(task.metadata.endDate as string)
          : startDate;

        let newStart = new Date(startDate);
        let newEnd = new Date(endDate);

        if (type === 'move') {
          newStart.setDate(newStart.getDate() + deltaDays);
          newEnd.setDate(newEnd.getDate() + deltaDays);
        } else if (type === 'resize-left') {
          newStart.setDate(newStart.getDate() + deltaDays);
        } else if (type === 'resize-right') {
          newEnd.setDate(newEnd.getDate() + deltaDays);
        }

        onDragEnd(newStart, newEnd);
      } else {
        onDragEnd(
          task.metadata?.startDate ? new Date(task.metadata.startDate as string) : new Date(),
          task.metadata?.endDate ? new Date(task.metadata.endDate as string) : new Date()
        );
      }

      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [position, dayWidth, task, onDragStart, onDragEnd, dragState]);

  if (!position) {
    // Task without dates - show as placeholder
    return (
      <div
        className="absolute left-4 flex items-center gap-2 px-2 h-7 rounded bg-muted/50 border border-dashed border-border text-xs text-muted-foreground cursor-pointer hover:bg-muted"
        style={{ top: rowIndex * rowHeight + (rowHeight - 28) / 2 }}
        onClick={onClick}
      >
        No dates set
      </div>
    );
  }

  const priorityColor = PRIORITY_COLORS[task.priority as TaskPriority] || PRIORITY_COLORS[TaskPriority.MEDIUM];
  const statusOpacity = STATUS_OPACITY[task.status as TaskStatus] || '';

  // Calculate progress width
  const progressWidth = task.status === TaskStatus.COMPLETED 
    ? 100 
    : (task.progress || 0);

  if (isMilestone) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={barRef}
              className={cn(
                "absolute flex items-center justify-center cursor-pointer transition-transform",
                isSelected && "ring-2 ring-primary ring-offset-2",
                isDragging && "scale-110 z-30",
                isDependencySource && "ring-2 ring-blue-500"
              )}
              style={{
                left: position.left - 12,
                top: rowIndex * rowHeight + (rowHeight - 24) / 2,
                width: 24,
                height: 24,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (isDrawingDependency) {
                  onDependencyEnd();
                } else {
                  onClick();
                }
              }}
              onMouseDown={(e) => handleMouseDown(e, 'move')}
              onDoubleClick={onDependencyStart}
            >
              <Diamond className="h-5 w-5 text-amber-500 fill-amber-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm font-medium">{task.title}</div>
            <div className="text-xs text-muted-foreground">
              {task.dueDate && format(new Date(task.dueDate), 'MMM d, yyyy')}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={barRef}
            className={cn(
              "absolute flex items-center gap-1 rounded-md cursor-pointer transition-all group",
              priorityColor,
              statusOpacity,
              isSelected && "ring-2 ring-primary ring-offset-1",
              isDragging && "shadow-lg z-30",
              isDependencySource && "ring-2 ring-blue-500"
            )}
            style={{
              left: position.left,
              top: rowIndex * rowHeight + (rowHeight - 28) / 2,
              width: position.width,
              height: 28,
              minWidth: dayWidth,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isDrawingDependency) {
                onDependencyEnd();
              } else {
                onClick();
              }
            }}
            onDoubleClick={onDependencyStart}
          >
            {/* Left resize handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 flex items-center justify-center"
              onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
            >
              <GripVertical className="h-3 w-3 text-white/70" />
            </div>

            {/* Progress bar */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-white/20 rounded-l-md"
              style={{ width: `${progressWidth}%` }}
            />

            {/* Content */}
            <div
              className="flex-1 px-2 flex items-center gap-1.5 min-w-0"
              onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
              <span className="text-xs font-medium text-white truncate">
                {task.title}
              </span>
            </div>

            {/* Right resize handle */}
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 flex items-center justify-center"
              onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
            >
              <GripVertical className="h-3 w-3 text-white/70" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-medium">{task.title}</div>
            {task.description && (
              <div className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs">
              <span className={cn(
                "px-1.5 py-0.5 rounded text-white",
                priorityColor.split(' ')[0]
              )}>
                {task.priority}
              </span>
              <span>{task.status}</span>
            </div>
            {(task.metadata?.startDate || task.dueDate) && (
              <div className="text-xs text-muted-foreground">
                {task.metadata?.startDate && format(new Date(task.metadata.startDate as string), 'MMM d')}
                {task.metadata?.endDate && ` - ${format(new Date(task.metadata.endDate as string), 'MMM d, yyyy')}`}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
