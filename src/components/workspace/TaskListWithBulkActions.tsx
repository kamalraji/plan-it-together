import { useState, useCallback } from 'react';
import { WorkspaceTask, TaskStatus, TaskPriority, TeamMember } from '@/types';
import { TaskList } from './TaskList';
import { BulkTaskActions } from './BulkTaskActions';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TaskListWithBulkActionsProps {
  tasks: WorkspaceTask[];
  teamMembers?: TeamMember[];
  workspaceId: string;
  onTaskClick?: (task: WorkspaceTask) => void;
  onTaskEdit?: (task: WorkspaceTask) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
  onCreateTask?: () => void;
  isLoading?: boolean;
}

export function TaskListWithBulkActions({
  tasks,
  teamMembers,
  workspaceId,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onCreateTask,
  isLoading = false,
}: TaskListWithBulkActionsProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const handleSelectAll = useCallback((selectAll: boolean) => {
    if (selectAll) {
      setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
    } else {
      setSelectedTaskIds(new Set());
    }
  }, [tasks]);

  const handleSelectTask = useCallback((taskId: string, selected: boolean) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedTaskIds(new Set());
  }, []);

  const handleBulkStatusChange = useCallback(async (taskIds: string[], status: TaskStatus) => {
    const { error } = await supabase
      .from('workspace_tasks')
      .update({ status })
      .in('id', taskIds);

    if (error) {
      toast.error('Failed to update tasks');
      throw error;
    }

    queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
  }, [workspaceId, queryClient]);

  const handleBulkPriorityChange = useCallback(async (taskIds: string[], priority: TaskPriority) => {
    const { error } = await supabase
      .from('workspace_tasks')
      .update({ priority })
      .in('id', taskIds);

    if (error) {
      toast.error('Failed to update priority');
      throw error;
    }

    queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
  }, [workspaceId, queryClient]);

  const handleBulkDelete = useCallback(async (taskIds: string[]) => {
    const { error } = await supabase
      .from('workspace_tasks')
      .delete()
      .in('id', taskIds);

    if (error) {
      toast.error('Failed to delete tasks');
      throw error;
    }

    queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
  }, [workspaceId, queryClient]);

  // Enhanced task click to handle selection with shift/ctrl
  const handleTaskClickWithSelection = useCallback((task: WorkspaceTask) => {
    // Normal click - open task
    onTaskClick?.(task);
  }, [onTaskClick]);

  return (
    <div className="space-y-0">
      {/* Bulk Actions Bar */}
      <BulkTaskActions
        tasks={tasks}
        selectedIds={selectedTaskIds}
        onSelectAll={handleSelectAll}
        onSelectTask={handleSelectTask}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkPriorityChange={handleBulkPriorityChange}
        onBulkDelete={handleBulkDelete}
        onClearSelection={handleClearSelection}
      />

      {/* Task List with selection support */}
      <TaskList
        tasks={tasks}
        teamMembers={teamMembers}
        onTaskClick={handleTaskClickWithSelection}
        onTaskEdit={onTaskEdit}
        onTaskDelete={onTaskDelete}
        onTaskStatusChange={onTaskStatusChange}
        onCreateTask={onCreateTask}
        isLoading={isLoading}
      />
    </div>
  );
}
