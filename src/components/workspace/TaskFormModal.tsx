import { WorkspaceTask, TeamMember } from '../../types';
import { TaskForm, TaskFormData } from './TaskForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {task 
              ? 'Update task details, assignees, and deadlines' 
              : 'Create a new task to organize your event activities'}
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
