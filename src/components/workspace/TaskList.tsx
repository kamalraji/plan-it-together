import { useState, useMemo } from 'react';
import { WorkspaceTask, TaskStatus, TaskPriority, TaskCategory, TeamMember } from '../../types';
import { cn } from '@/lib/utils';
import { Plus, LayoutList, LayoutGrid, ClipboardList, ChevronUp, ChevronDown, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      if (filters.status !== 'ALL' && task.status !== filters.status) return false;
      if (filters.priority !== 'ALL' && task.priority !== filters.priority) return false;
      if (filters.category !== 'ALL' && task.category !== filters.category) return false;

      if (filters.assignee !== 'ALL') {
        if (filters.assignee === 'UNASSIGNED' && task.assignee) return false;
        if (filters.assignee !== 'UNASSIGNED' && task.assignee?.userId !== filters.assignee) return false;
      }

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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-3.5 w-3.5 text-primary" />
      : <ChevronDown className="h-3.5 w-3.5 text-primary" />;
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

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Tasks</h3>
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedTasks.length} of {tasks.length} tasks
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center justify-center p-1.5 rounded-md transition-all',
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label="List view"
              >
                <LayoutList className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex items-center justify-center p-1.5 rounded-md transition-all',
                  viewMode === 'grid'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {onCreateTask && (
              <Button onClick={onCreateTask} size="sm" className="hidden sm:flex">
                <Plus className="h-4 w-4 mr-1.5" />
                Create Task
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 py-4 border-b border-border bg-muted/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          >
            <option value="ALL">All Status</option>
            {Object.values(TaskStatus).map(status => (
              <option key={status} value={status}>{status.replace('_', ' ')}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          >
            <option value="ALL">All Priority</option>
            {Object.values(TaskPriority).map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          >
            <option value="ALL">All Categories</option>
            {Object.values(TaskCategory).map(category => (
              <option key={category} value={category}>{category.replace('_', ' ')}</option>
            ))}
          </select>

          {/* Assignee Filter */}
          <select
            value={filters.assignee}
            onChange={(e) => handleFilterChange('assignee', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          >
            <option value="ALL">All Assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {teamMembers.map(member => (
              <option key={member.id} value={member.userId}>{member.user.name}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={clearFilters}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Task List / Grid */}
      <div>
        {filteredAndSortedTasks.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">No tasks found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {tasks.length === 0
                ? "Get started by creating your first task."
                : "Try adjusting your filters to see more tasks."
              }
            </p>
            {onCreateTask && tasks.length === 0 && (
              <div className="mt-6">
                <Button onClick={onCreateTask}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create your first task
                </Button>
              </div>
            )}
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/60 transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Task</span>
                      <SortIcon field="title" />
                    </div>
                  </th>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/60 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/60 transition-colors hidden md:table-cell"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Priority</span>
                      <SortIcon field="priority" />
                    </div>
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Assignee
                  </th>
                  <th
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/60 transition-colors hidden sm:table-cell"
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Due Date</span>
                      <SortIcon field="dueDate" />
                    </div>
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAndSortedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="bg-card hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => onTaskClick?.(task)}
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground truncate">
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
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {task.assignee.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-foreground">
                            {task.assignee.user.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
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
                        <span className="text-muted-foreground">No due date</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
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
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this task?')) {
                                onTaskDelete(task.id);
                              }
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
        ) : (
          /* Grid View */
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => onTaskClick?.(task)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    </div>
                    {isOverdue(task) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive shrink-0">
                        Overdue
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      getStatusStyles(task.status)
                    )}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      getPriorityStyles(task.priority)
                    )}>
                      {task.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      getCategoryStyles(task.category)
                    )}>
                      {task.category.replace('_', ' ')}
                    </span>
                    {task.dueDate && (
                      <span className={cn(
                        'text-xs',
                        isOverdue(task) ? 'text-destructive font-medium' : 'text-muted-foreground'
                      )}>
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>

                  {task.assignee && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {task.assignee.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {task.assignee.user.name}
                      </span>
                    </div>
                  )}

                  {task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {task.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                      {task.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{task.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    {onTaskStatusChange && (
                      <select
                        value={task.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          onTaskStatusChange(task.id, e.target.value as TaskStatus);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs border border-border rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {Object.values(TaskStatus).map(status => (
                          <option key={status} value={status}>{status.replace('_', ' ')}</option>
                        ))}
                      </select>
                    )}
                    <div className="flex items-center gap-1">
                      {onTaskEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskEdit(task);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {onTaskDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this task?')) {
                              onTaskDelete(task.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
