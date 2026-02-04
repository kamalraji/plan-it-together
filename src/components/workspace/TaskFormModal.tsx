import { WorkspaceTask, TeamMember } from '../../types';
import { TaskForm, TaskFormData } from './TaskForm';

interface TaskFormModalProps {
  isOpen: boolean;
  task?: WorkspaceTask;
  teamMembers: TeamMember[];
  availableTasks: WorkspaceTask[];
  onSubmit: (taskData: TaskFormData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function TaskFormModal({
  isOpen,
  task,
  teamMembers,
  availableTasks,
  onSubmit,
  onClose,
  isLoading = false
}: TaskFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <TaskForm
            task={task}
            teamMembers={teamMembers}
            availableTasks={availableTasks}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}