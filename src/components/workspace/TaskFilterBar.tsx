import { TaskStatus, TeamMember } from '../../types';

export type TaskSortKey = 'dueDate' | 'createdAt';
export type TaskSortDirection = 'asc' | 'desc';

export interface TaskFilters {
  search: string;
  status: TaskStatus | 'ALL';
  assigneeId: string | 'ALL';
  sortKey: TaskSortKey;
  sortDirection: TaskSortDirection;
}

interface TaskFilterBarProps {
  filters: TaskFilters;
  onChange: (next: Partial<TaskFilters>) => void;
  teamMembers: TeamMember[];
}

export function TaskFilterBar({ filters, onChange, teamMembers }: TaskFilterBarProps) {
  const handleInputChange = (key: keyof TaskFilters, value: string) => {
    onChange({ [key]: value } as Partial<TaskFilters>);
  };

  const toggleSortDirection = () => {
    onChange({ sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc' });
  };

  return (
    <div className="w-full rounded-lg border border-border bg-card/80 backdrop-blur-sm px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Left: Search */}
        <div className="w-full md:max-w-sm">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Search tasks</label>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
              placeholder="Search by title or description"
              className="block w-full rounded-md border border-border bg-background px-3 py-2 pr-9 text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.65" y1="16.65" x2="21" y2="21" />
              </svg>
            </span>
          </div>
        </div>

        {/* Right: Filters */}
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3 md:flex-1 md:items-end">
          {/* Status */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="ALL">All statuses</option>
              {Object.values(TaskStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Assignee</label>
            <select
              value={filters.assigneeId}
              onChange={(e) => handleInputChange('assigneeId', e.target.value)}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="ALL">All assignees</option>
              <option value="UNASSIGNED">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.userId}>
                  {member.user?.name || 'Member'}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Sort</label>
            <div className="flex gap-2">
              <select
                value={filters.sortKey}
                onChange={(e) => handleInputChange('sortKey', e.target.value as TaskSortKey)}
                className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="dueDate">Due date</option>
                <option value="createdAt">Created date</option>
              </select>
              <button
                type="button"
                onClick={toggleSortDirection}
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-2 py-2 text-xs text-muted-foreground shadow-xs hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label="Toggle sort direction"
              >
                {filters.sortDirection === 'asc' ? (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 17h13" />
                    <path d="M3 12h9" />
                    <path d="M3 7h5" />
                    <path d="M18 20V4" />
                    <path d="m14 16 4 4 4-4" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 7h13" />
                    <path d="M3 12h9" />
                    <path d="M3 17h5" />
                    <path d="M18 4v16" />
                    <path d="m14 8 4-4 4 4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
