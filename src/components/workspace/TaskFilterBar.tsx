import { TaskStatus, TaskPriority, TaskCategory, TeamMember } from '../../types';
import { Search, ArrowUp, ArrowDown, X, Calendar, Flag, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskPhase, PHASE_CONFIG, PRIORITY_CONFIG_EXTENDED } from '@/lib/taskTemplates';

export type TaskSortKey = 'dueDate' | 'createdAt' | 'priority';
export type TaskSortDirection = 'asc' | 'desc';
export type DatePreset = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'OVERDUE' | 'NO_DUE_DATE';

export interface TaskFilters {
  search: string;
  status: TaskStatus | 'ALL';
  assigneeId: string | 'ALL';
  priority: TaskPriority | 'ALL';
  category: TaskCategory | 'ALL';
  phase: TaskPhase | 'ALL';
  datePreset: DatePreset;
  sortKey: TaskSortKey;
  sortDirection: TaskSortDirection;
}

interface TaskFilterBarProps {
  filters: TaskFilters;
  onChange: (next: Partial<TaskFilters>) => void;
  teamMembers: TeamMember[];
}

const DATE_PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: 'ALL', label: 'All dates' },
  { value: 'TODAY', label: 'Due today' },
  { value: 'THIS_WEEK', label: 'This week' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'NO_DUE_DATE', label: 'No due date' },
];

export function TaskFilterBar({ filters, onChange, teamMembers }: TaskFilterBarProps) {
  const handleInputChange = (key: keyof TaskFilters, value: string) => {
    onChange({ [key]: value } as Partial<TaskFilters>);
  };

  const toggleSortDirection = () => {
    onChange({ sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc' });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.status !== 'ALL' || 
    filters.assigneeId !== 'ALL' ||
    filters.priority !== 'ALL' ||
    filters.category !== 'ALL' ||
    filters.phase !== 'ALL' ||
    filters.datePreset !== 'ALL';

  const activeFilterCount = [
    filters.status !== 'ALL',
    filters.assigneeId !== 'ALL',
    filters.priority !== 'ALL',
    filters.category !== 'ALL',
    filters.phase !== 'ALL',
    filters.datePreset !== 'ALL',
  ].filter(Boolean).length;

  const clearFilters = () => {
    onChange({
      search: '',
      status: 'ALL',
      assigneeId: 'ALL',
      priority: 'ALL',
      category: 'ALL',
      phase: 'ALL',
      datePreset: 'ALL',
    });
  };

  return (
    <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Main Filter Row */}
      <div className="px-4 py-3 flex flex-col gap-3">
        {/* Search and Core Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-0 lg:max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleInputChange('search', e.target.value)}
                placeholder="Search tasks..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status */}
            <select
              value={filters.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all min-w-[120px]"
            >
              <option value="ALL">All statuses</option>
              {Object.values(TaskStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>

            {/* Priority */}
            <select
              value={filters.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all min-w-[100px]"
            >
              <option value="ALL">All priorities</option>
              {Object.values(TaskPriority).map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>

            {/* Assignee */}
            <select
              value={filters.assigneeId}
              onChange={(e) => handleInputChange('assigneeId', e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all min-w-[130px]"
            >
              <option value="ALL">All assignees</option>
              <option value="UNASSIGNED">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.userId}>
                  {member.user?.name || 'Member'}
                </option>
              ))}
            </select>

            {/* Sort */}
            <div className="flex items-center gap-1">
              <select
                value={filters.sortKey}
                onChange={(e) => handleInputChange('sortKey', e.target.value as TaskSortKey)}
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all min-w-[100px]"
              >
                <option value="dueDate">Due date</option>
                <option value="createdAt">Created</option>
                <option value="priority">Priority</option>
              </select>
              <button
                type="button"
                onClick={toggleSortDirection}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                aria-label="Toggle sort direction"
              >
                {filters.sortDirection === 'asc' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-3 text-primary hover:text-primary/80"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Button>
            )}
          </div>
        </div>

        {/* Extended Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={filters.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="h-8 px-2 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            >
              <option value="ALL">All categories</option>
              {Object.values(TaskCategory).map((category) => (
                <option key={category} value={category}>
                  {category.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Phase Filter */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={filters.phase || 'ALL'}
              onChange={(e) => handleInputChange('phase', e.target.value)}
              className="h-8 px-2 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            >
              <option value="ALL">All phases</option>
              {Object.entries(PHASE_CONFIG).map(([phase, config]) => (
                <option key={phase} value={phase}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Preset Filter */}
          <div className="flex items-center gap-1">
            {DATE_PRESET_OPTIONS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleInputChange('datePreset', preset.value)}
                className={cn(
                  "h-7 px-2.5 rounded-md text-xs font-medium transition-all",
                  filters.datePreset === preset.value
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Active Priority Badges */}
          {filters.priority !== 'ALL' && (
            <Badge 
              variant="secondary" 
              className={cn(
                "gap-1 cursor-pointer",
                PRIORITY_CONFIG_EXTENDED[filters.priority as TaskPriority]?.bgColor
              )}
              onClick={() => onChange({ priority: 'ALL' })}
            >
              <Flag className="h-3 w-3" />
              {filters.priority}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Export default filters for initialization
export const DEFAULT_TASK_FILTERS: TaskFilters = {
  search: '',
  status: 'ALL',
  assigneeId: 'ALL',
  priority: 'ALL',
  category: 'ALL',
  phase: 'ALL',
  datePreset: 'ALL',
  sortKey: 'dueDate',
  sortDirection: 'asc',
};
