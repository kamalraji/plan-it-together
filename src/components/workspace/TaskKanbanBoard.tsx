import React, { useState, useCallback } from 'react';
import { WorkspaceTask, TaskStatus, TaskPriority, TaskCategory } from '../../types';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

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
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    status: TaskStatus.NOT_STARTED,
    title: 'Not Started',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50'
  },
  {
    status: TaskStatus.IN_PROGRESS,
    title: 'In Progress',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50'
  },
  {
    status: TaskStatus.REVIEW_REQUIRED,
    title: 'Review Required',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50'
  },
  {
    status: TaskStatus.BLOCKED,
    title: 'Blocked',
    color: 'text-red-700',
    bgColor: 'bg-red-50'
  },
  {
    status: TaskStatus.COMPLETED,
    title: 'Completed',
    color: 'text-green-700',
    bgColor: 'bg-green-50'
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
  }, []);

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
    }
    setDraggedTask(null);
  }, [draggedTask, onTaskStatusChange]);

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
        return 'bg-blue-100 text-blue-800';
      case TaskCategory.TECHNICAL:
        return 'bg-green-100 text-green-800';
      case TaskCategory.REGISTRATION:
        return 'bg-yellow-100 text-yellow-800';
      case TaskCategory.POST_EVENT:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Task Board</h3>
            <p className="text-sm text-gray-500">
              Drag and drop tasks to update their status
            </p>
          </div>
          {onCreateTask && (
            <button
              onClick={onCreateTask}
              className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Task
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 min-h-96">
          {KANBAN_COLUMNS.map((column) => (
            <div
              key={column.status}
              className={`flex flex-col ${column.bgColor} rounded-lg p-4 ${dragOverColumn === column.status ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''
                }`}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-medium ${column.color}`}>
                  {column.title}
                </h4>
                <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-white ${column.color}`}>
                  {tasksByStatus[column.status].length}
                </span>
              </div>

              {/* Tasks */}
              <div className="flex-1 space-y-3">
                {tasksByStatus[column.status].length === 0 ? (
                  <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-sm text-gray-500">No tasks</p>
                  </div>
                ) : (
                  tasksByStatus[column.status].map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white rounded-lg p-3 shadow-sm border-l-4 ${getPriorityColor(task.priority)} cursor-move hover:shadow-md transition-shadow ${draggedTask?.id === task.id ? 'opacity-50' : ''
                        }`}
                      onClick={() => onTaskClick?.(task)}
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {task.title}
                        </h5>
                        {isOverdue(task) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 ml-2 flex-shrink-0">
                            Overdue
                          </span>
                        )}
                      </div>

                      {/* Task Description */}
                      {task.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Task Metadata */}
                      <div className="space-y-2">
                        {/* Category */}
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(task.category)}`}>
                            {task.category.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {task.priority}
                          </span>
                        </div>

                        {/* Due Date */}
                        {task.dueDate && (
                          <div className="flex items-center text-xs text-gray-500">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className={isOverdue(task) ? 'text-red-600 font-medium' : ''}>
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        )}

                        {/* Assignee */}
                        {task.assignee && (
                          <div className="flex items-center text-xs text-gray-600">
                            <div className="flex-shrink-0 h-5 w-5 mr-2">
                              <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center">
                                <span className="text-xs font-medium text-white">
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
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{task.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Progress Bar */}
                        {task.progress > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>

                      {/* Task Actions */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center space-x-1">
                          {task.dependencies.length > 0 && (
                            <span className="inline-flex items-center text-xs text-gray-500">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
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
                              className="text-indigo-600 hover:text-indigo-900 text-xs p-1"
                              title="Edit task"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {onTaskDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaskToDelete(task.id);
                              }}
                              className="text-red-600 hover:text-red-900 text-xs p-1"
                              title="Delete task"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
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