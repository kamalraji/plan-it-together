import { useMemo, useState } from 'react';
import { useCrossWorkspaceTasks, CrossWorkspaceTask } from '@/hooks/useCrossWorkspaceTasks';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ExternalLink, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Loader2,
  FolderTree,
  AlertCircle,
  Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday } from 'date-fns';

interface CrossWorkspaceTasksPanelProps {
  workspaceId: string;
  eventId?: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  NOT_STARTED: { label: 'Not Started', icon: Circle, color: 'text-muted-foreground' },
  IN_PROGRESS: { label: 'In Progress', icon: Loader2, color: 'text-info' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, color: 'text-success' },
  BLOCKED: { label: 'Blocked', icon: AlertCircle, color: 'text-destructive' },
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  MEDIUM: 'bg-warning/10 text-warning border-warning/20',
  HIGH: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

export function CrossWorkspaceTasksPanel({ workspaceId }: CrossWorkspaceTasksPanelProps) {
  const { data: tasks = [], isLoading, error } = useCrossWorkspaceTasks({ sourceWorkspaceId: workspaceId });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Group tasks by target workspace
  const groupedTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.targetWorkspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignee?.fullName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    const groups = new Map<string, { workspace: CrossWorkspaceTask['targetWorkspace']; tasks: CrossWorkspaceTask[] }>();
    
    for (const task of filtered) {
      const key = task.targetWorkspace.id;
      if (!groups.has(key)) {
        groups.set(key, { workspace: task.targetWorkspace, tasks: [] });
      }
      groups.get(key)!.tasks.push(task);
    }

    return Array.from(groups.values()).sort((a, b) => a.workspace.name.localeCompare(b.workspace.name));
  }, [tasks, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    overdue: tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'COMPLETED').length,
  }), [tasks]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <p>Failed to load delegated tasks</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-foreground mb-1">No Delegated Tasks</h3>
        <p className="text-sm">
          Tasks assigned to child workspace members will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            Delegated Tasks
          </h3>
          <p className="text-sm text-muted-foreground">
            Tasks assigned to child workspace members
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-muted/40 rounded-lg p-3 border border-border">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total Tasks</p>
        </div>
        <div className="bg-info/10 rounded-lg p-3 border border-info/20">
          <p className="text-2xl font-bold text-info">{stats.inProgress}</p>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </div>
        <div className="bg-success/10 rounded-lg p-3 border border-success/20">
          <p className="text-2xl font-bold text-success">{stats.completed}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="bg-rose-500/10 rounded-lg p-3 border border-rose-500/20">
          <p className="text-2xl font-bold text-rose-600">{stats.overdue}</p>
          <p className="text-xs text-muted-foreground">Overdue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, workspaces, or assignees..."
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All Status</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      {/* Grouped Task List */}
      <div className="space-y-4">
        {groupedTasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No tasks match your filters</p>
          </div>
        ) : (
          groupedTasks.map(({ workspace, tasks: workspaceTasks }) => (
            <div key={workspace.id} className="border rounded-lg overflow-hidden">
              {/* Workspace Header */}
              <div className="bg-muted/40 px-4 py-2 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {workspace.type?.replace('_', ' ') || 'Workspace'}
                  </Badge>
                  <span className="font-medium">{workspace.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {workspaceTasks.length} task{workspaceTasks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Task List */}
              <div className="divide-y">
                {workspaceTasks.map(task => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: CrossWorkspaceTask }) {
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.NOT_STARTED;
  const StatusIcon = statusConfig.icon;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'COMPLETED';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <div className="px-4 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors">
      {/* Status Icon */}
      <StatusIcon className={cn('h-4 w-4 shrink-0', statusConfig.color)} />

      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{task.title}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate">{task.description}</p>
        )}
      </div>

      {/* Assignee */}
      {task.assignee && (
        <div className="flex items-center gap-2 shrink-0">
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.assignee.avatarUrl || undefined} />
            <AvatarFallback className="text-xs">
              {task.assignee.fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground hidden sm:block max-w-[100px] truncate">
            {task.assignee.fullName}
          </span>
        </div>
      )}

      {/* Sync Status */}
      {task.isSynced && (
        <div className="shrink-0" title="Status synced with parent task">
          <Link2 className="h-3.5 w-3.5 text-primary" />
        </div>
      )}

      {/* Priority */}
      <Badge 
        variant="outline" 
        className={cn('shrink-0 text-xs', PRIORITY_COLORS[task.priority] || '')}
      >
        {task.priority}
      </Badge>

      {/* Due Date */}
      {task.dueDate && (
        <div className={cn(
          'flex items-center gap-1 text-xs shrink-0',
          isOverdue ? 'text-destructive' : isDueToday ? 'text-warning' : 'text-muted-foreground'
        )}>
          <Clock className="h-3 w-3" />
          <span>{format(new Date(task.dueDate), 'MMM d')}</span>
        </div>
      )}

      {/* External Link */}
      <button
        type="button"
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
        title="View in workspace"
      >
        <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
}
