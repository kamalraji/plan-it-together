import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WorkspaceTask, TaskStatus, TaskPriority, TaskCategory } from '../../types';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useTouchDrag } from '@/hooks/useTouchDrag';
import { SkeletonKanbanBoard } from '@/components/ui/skeleton-patterns';
import { LiveRegion, useLiveAnnouncement } from '@/components/accessibility/LiveRegion';
import { GripVertical, Calendar, Link2, Pencil, Trash2 } from 'lucide-react';

interface TaskKanbanBoardProps {
  tasks: WorkspaceTask[];
  onTaskClick?: (task: WorkspaceTask) => void;
  onTaskEdit?: (task: WorkspaceTask) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
  onCreateTask?: () => void;
  isLoading?: boolean;
}

interface KanbanColumn {
  status: TaskStatus;
  title: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    status: TaskStatus.NOT_STARTED,
    title: 'Not Started',
    color: 'text-foreground',
    bgColor: 'bg-muted/50',
    darkBgColor: 'dark:bg-muted/30'
  },
  {
    status: TaskStatus.IN_PROGRESS,
    title: 'In Progress',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-info/10',
    darkBgColor: 'dark:bg-blue-950/30'
  },
  {
    status: TaskStatus.REVIEW_REQUIRED,
    title: 'Review',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-warning/10',
    darkBgColor: 'dark:bg-yellow-950/30'
  },
  {
    status: TaskStatus.BLOCKED,
    title: 'Blocked',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-destructive/10',
    darkBgColor: 'dark:bg-red-950/30'
  },
  {
    status: TaskStatus.COMPLETED,
    title: 'Completed',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-success/10',
    darkBgColor: 'dark:bg-green-950/30'
  }
];

export function TaskKanbanBoard({
  tasks,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onCreateTask,
  isLoading = false
}: TaskKanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<WorkspaceTask | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  // Keyboard navigation state
  const [focusedColumnIndex, setFocusedColumnIndex] = useState(0);
  const [focusedTaskIndex, setFocusedTaskIndex] = useState(0);
  const [isKeyboardDragging, setIsKeyboardDragging] = useState(false);
  const [keyboardDraggedTask, setKeyboardDraggedTask] = useState<WorkspaceTask | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Live announcements for screen readers
  const { message: liveMessage, announce } = useLiveAnnouncement();

  // Touch drag support for mobile
  const { touchHandlers, isDraggingItem, isDropTarget, dropZoneProps } = useTouchDrag<WorkspaceTask>({
    onDrop: (task, dropTarget) => {
      const newStatus = dropTarget as TaskStatus;
      if (task.status !== newStatus && onTaskStatusChange) {
        onTaskStatusChange(task.id, newStatus);
        announce(`Task "${task.title}" moved to ${KANBAN_COLUMNS.find(c => c.status === newStatus)?.title || newStatus}`);
      }
    },
  });

  const tasksByStatus = React.useMemo(() => {
    const grouped: Record<TaskStatus, WorkspaceTask[]> = {
      [TaskStatus.NOT_STARTED]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.REVIEW_REQUIRED]: [],
      [TaskStatus.BLOCKED]: [],
      [TaskStatus.COMPLETED]: []
    };

    tasks.forEach(task => {
      grouped[task.status].push(task);
    });

    // Sort tasks within each column by priority and due date
    Object.keys(grouped).forEach(status => {
      grouped[status as TaskStatus].sort((a, b) => {
        // First sort by priority
        const priorityOrder = {
          [TaskPriority.URGENT]: 4,
          [TaskPriority.HIGH]: 3,
          [TaskPriority.MEDIUM]: 2,
          [TaskPriority.LOW]: 1
        };

        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by due date (earlier dates first)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;

        // Finally by creation date
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = useCallback((e: React.DragEvent, task: WorkspaceTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    announce(`Picked up task "${task.title}". Use arrow keys to navigate, Space to drop`);
  }, [announce]);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedTask && draggedTask.status !== status && onTaskStatusChange) {
      onTaskStatusChange(draggedTask.id, status);
      announce(`Task "${draggedTask.title}" moved to ${KANBAN_COLUMNS.find(c => c.status === status)?.title || status}`);
    }
    setDraggedTask(null);
  }, [draggedTask, onTaskStatusChange, announce]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentColumn = KANBAN_COLUMNS[focusedColumnIndex];
    const currentTasks = tasksByStatus[currentColumn.status];
    
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (isKeyboardDragging && keyboardDraggedTask) {
          // Move task to next column
          const nextColumnIndex = Math.min(focusedColumnIndex + 1, KANBAN_COLUMNS.length - 1);
          const nextColumn = KANBAN_COLUMNS[nextColumnIndex];
          announce(`Over ${nextColumn.title} column`);
          setFocusedColumnIndex(nextColumnIndex);
        } else {
          const nextIndex = Math.min(focusedColumnIndex + 1, KANBAN_COLUMNS.length - 1);
          setFocusedColumnIndex(nextIndex);
          setFocusedTaskIndex(0);
          announce(`${KANBAN_COLUMNS[nextIndex].title} column, ${tasksByStatus[KANBAN_COLUMNS[nextIndex].status].length} tasks`);
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        if (isKeyboardDragging && keyboardDraggedTask) {
          const prevColumnIndex = Math.max(focusedColumnIndex - 1, 0);
          const prevColumn = KANBAN_COLUMNS[prevColumnIndex];
          announce(`Over ${prevColumn.title} column`);
          setFocusedColumnIndex(prevColumnIndex);
        } else {
          const prevIndex = Math.max(focusedColumnIndex - 1, 0);
          setFocusedColumnIndex(prevIndex);
          setFocusedTaskIndex(0);
          announce(`${KANBAN_COLUMNS[prevIndex].title} column, ${tasksByStatus[KANBAN_COLUMNS[prevIndex].status].length} tasks`);
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (!isKeyboardDragging && currentTasks.length > 0) {
          const nextTaskIndex = Math.min(focusedTaskIndex + 1, currentTasks.length - 1);
          setFocusedTaskIndex(nextTaskIndex);
          const task = currentTasks[nextTaskIndex];
          announce(`Task: ${task.title}, priority ${task.priority}`);
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (!isKeyboardDragging && currentTasks.length > 0) {
          const prevTaskIndex = Math.max(focusedTaskIndex - 1, 0);
          setFocusedTaskIndex(prevTaskIndex);
          const task = currentTasks[prevTaskIndex];
          announce(`Task: ${task.title}, priority ${task.priority}`);
        }
        break;
        
      case ' ':
        e.preventDefault();
        if (isKeyboardDragging && keyboardDraggedTask) {
          // Drop the task
          const targetColumn = KANBAN_COLUMNS[focusedColumnIndex];
          if (keyboardDraggedTask.status !== targetColumn.status && onTaskStatusChange) {
            onTaskStatusChange(keyboardDraggedTask.id, targetColumn.status);
            announce(`Dropped "${keyboardDraggedTask.title}" in ${targetColumn.title} column`);
          } else {
            announce('Task dropped in same column');
          }
          setIsKeyboardDragging(false);
          setKeyboardDraggedTask(null);
        } else if (currentTasks.length > 0) {
          // Pick up the task
          const task = currentTasks[focusedTaskIndex];
          setKeyboardDraggedTask(task);
          setIsKeyboardDragging(true);
          announce(`Picked up "${task.title}". Use Left/Right arrows to move between columns, Space to drop, Escape to cancel`);
        }
        break;
        
      case 'Escape':
        if (isKeyboardDragging) {
          e.preventDefault();
          setIsKeyboardDragging(false);
          setKeyboardDraggedTask(null);
          announce('Drag cancelled');
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (!isKeyboardDragging && currentTasks.length > 0) {
          const task = currentTasks[focusedTaskIndex];
          onTaskClick?.(task);
          announce(`Opening task: ${task.title}`);
        }
        break;
    }
  }, [focusedColumnIndex, focusedTaskIndex, isKeyboardDragging, keyboardDraggedTask, tasksByStatus, onTaskStatusChange, onTaskClick, announce]);
  
  // Focus the currently selected task
  useEffect(() => {
    const currentColumn = KANBAN_COLUMNS[focusedColumnIndex];
    const currentTasks = tasksByStatus[currentColumn.status];
    if (currentTasks.length > 0 && focusedTaskIndex < currentTasks.length) {
      const taskId = currentTasks[focusedTaskIndex].id;
      const taskElement = taskRefs.current.get(taskId);
      if (taskElement && document.activeElement === boardRef.current) {
        // Only scroll into view, don't steal focus
        taskElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedColumnIndex, focusedTaskIndex, tasksByStatus]);

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'border-l-gray-400';
      case TaskPriority.MEDIUM:
        return 'border-l-blue-400';
      case TaskPriority.HIGH:
        return 'border-l-orange-400';
      case TaskPriority.URGENT:
        return 'border-l-red-400';
      default:
        return 'border-l-gray-400';
    }
  };

  const getCategoryColor = (category: TaskCategory) => {
    switch (category) {
      case TaskCategory.SETUP:
        return 'bg-purple-100 text-purple-800';
      case TaskCategory.MARKETING:
        return 'bg-pink-100 text-pink-800';
      case TaskCategory.LOGISTICS:
        return 'bg-info/20 text-blue-800';
      case TaskCategory.TECHNICAL:
        return 'bg-success/20 text-success';
      case TaskCategory.REGISTRATION:
        return 'bg-warning/20 text-yellow-800';
      case TaskCategory.POST_EVENT:
        return 'bg-muted text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const isOverdue = (task: WorkspaceTask) => {
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false;
    return new Date(task.dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-card shadow rounded-lg p-6">
        <SkeletonKanbanBoard />
      </div>
    );
  }

  return (
    <div className="bg-card shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-foreground">Task Board</h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop tasks to update their status
            </p>
          </div>
          {onCreateTask && (
            <button
              onClick={onCreateTask}
              className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Task
            </button>
          )}
        </div>
      </div>

      {/* Live Region for screen reader announcements */}
      <LiveRegion message={liveMessage} priority="polite" />
      
      {/* Keyboard instructions */}
      <div className="sr-only" aria-live="polite">
        Use arrow keys to navigate. Space to pick up or drop a task. Enter to open task details. Escape to cancel dragging.
      </div>

      {/* Kanban Board */}
      <div className="p-4 sm:p-6 overflow-x-auto">
        <div 
          ref={boardRef}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 min-h-96"
          role="application"
          aria-label="Task board. Use arrow keys to navigate between columns and tasks. Space to drag and drop. Enter to open task."
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {KANBAN_COLUMNS.map((column) => {
            const columnDropProps = dropZoneProps(column.status);
            const isActive = dragOverColumn === column.status || isDropTarget(column.status);
            
            return (
              <div
                key={column.status}
                {...columnDropProps}
                className={`flex flex-col ${column.bgColor} ${column.darkBgColor} rounded-lg p-3 sm:p-4 min-w-[280px] md:min-w-0 ${
                  isActive ? 'ring-2 ring-primary ring-opacity-50' : ''
                } ${columnDropProps.className || ''}`}
                onDragOver={(e) => handleDragOver(e, column.status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.status)}
                role="group"
                aria-label={`${column.title} column with ${tasksByStatus[column.status].length} tasks`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`font-medium text-sm sm:text-base ${column.color}`}>
                    {column.title}
                  </h4>
                  <span 
                    className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium rounded-full bg-card ${column.color}`}
                    aria-label={`${tasksByStatus[column.status].length} tasks`}
                  >
                    {tasksByStatus[column.status].length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="flex-1 space-y-3" role="list">
                  {tasksByStatus[column.status].length === 0 ? (
                    <div 
                      className="flex items-center justify-center h-32 border-2 border-dashed border-input rounded-lg"
                      aria-label="No tasks in this column"
                    >
                      <p className="text-sm text-muted-foreground">No tasks</p>
                    </div>
                  ) : (
                    tasksByStatus[column.status].map((task, taskIndex) => {
                      const isDragging = draggedTask?.id === task.id || isDraggingItem(task) || keyboardDraggedTask?.id === task.id;
                      const colIndex = KANBAN_COLUMNS.findIndex(c => c.status === column.status);
                      const isFocused = focusedColumnIndex === colIndex && focusedTaskIndex === taskIndex;
                      
                      return (
                        <div
                          key={task.id}
                          ref={(el) => {
                            if (el) taskRefs.current.set(task.id, el);
                            else taskRefs.current.delete(task.id);
                          }}
                          role="listitem"
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          onTouchStart={(e) => touchHandlers.onTouchStart(e, task)}
                          onTouchMove={touchHandlers.onTouchMove}
                          onTouchEnd={touchHandlers.onTouchEnd}
                          className={`bg-card rounded-lg p-3 shadow-sm border-l-4 ${getPriorityColor(task.priority)} 
                            cursor-move hover:shadow-md transition-all touch-manipulation select-none
                            min-h-[44px] ${isDragging ? 'opacity-50 scale-95' : ''} 
                            ${isFocused ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                          onClick={() => onTaskClick?.(task)}
                          aria-label={`Task: ${task.title}. Priority: ${task.priority}. Status: ${column.title}${isFocused ? '. Currently focused' : ''}`}
                          aria-grabbed={isDragging}
                        >
                          {/* Drag Handle for touch */}
                          <div className="flex items-start gap-2 mb-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 touch-none" aria-hidden="true" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h5 className="text-sm font-medium text-foreground line-clamp-2">
                                  {task.title}
                                </h5>
                                {isOverdue(task) && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 ml-2 flex-shrink-0">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Task Description */}
                          {task.description && (
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2 ml-6">
                              {task.description}
                            </p>
                          )}

                          {/* Task Metadata */}
                          <div className="space-y-2 ml-6">
                            {/* Category & Priority */}
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(task.category)}`}>
                                {task.category.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">
                                {task.priority}
                              </span>
                            </div>

                            {/* Due Date */}
                            {task.dueDate && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
                                <span className={isOverdue(task) ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                                  {formatDate(task.dueDate)}
                                </span>
                              </div>
                            )}

                            {/* Assignee */}
                            {task.assignee && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <div className="flex-shrink-0 h-5 w-5 mr-2">
                                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                    <span className="text-xs font-medium text-primary-foreground">
                                      {task.assignee.user.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <span className="truncate">
                                  {task.assignee.user.name}
                                </span>
                              </div>
                            )}

                            {/* Tags */}
                            {task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {task.tags.slice(0, 2).map(tag => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-foreground"
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
                            )}

                            {/* Progress Bar */}
                            {task.progress > 0 && (
                              <div className="w-full bg-muted rounded-full h-1.5" role="progressbar" aria-valuenow={task.progress} aria-valuemin={0} aria-valuemax={100}>
                                <div
                                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Task Actions */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border ml-6">
                            <div className="flex items-center space-x-1">
                              {task.dependencies.length > 0 && (
                                <span className="inline-flex items-center text-xs text-muted-foreground" aria-label={`${task.dependencies.length} dependencies`}>
                                  <Link2 className="w-3 h-3 mr-1" aria-hidden="true" />
                                  {task.dependencies.length}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              {onTaskEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTaskEdit(task);
                                  }}
                                  className="text-primary hover:text-primary/80 p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                                  aria-label={`Edit task: ${task.title}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              {onTaskDelete && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTaskToDelete(task.id);
                                  }}
                                  className="text-destructive hover:text-destructive/80 p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-destructive/10 transition-colors"
                                  aria-label={`Delete task: ${task.title}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
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