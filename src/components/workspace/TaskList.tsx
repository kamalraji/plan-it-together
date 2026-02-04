import { useState, useMemo } from 'react';
import { WorkspaceTask, TaskStatus, TaskPriority, TaskCategory, TeamMember } from '../../types';

interface TaskListProps {
  tasks: WorkspaceTask[];
  teamMembers: TeamMember[];
  onTaskClick?: (task: WorkspaceTask) => void;
  onTaskEdit?: (task: WorkspaceTask) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
  onCreateTask?: () => void;
  isLoading?: boolean;
}

interface FilterOptions {
  status: TaskStatus | 'ALL';
  priority: TaskPriority | 'ALL';
  category: TaskCategory | 'ALL';
  assignee: string | 'ALL';
  search: string;
}

type SortField = 'title' | 'dueDate' | 'priority' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const PRIORITY_ORDER = {
  [TaskPriority.URGENT]: 4,
  [TaskPriority.HIGH]: 3,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.LOW]: 1
};

const STATUS_ORDER = {
  [TaskStatus.NOT_STARTED]: 1,
  [TaskStatus.IN_PROGRESS]: 2,
  [TaskStatus.REVIEW_REQUIRED]: 3,
  [TaskStatus.BLOCKED]: 4,
  [TaskStatus.COMPLETED]: 5
};

export function TaskList({
  tasks,
  teamMembers,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onCreateTask,
  isLoading = false
}: TaskListProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'ALL',
    priority: 'ALL',
    category: 'ALL',
    assignee: 'ALL',
    search: ''
  });

  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Status filter
      if (filters.status !== 'ALL' && task.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'ALL' && task.priority !== filters.priority) {
        return false;
      }

      // Category filter
      if (filters.category !== 'ALL' && task.category !== filters.category) {
        return false;
      }

      // Assignee filter
      if (filters.assignee !== 'ALL') {
        if (filters.assignee === 'UNASSIGNED' && task.assignee) {
          return false;
        }
        if (filters.assignee !== 'UNASSIGNED' && task.assignee?.userId !== filters.assignee) {
          return false;
        }
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower) ||
          task.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'priority':
          comparison = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
          break;
        case 'status':
          comparison = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tasks, filters, sortField, sortDirection]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'ALL',
      priority: 'ALL',
      category: 'ALL',
      assignee: 'ALL',
      search: ''
    });
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return 'bg-gray-100 text-gray-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.REVIEW_REQUIRED:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.BLOCKED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-gray-100 text-gray-800';
      case TaskPriority.MEDIUM:
        return 'bg-blue-100 text-blue-800';
      case TaskPriority.HIGH:
        return 'bg-orange-100 text-orange-800';
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-800';
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
      day: 'numeric',
      year: 'numeric'
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
            <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
            <p className="text-sm text-gray-500">
              {filteredAndSortedTasks.length} of {tasks.length} tasks
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                  viewMode === 'list'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  viewMode === 'grid'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Grid
              </button>
            </div>

            {/* Create Task Button */}
            {onCreateTask && (
              <button
                onClick={onCreateTask}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="ALL">All Status</option>
              {Object.values(TaskStatus).map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="ALL">All Priority</option>
              {Object.values(TaskPriority).map(priority => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {Object.values(TaskCategory).map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <select
              value={filters.assignee}
              onChange={(e) => handleFilterChange('assignee', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="ALL">All Assignees</option>
              <option value="UNASSIGNED">Unassigned</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.userId}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={clearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="divide-y divide-gray-200">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {tasks.length === 0 
                ? "Get started by creating your first task."
                : "Try adjusting your filters to see more tasks."
              }
            </p>
            {onCreateTask && tasks.length === 0 && (
              <div className="mt-6">
                <button
                  onClick={onCreateTask}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create your first task
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'list' ? (
          // List View
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Task</span>
                      <SortIcon field="title" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Priority</span>
                      <SortIcon field="priority" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Due Date</span>
                      <SortIcon field="dueDate" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onTaskClick?.(task)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {task.title}
                            </p>
                            {isOverdue(task) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Overdue
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {task.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              task.category === TaskCategory.SETUP ? 'bg-purple-100 text-purple-800' :
                              task.category === TaskCategory.MARKETING ? 'bg-pink-100 text-pink-800' :
                              task.category === TaskCategory.LOGISTICS ? 'bg-blue-100 text-blue-800' :
                              task.category === TaskCategory.TECHNICAL ? 'bg-green-100 text-green-800' :
                              task.category === TaskCategory.REGISTRATION ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.category.replace('_', ' ')}
                            </span>
                            {task.tags.map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.assignee ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {task.assignee.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {task.assignee.user.name}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.dueDate ? (
                        <span className={isOverdue(task) ? 'text-red-600 font-medium' : ''}>
                          {formatDate(task.dueDate)}
                        </span>
                      ) : (
                        <span className="text-gray-500">No due date</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {onTaskStatusChange && (
                          <select
                            value={task.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              onTaskStatusChange(task.id, e.target.value as TaskStatus);
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {Object.values(TaskStatus).map(status => (
                              <option key={status} value={status}>
                                {status.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        )}
                        {onTaskEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskEdit(task);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                        )}
                        {onTaskDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this task?')) {
                                onTaskDelete(task.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Grid View
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onTaskClick?.(task)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    </div>
                    {isOverdue(task) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 ml-2">
                        Overdue
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      task.category === TaskCategory.SETUP ? 'bg-purple-100 text-purple-800' :
                      task.category === TaskCategory.MARKETING ? 'bg-pink-100 text-pink-800' :
                      task.category === TaskCategory.LOGISTICS ? 'bg-blue-100 text-blue-800' :
                      task.category === TaskCategory.TECHNICAL ? 'bg-green-100 text-green-800' :
                      task.category === TaskCategory.REGISTRATION ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.category.replace('_', ' ')}
                    </span>
                    {task.dueDate && (
                      <span className={`text-xs ${isOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>

                  {task.assignee && (
                    <div className="flex items-center mb-3">
                      <div className="flex-shrink-0 h-6 w-6">
                        <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {task.assignee.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <span className="ml-2 text-xs text-gray-700">
                        {task.assignee.user.name}
                      </span>
                    </div>
                  )}

                  {task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {task.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                      {task.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{task.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    {onTaskStatusChange && (
                      <select
                        value={task.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          onTaskStatusChange(task.id, e.target.value as TaskStatus);
                        }}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {Object.values(TaskStatus).map(status => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    )}
                    <div className="flex items-center space-x-2">
                      {onTaskEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskEdit(task);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 text-xs"
                        >
                          Edit
                        </button>
                      )}
                      {onTaskDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this task?')) {
                              onTaskDelete(task.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}