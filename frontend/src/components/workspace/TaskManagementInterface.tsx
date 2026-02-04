import { useState } from 'react';
import { WorkspaceTask, TaskStatus, TeamMember } from '../../types';
import { TaskList } from './TaskList';
import { TaskKanbanBoard } from './TaskKanbanBoard';
import { TaskDetailView } from './TaskDetailView';

interface TaskManagementInterfaceProps {
  tasks: WorkspaceTask[];
  teamMembers: TeamMember[];
  onTaskEdit?: (task: WorkspaceTask) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
  onCreateTask?: () => void;
  isLoading?: boolean;
}

type ViewMode = 'list' | 'kanban';

export function TaskManagementInterface({
  tasks,
  teamMembers,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onCreateTask,
  isLoading = false
}: TaskManagementInterfaceProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTask, setSelectedTask] = useState<WorkspaceTask | null>(null);

  const handleTaskClick = (task: WorkspaceTask) => {
    setSelectedTask(task);
  };

  const handleTaskDetailClose = () => {
    setSelectedTask(null);
  };

  const commonProps = {
    tasks,
    teamMembers,
    onTaskClick: handleTaskClick,
    onTaskEdit,
    onTaskDelete,
    onTaskStatusChange,
    onCreateTask,
    isLoading
  };

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Task Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Organize and track your event tasks
          </p>
        </div>
        
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
              viewMode === 'list'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 z-10'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>List View</span>
            </div>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
              viewMode === 'kanban'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 z-10'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <span>Kanban Board</span>
            </div>
          </button>
        </div>
      </div>

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