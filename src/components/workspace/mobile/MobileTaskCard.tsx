import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  PlayIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { WorkspaceTask, TaskStatus, TaskPriority } from '../../../types';
import { useSwipeGesture } from '../../../hooks/useSwipeGesture';
import { cn } from '@/lib/utils';

interface MobileTaskCardProps {
  task: WorkspaceTask;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onTitleUpdate: (taskId: string, title: string) => void;
  onClick?: (task: WorkspaceTask) => void;
}

const STATUS_CONFIG = {
  [TaskStatus.NOT_STARTED]: {
    icon: ClockIcon,
    label: 'Not Started',
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    next: TaskStatus.IN_PROGRESS,
    prev: null,
  },
  [TaskStatus.IN_PROGRESS]: {
    icon: PlayIcon,
    label: 'In Progress',
    bgClass: 'bg-primary/10',
    textClass: 'text-primary',
    next: TaskStatus.COMPLETED,
    prev: TaskStatus.NOT_STARTED,
  },
  [TaskStatus.REVIEW_REQUIRED]: {
    icon: ExclamationTriangleIcon,
    label: 'Review',
    bgClass: 'bg-chart-4/10',
    textClass: 'text-chart-4',
    next: TaskStatus.COMPLETED,
    prev: TaskStatus.IN_PROGRESS,
  },
  [TaskStatus.COMPLETED]: {
    icon: CheckCircleIcon,
    label: 'Completed',
    bgClass: 'bg-chart-3/10',
    textClass: 'text-chart-3',
    next: null,
    prev: TaskStatus.IN_PROGRESS,
  },
  [TaskStatus.BLOCKED]: {
    icon: ExclamationTriangleIcon,
    label: 'Blocked',
    bgClass: 'bg-destructive/10',
    textClass: 'text-destructive',
    next: TaskStatus.IN_PROGRESS,
    prev: null,
  },
};

const PRIORITY_CONFIG = {
  [TaskPriority.LOW]: { dotClass: 'bg-muted-foreground', label: 'Low' },
  [TaskPriority.MEDIUM]: { dotClass: 'bg-primary', label: 'Medium' },
  [TaskPriority.HIGH]: { dotClass: 'bg-chart-4', label: 'High' },
  [TaskPriority.URGENT]: { dotClass: 'bg-destructive', label: 'Urgent' },
};

export function MobileTaskCard({
  task,
  onStatusChange,
  onDelete,
  onTitleUpdate,
  onClick,
}: MobileTaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const StatusIcon = statusConfig.icon;

  const handleSwipeLeft = () => {
    // Advance status forward
    if (statusConfig.next) {
      onStatusChange(task.id, statusConfig.next);
    }
  };

  const handleSwipeRight = () => {
    // Move status backward
    if (statusConfig.prev) {
      onStatusChange(task.id, statusConfig.prev);
    }
  };

  const { swipeState, handlers, isSwipingLeft, isSwipingRight } = useSwipeGesture({
    threshold: 60,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      onTitleUpdate(task.id, editedTitle.trim());
    } else {
      setEditedTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(task.title);
    setIsEditing(false);
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = task.dueDate && 
    new Date(task.dueDate) < new Date() && 
    task.status !== TaskStatus.COMPLETED;

  const getSwipeIndicator = () => {
    if (isSwipingLeft && statusConfig.next) {
      const nextConfig = STATUS_CONFIG[statusConfig.next];
      return (
        <div className="absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-chart-3 rounded-r-xl">
          <div className="text-center">
            <CheckCircleSolidIcon className="w-6 h-6 text-chart-3-foreground mx-auto" />
            <span className="text-xs text-chart-3-foreground font-medium">{nextConfig.label}</span>
          </div>
        </div>
      );
    }
    if (isSwipingRight && statusConfig.prev) {
      const prevConfig = STATUS_CONFIG[statusConfig.prev];
      return (
        <div className="absolute inset-y-0 left-0 flex items-center justify-center w-20 bg-muted rounded-l-xl">
          <div className="text-center">
            <prevConfig.icon className="w-6 h-6 text-muted-foreground mx-auto" />
            <span className="text-xs text-muted-foreground font-medium">{prevConfig.label}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe indicators */}
      <AnimatePresence>
        {(isSwipingLeft || isSwipingRight) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {getSwipeIndicator()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main card content */}
      <motion.div
        {...handlers}
        style={{ 
          x: swipeState.offset,
          touchAction: 'pan-y',
        }}
        animate={{ x: swipeState.isSwiping ? swipeState.offset : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          "relative bg-card border border-border rounded-xl p-4 shadow-sm",
          "active:shadow-md transition-shadow duration-150",
          task.status === TaskStatus.COMPLETED && "opacity-70"
        )}
        onClick={() => !isEditing && onClick?.(task)}
      >
        {/* Status indicator bar */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
          statusConfig.bgClass.replace('/10', '')
        )} />

        <div className="pl-2">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="flex-1 px-2 py-1 text-sm font-medium bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1.5 text-chart-3 hover:bg-chart-3/10 rounded-md"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1.5 text-muted-foreground hover:bg-muted rounded-md"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h3 
                  className={cn(
                    "text-sm font-medium text-foreground truncate",
                    task.status === TaskStatus.COMPLETED && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </h3>
              )}
              
              {/* Meta info */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {/* Status badge */}
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full",
                  statusConfig.bgClass,
                  statusConfig.textClass
                )}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </span>

                {/* Priority indicator */}
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <span className={cn("w-2 h-2 rounded-full", priorityConfig.dotClass)} />
                  {priorityConfig.label}
                </span>

                {/* Due date */}
                {task.dueDate && (
                  <span className={cn(
                    "text-xs",
                    isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                  )}>
                    {formatDueDate(task.dueDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                aria-label="Edit task"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                aria-label="Delete task"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
              {onClick && (
                <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Assignee */}
          {task.assignee && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {task.assignee.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {task.assignee.user.name}
              </span>
            </div>
          )}
        </div>

        {/* Swipe hint text */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
          <span className="text-[10px] text-muted-foreground/50">
            ← Swipe to change status →
          </span>
        </div>
      </motion.div>
    </div>
  );
}
