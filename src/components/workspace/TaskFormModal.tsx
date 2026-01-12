import { WorkspaceTask, TeamMember } from '../../types';
import { TaskForm, TaskFormData } from './TaskForm';

interface TaskFormModalProps {
  isOpen: boolean;
  task?: WorkspaceTask;
  teamMembers: TeamMember[];
  availableTasks: WorkspaceTask[];
  workspaceId?: string;
  eventId?: string;
  enableCrossWorkspaceAssignment?: boolean;
  onSubmit: (taskData: TaskFormData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function TaskFormModal({
  isOpen,
  task,
  teamMembers,
  availableTasks,
  workspaceId,
  eventId,
  enableCrossWorkspaceAssignment = false,
  onSubmit,
  onClose,
  isLoading = false
}: TaskFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-4xl text-left">

        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="bg-white rounded-lg text-left shadow-xl transform transition-all w-full max-w-4xl max-h-[90vh] overflow-y-auto">

          <TaskForm
            task={task}
            teamMembers={teamMembers}
            availableTasks={availableTasks}
            workspaceId={workspaceId}
            eventId={eventId}
            enableCrossWorkspaceAssignment={enableCrossWorkspaceAssignment}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
