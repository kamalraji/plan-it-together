import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkspaceTask, TaskStatus, TeamMember, WorkspaceRoleScope, TaskPriority } from '../../types';
import { TaskList } from './TaskList';
import { TaskKanbanBoard } from './TaskKanbanBoard';
import { TaskDetailView } from './TaskDetailView';
import { TaskFilterBar, TaskFilters } from './TaskFilterBar';
import { TaskFormModal } from './TaskFormModal';
import { TaskFormData } from './TaskForm';
import { LayoutList, Columns3, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaskManagementInterfaceProps {
  tasks: WorkspaceTask[];
  teamMembers: TeamMember[];
  workspaceId?: string;
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
  workspaceId,
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkspaceTask | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: 'ALL',
    assigneeId: 'ALL',
    sortKey: 'dueDate',
    sortDirection: 'asc',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskFormData) => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      
      const { error } = await supabase
        .from('workspace_tasks')
        .insert({
          workspace_id: workspaceId,
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority || TaskPriority.MEDIUM,
          status: TaskStatus.NOT_STARTED,
          due_date: taskData.dueDate || null,
          role_scope: taskData.roleScope || (roleScope === 'ALL' ? null : roleScope),
          assigned_to: taskData.assigneeId || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      toast({ title: 'Task created', description: 'Your new task has been created successfully.' });
      setShowCreateModal(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create task', 
        description: error?.message || 'Please try again.',
        variant: 'destructive' 
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, taskData }: { taskId: string; taskData: TaskFormData }) => {
      if (!workspaceId) throw new Error('Workspace ID is required');
      
      const { error } = await supabase
        .from('workspace_tasks')
        .update({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          due_date: taskData.dueDate || null,
          role_scope: taskData.roleScope || null,
          assigned_to: taskData.assigneeId || null,
        })
        .eq('id', taskId)
        .eq('workspace_id', workspaceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      toast({ title: 'Task updated', description: 'Your task has been updated successfully.' });
      setEditingTask(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update task', 
        description: error?.message || 'Please try again.',
        variant: 'destructive' 
      });
    },
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

  const handleCreateClick = () => {
    // If workspaceId is available, use the built-in modal
    if (workspaceId) {
      setShowCreateModal(true);
    } else if (onCreateTask) {
      // Fallback to parent handler if no workspaceId
      onCreateTask();
    }
  };

  const handleEditClick = (task: WorkspaceTask) => {
    if (workspaceId) {
      setEditingTask(task);
    } else if (onTaskEdit) {
      onTaskEdit(task);
    }
  };

  const handleFormSubmit = (taskData: TaskFormData) => {
    if (editingTask) {
      updateTaskMutation.mutate({ taskId: editingTask.id, taskData });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingTask(null);
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
    tasks: filteredTasks,
    teamMembers,
    onTaskClick: handleTaskClick,
    onTaskEdit: handleEditClick,
    onTaskDelete,
    onTaskStatusChange,
    onCreateTask: handleCreateClick,
    isLoading,
  };

  const handleFilterChange = (next: Partial<TaskFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Task Management</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-lg bg-muted/60 border border-border">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutList className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                viewMode === 'kanban'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Columns3 className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          {/* Create Task Button */}
          <Button onClick={handleCreateClick} size="sm" className="hidden sm:flex">
            <Plus className="h-4 w-4 mr-1.5" />
            New Task
          </Button>
          <Button onClick={handleCreateClick} size="icon" className="sm:hidden h-9 w-9">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TaskFilterBar filters={filters} onChange={handleFilterChange} teamMembers={teamMembers} />

      {/* Task Views */}
      {viewMode === 'list' ? (
        <TaskList {...commonProps} />
      ) : (
        <TaskKanbanBoard {...commonProps} />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailView
          task={selectedTask}
          teamMembers={teamMembers}
          onTaskUpdate={(taskId, updates) => {
            console.log('Update task:', taskId, updates);
          }}
          onStatusChange={onTaskStatusChange}
          onProgressUpdate={(taskId, progress) => {
            console.log('Update progress:', taskId, progress);
          }}
          onCommentAdd={(taskId, content) => {
            console.log('Add comment:', taskId, content);
          }}
          onCommentEdit={(commentId, content) => {
            console.log('Edit comment:', commentId, content);
          }}
          onCommentDelete={(commentId) => {
            console.log('Delete comment:', commentId);
          }}
          onFileUpload={(taskId, files) => {
            console.log('Upload files:', taskId, files);
          }}
          onFileDelete={(fileId) => {
            console.log('Delete file:', fileId);
          }}
          onClose={handleTaskDetailClose}
        />
      )}

      {/* Create/Edit Task Modal */}
      <TaskFormModal
        isOpen={showCreateModal || !!editingTask}
        task={editingTask ?? undefined}
        teamMembers={teamMembers}
        availableTasks={tasks}
        onSubmit={handleFormSubmit}
        onClose={handleModalClose}
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />
    </div>
  );
}
