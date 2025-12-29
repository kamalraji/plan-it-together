import { useState, useEffect, useMemo } from 'react';
import { WorkspaceTask, TaskStatus, TeamMember, WorkspaceRoleScope } from '../../types';
import { TaskList } from './TaskList';
import { TaskKanbanBoard } from './TaskKanbanBoard';
import { TaskDetailView } from './TaskDetailView';
import { TaskFilterBar, TaskFilters } from './TaskFilterBar';

interface TaskManagementInterfaceProps {
  tasks: WorkspaceTask[];
  teamMembers: TeamMember[];
  roleScope?: WorkspaceRoleScope;
  onTaskEdit?: (task: WorkspaceTask) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
  onCreateTask?: () => void;
  isLoading?: boolean;
  initialTaskId?: string;
}

type ViewMode = 'list' | 'kanban';

export function TaskManagementInterface({
  tasks,
  teamMembers,
  roleScope,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onCreateTask,
  isLoading = false,
  initialTaskId,
}: TaskManagementInterfaceProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTask, setSelectedTask] = useState<WorkspaceTask | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: 'ALL',
    assigneeId: 'ALL',
    sortKey: 'dueDate',
    sortDirection: 'asc',
  });

  useEffect(() => {
    if (!initialTaskId) return;
    const match = tasks.find((task) => task.id === initialTaskId);
    if (match) {
      setSelectedTask(match);
    }
  }, [initialTaskId, tasks]);

  const handleTaskClick = (task: WorkspaceTask) => {
    setSelectedTask(task);
  };

  const handleTaskDetailClose = () => {
    setSelectedTask(null);
  };

  const filteredTasks = useMemo(() => {
    const base = [...tasks];

    const scopedByRole = base.filter((task) => {
      if (!roleScope || roleScope === 'ALL') return true;
      const taskScope = task.roleScope || (task.metadata?.roleScope as WorkspaceRoleScope | undefined);
      if (!taskScope) return false;
      return taskScope === roleScope;
    });

    const scoped = scopedByRole.filter((task) => {
      if (filters.status !== 'ALL' && task.status !== filters.status) {
        return false;
      }

      if (filters.assigneeId !== 'ALL') {
        if (filters.assigneeId === 'UNASSIGNED' && task.assignee) {
          return false;
        }
        if (filters.assigneeId !== 'UNASSIGNED' && task.assignee?.userId !== filters.assigneeId) {
          return false;
        }
      }

      if (filters.search) {
        const query = filters.search.toLowerCase();
        const inTitle = task.title.toLowerCase().includes(query);
        const inDescription = task.description?.toLowerCase().includes(query);
        return inTitle || inDescription;
      }

      return true;
    });

    scoped.sort((a, b) => {
      const direction = filters.sortDirection === 'asc' ? 1 : -1;

      if (filters.sortKey === 'createdAt') {
        const aTime = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
        const bTime = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
        return (aTime - bTime) * direction;
      }

      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return (aDue - bDue) * direction;
    });

    return scoped;
  }, [tasks, filters, roleScope]);

  const commonProps = {
    tasks,
    teamMembers,
    onTaskClick: handleTaskClick,
    onTaskEdit,
    onTaskDelete,
    onTaskStatusChange,
    onCreateTask,
    isLoading,
  };

  const handleFilterChange = (next: Partial<TaskFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Task Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize and track your event tasks
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex self-start rounded-md shadow-sm md:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
              viewMode === 'list'
                ? 'bg-primary/10 border-primary text-primary z-10'
                : 'bg-background border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <span>List view</span>
            </div>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
              viewMode === 'kanban'
                ? 'bg-primary/10 border-primary text-primary z-10'
                : 'bg-background border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              <span>Kanban board</span>
            </div>
          </button>
        </div>
      </div>

      {/* Shared filters for workspace tasks */}
      <TaskFilterBar filters={filters} onChange={handleFilterChange} teamMembers={teamMembers} />

      {/* Task Views */}
      {viewMode === 'list' ? (
        <TaskList {...commonProps} />
      ) : (
        <TaskKanbanBoard {...commonProps} tasks={filteredTasks} />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailView
          task={selectedTask}
          teamMembers={teamMembers}
          onTaskUpdate={(taskId, updates) => {
            // Handle task updates - this would typically call an API
            console.log('Update task:', taskId, updates);
          }}
          onStatusChange={onTaskStatusChange}
          onProgressUpdate={(taskId, progress) => {
            // Handle progress updates - this would typically call an API
            console.log('Update progress:', taskId, progress);
          }}
          onCommentAdd={(taskId, content) => {
            // Handle comment addition - this would typically call an API
            console.log('Add comment:', taskId, content);
          }}
          onCommentEdit={(commentId, content) => {
            // Handle comment editing - this would typically call an API
            console.log('Edit comment:', commentId, content);
          }}
          onCommentDelete={(commentId) => {
            // Handle comment deletion - this would typically call an API
            console.log('Delete comment:', commentId);
          }}
          onFileUpload={(taskId, files) => {
            // Handle file upload - this would typically call an API
            console.log('Upload files:', taskId, files);
          }}
          onFileDelete={(fileId) => {
            // Handle file deletion - this would typically call an API
            console.log('Delete file:', fileId);
          }}
          onClose={handleTaskDetailClose}
        />
      )}
    </div>
  );
}
