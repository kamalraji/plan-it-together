import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  MapPinIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { WorkspaceTask, TaskStatus, TeamMember } from '../../../types';
import { MobileTaskList } from './MobileTaskList';
import { TaskFormModal } from '../TaskFormModal';
import { TaskFormData } from '../TaskForm';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MobileTaskManagementProps {
  workspaceId: string;
  onCreateTask?: () => void;
  onTaskClick?: (task: WorkspaceTask) => void;
}

export function MobileTaskManagement({
  workspaceId,
  onCreateTask,
  onTaskClick,
}: MobileTaskManagementProps) {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkspaceTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<WorkspaceTask | null>(null);

  // Fetch tasks from Supabase
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['workspace-tasks', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform to WorkspaceTask format
      return (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status as TaskStatus,
        priority: task.priority,
        dueDate: task.due_date,
        assignee: task.assigned_to ? { 
          id: task.assigned_to, 
          userId: task.assigned_to,
          user: { id: task.assigned_to, name: 'Team Member', email: '' }
        } : undefined,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        tags: [],
        category: 'GENERAL',
      })) as unknown as WorkspaceTask[];
    },
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['workspace-team-members', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      
      // Fetch user profiles separately
      const userIds = (data || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return (data || []).map(member => ({
        id: member.id,
        userId: member.user_id,
        role: member.role,
        user: {
          id: member.user_id,
          name: profileMap.get(member.user_id)?.full_name || 'Unknown',
          email: '',
        }
      })) as TeamMember[];
    },
  });

  // Task mutations
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<WorkspaceTask> }) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .update({
          title: updates.title,
          description: updates.description,
          status: updates.status,
          priority: updates.priority,
          due_date: updates.dueDate,
          assigned_to: updates.assignee?.userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      toast.success('Task updated');
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskFormData) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .insert({
          workspace_id: workspaceId,
          title: taskData.title,
          description: taskData.description,
          status: 'TODO',
          priority: taskData.priority || 'MEDIUM',
          due_date: taskData.dueDate,
          assigned_to: taskData.assigneeId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      toast.success('Task created');
      setShowCreateModal(false);
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('workspace_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      toast.success('Task deleted');
      setSelectedTask(null);
    },
    onError: () => {
      toast.error('Failed to delete task');
    },
  });

  const handleTaskStatusChange = (taskId: string, status: TaskStatus) => {
    updateTaskMutation.mutate({ taskId, updates: { status } });
  };

  const handleTaskTitleUpdate = (taskId: string, title: string) => {
    updateTaskMutation.mutate({ taskId, updates: { title } });
  };

  const handleTaskDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleTaskClick = (task: WorkspaceTask) => {
    if (onTaskClick) {
      onTaskClick(task);
    } else {
      setSelectedTask(task);
    }
  };

  const handleFormSubmit = (taskData: TaskFormData) => {
    if (editingTask) {
      updateTaskMutation.mutate({ 
        taskId: editingTask.id, 
        updates: taskData as Partial<WorkspaceTask>
      });
      setEditingTask(null);
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const handleLocationCheckIn = async (taskId: string) => {
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          });
        });

        const { latitude, longitude } = position.coords;
        const timestamp = new Date().toISOString();

        await supabase.from('workspace_activities').insert({
          workspace_id: workspaceId,
          type: 'task',
          title: 'Mobile task check-in',
          description: 'A mobile location check-in was recorded for a task.',
          metadata: { taskId, latitude, longitude, timestamp, source: 'mobile', action: 'location_checkin' },
        });

        toast.success('Location check-in successful!');
      } catch (_error) {
        toast.error('Failed to get location. Please ensure location services are enabled.');
      }
    } else {
      toast.error('Location services not supported on this device.');
    }
  };

  const triggerPhotoUpload = (taskId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const fileName = `${taskId}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          await supabase.from('workspace_activities').insert({
            workspace_id: workspaceId,
            type: 'task',
            title: 'Mobile task photo uploaded',
            description: 'A photo was uploaded to a task from mobile.',
            metadata: { taskId, source: 'mobile', action: 'photo_upload', fileName },
          });

          toast.success('Photo uploaded successfully!');
        } catch (_error) {
          toast.error('Failed to upload photo. Please try again.');
        }
      }
    };
    input.click();
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <MobileTaskList
        tasks={tasks}
        onTaskStatusChange={handleTaskStatusChange}
        onTaskDelete={handleTaskDelete}
        onTaskTitleUpdate={handleTaskTitleUpdate}
        onTaskClick={handleTaskClick}
        onCreateTask={() => onCreateTask ? onCreateTask() : setShowCreateModal(true)}
        isLoading={isLoading}
      />

      {/* Create/Edit Modal */}
      <TaskFormModal
        isOpen={showCreateModal || !!editingTask}
        task={editingTask ?? undefined}
        teamMembers={teamMembers}
        availableTasks={tasks}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTask(null);
        }}
      />

      {/* Task detail sheet */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background z-40"
              onClick={() => setSelectedTask(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-2xl max-h-[80vh] overflow-hidden"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Task Details</h2>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-100px)]">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {selectedTask.title}
                </h3>
                
                {selectedTask.description && (
                  <p className="text-muted-foreground mb-4">
                    {selectedTask.description}
                  </p>
                )}

                <div className="space-y-3">
                  {/* Status */}
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      selectedTask.status === TaskStatus.COMPLETED 
                        ? "bg-chart-3/10 text-chart-3"
                        : selectedTask.status === TaskStatus.IN_PROGRESS
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {selectedTask.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Priority</span>
                    <span className="text-sm font-medium text-foreground">
                      {selectedTask.priority}
                    </span>
                  </div>

                  {/* Due Date */}
                  {selectedTask.dueDate && (
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Due Date</span>
                      <span className="text-sm font-medium text-foreground">
                        {new Date(selectedTask.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Assignee */}
                  {selectedTask.assignee && (
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Assignee</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {selectedTask.assignee.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {selectedTask.assignee.user.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleLocationCheckIn(selectedTask.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 transition-colors"
                  >
                    <MapPinIcon className="w-4 h-4" />
                    Check-in
                  </button>
                  <button
                    onClick={() => triggerPhotoUpload(selectedTask.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 bg-chart-3/10 text-chart-3 rounded-lg text-sm font-medium hover:bg-chart-3/20 transition-colors"
                  >
                    <PhotoIcon className="w-4 h-4" />
                    Add Photo
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setEditingTask(selectedTask);
                      setSelectedTask(null);
                    }}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Edit Task
                  </button>
                  <button
                    onClick={() => handleTaskDelete(selectedTask.id)}
                    className="flex-1 py-2.5 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
