import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { WorkspaceTask, TaskStatus, TaskPriority } from '../../../types';
import { MobileTaskCard } from './MobileTaskCard';
import { cn } from '@/lib/utils';

interface MobileTaskListProps {
  tasks: WorkspaceTask[];
  onTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskTitleUpdate: (taskId: string, title: string) => void;
  onTaskClick?: (task: WorkspaceTask) => void;
  onCreateTask?: () => void;
  isLoading?: boolean;
}

type ViewMode = 'list' | 'grouped';
type GroupBy = 'status' | 'priority' | 'none';

const STATUS_ORDER = [
  TaskStatus.NOT_STARTED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW_REQUIRED,
  TaskStatus.BLOCKED,
  TaskStatus.COMPLETED,
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.NOT_STARTED]: 'Not Started',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.REVIEW_REQUIRED]: 'Review Required',
  [TaskStatus.BLOCKED]: 'Blocked',
  [TaskStatus.COMPLETED]: 'Completed',
};

const PRIORITY_ORDER = [
  TaskPriority.URGENT,
  TaskPriority.HIGH,
  TaskPriority.MEDIUM,
  TaskPriority.LOW,
];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.URGENT]: 'Urgent',
  [TaskPriority.HIGH]: 'High Priority',
  [TaskPriority.MEDIUM]: 'Medium Priority',
  [TaskPriority.LOW]: 'Low Priority',
};

export function MobileTaskList({
  tasks,
  onTaskStatusChange,
  onTaskDelete,
  onTaskTitleUpdate,
  onTaskClick,
  onCreateTask,
  isLoading = false,
}: MobileTaskListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(STATUS_ORDER.map(s => s)));

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!task.title.toLowerCase().includes(query) &&
            !task.description?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Status filter
      if (statusFilter !== 'ALL' && task.status !== statusFilter) {
        return false;
      }
      
      // Priority filter
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
        return false;
      }
      
      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none' || viewMode === 'list') {
      return { 'All Tasks': filteredTasks };
    }

    const groups: Record<string, WorkspaceTask[]> = {};
    const order = groupBy === 'status' ? STATUS_ORDER : PRIORITY_ORDER;
    const labels = groupBy === 'status' ? STATUS_LABELS : PRIORITY_LABELS;

    order.forEach(key => {
      groups[labels[key as keyof typeof labels]] = [];
    });

    filteredTasks.forEach(task => {
      const key = groupBy === 'status' ? task.status : task.priority;
      const label = labels[key as keyof typeof labels];
      if (groups[label]) {
        groups[label].push(task);
      }
    });

    return groups;
  }, [filteredTasks, groupBy, viewMode]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
  };

  const hasActiveFilters = statusFilter !== 'ALL' || priorityFilter !== 'ALL' || searchQuery;

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-3" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search and filter header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-3 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded-full"
            >
              <XMarkIcon className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filter and view toggle row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors",
                showFilters || hasActiveFilters
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border text-foreground hover:bg-muted"
              )}
            >
              <FunnelIcon className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'list' ? "bg-card shadow-sm" : "hover:bg-card/50"
              )}
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'grouped' ? "bg-card shadow-sm" : "hover:bg-card/50"
              )}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 pt-2">
                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'ALL')}
                  className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ALL">All Status</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>

                {/* Priority filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'ALL')}
                  className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ALL">All Priority</option>
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>

                {/* Group by (only in grouped view) */}
                {viewMode === 'grouped' && (
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                    className="col-span-2 px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="status">Group by Status</option>
                    <option value="priority">Group by Priority</option>
                    <option value="none">No Grouping</option>
                  </select>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-3 pb-20 space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ListBulletIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No tasks found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {tasks.length === 0
                ? "Create your first task to get started"
                : "Try adjusting your filters"
              }
            </p>
            {onCreateTask && (
              <button
                onClick={onCreateTask}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Create Task
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <MobileTaskCard
                key={task.id}
                task={task}
                onStatusChange={onTaskStatusChange}
                onDelete={onTaskDelete}
                onTitleUpdate={onTaskTitleUpdate}
                onClick={onTaskClick}
              />
            ))}
          </div>
        ) : (
          Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
            <div key={groupName} className="space-y-2">
              <button
                onClick={() => toggleGroup(groupName)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-sm font-medium text-foreground"
              >
                <span className="flex items-center gap-2">
                  {groupName}
                  <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                    {groupTasks.length}
                  </span>
                </span>
                <ChevronDownIcon
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    expandedGroups.has(groupName) ? "rotate-180" : ""
                  )}
                />
              </button>

              <AnimatePresence>
                {expandedGroups.has(groupName) && groupTasks.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {groupTasks.map((task) => (
                      <MobileTaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={onTaskStatusChange}
                        onDelete={onTaskDelete}
                        onTitleUpdate={onTaskTitleUpdate}
                        onClick={onTaskClick}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {expandedGroups.has(groupName) && groupTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks in this group
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Floating create button */}
      {onCreateTask && (
        <button
          onClick={onCreateTask}
          className="fixed bottom-20 right-4 z-20 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
          aria-label="Create task"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
