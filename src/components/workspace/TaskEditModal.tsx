import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkspaceTask, TeamMember, TaskStatus, TaskPriority } from '../../types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTaskComments } from '@/hooks/useTaskComments';
import { useTaskActivities } from '@/hooks/useTaskActivities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubtaskSection, type Subtask } from './task-form';
import { LiveRegion, useLiveAnnouncement } from '@/components/accessibility/LiveRegion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Save, 
  X, 
  Calendar, 
  Users, 
  MessageSquare, 
  Activity,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskEditModalProps {
  isOpen: boolean;
  task: WorkspaceTask;
  teamMembers: TeamMember[];
  workspaceId: string;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

const PRIORITY_CONFIG = {
  [TaskPriority.LOW]: { label: 'Low', color: 'bg-emerald-500/10 text-emerald-600' },
  [TaskPriority.MEDIUM]: { label: 'Medium', color: 'bg-amber-500/10 text-amber-600' },
  [TaskPriority.HIGH]: { label: 'High', color: 'bg-rose-500/10 text-rose-600' },
  [TaskPriority.URGENT]: { label: 'Urgent', color: 'bg-red-500/10 text-red-600' },
};

const STATUS_CONFIG = {
  [TaskStatus.NOT_STARTED]: { label: 'Not Started', color: 'bg-muted text-muted-foreground' },
  [TaskStatus.IN_PROGRESS]: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-600' },
  [TaskStatus.BLOCKED]: { label: 'Blocked', color: 'bg-orange-500/10 text-orange-600' },
  [TaskStatus.COMPLETED]: { label: 'Completed', color: 'bg-green-500/10 text-green-600' },
};

export function TaskEditModal({
  isOpen,
  task,
  teamMembers,
  workspaceId,
  onClose,
  onTaskUpdated,
}: TaskEditModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { message: announcement, announce } = useLiveAnnouncement();
  
  // Form state
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [assigneeId, setAssigneeId] = useState(task.assignee?.userId || '');
  const [subtasks, setSubtasks] = useState<Subtask[]>(
    (task.subtasks || []).map((s) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      assignedTo: s.assignedTo,
    }))
  );
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  // Hooks for comments and activities
  const { comments, addComment, isAddingComment } = useTaskComments({ taskId: task.id });
  const { activities } = useTaskActivities({ taskId: task.id });

  // Reset form when task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setStatus(task.status);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setAssigneeId(task.assignee?.userId || '');
    setSubtasks(
      (task.subtasks || []).map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        assignedTo: s.assignedTo,
      }))
    );
  }, [task]);

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('workspace_tasks')
        .update({
          title,
          description,
          priority,
          status,
          due_date: dueDate || null,
          assigned_to: assigneeId || null,
        })
        .eq('id', task.id)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      // Subtask updates would be handled via a separate API if the table exists
      // For now, subtask state is managed locally
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks', workspaceId] });
      toast({ title: 'Task updated successfully' });
      announce('Task saved successfully');
      onTaskUpdated?.();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update task',
        description: error.message,
        variant: 'destructive',
      });
      announce('Failed to save task');
    },
  });

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addComment({ content: newComment });
    setNewComment('');
    announce('Comment added');
  };

  // Calculate subtask progress
  const completedSubtasks = subtasks.filter(
    (s) => s.status === TaskStatus.COMPLETED
  ).length;
  const subtaskProgress =
    subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  const hasChanges =
    title !== task.title ||
    description !== (task.description || '') ||
    priority !== task.priority ||
    status !== task.status ||
    dueDate !== (task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '') ||
    assigneeId !== (task.assignee?.userId || '');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <LiveRegion message={announcement} />
        
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            Edit Task
          </DialogTitle>
          <DialogDescription>
            Update task details, manage subtasks, and view activity
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="mx-6">
            <TabsTrigger value="details" className="gap-2">
              <FileText className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="subtasks" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Subtasks
              {subtasks.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {completedSubtasks}/{subtasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments
              {comments.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {comments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-200px)]">
            <TabsContent value="details" className="px-6 py-4 space-y-4 m-0">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task description"
                  rows={3}
                />
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <span className={cn('px-2 py-0.5 rounded', config.color)}>
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <span className={cn('px-2 py-0.5 rounded', config.color)}>
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due Date & Assignee */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due-date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assignee
                  </Label>
                  <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          {member.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="subtasks" className="px-6 py-4 m-0">
              {subtasks.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {completedSubtasks} of {subtasks.length} completed
                    </span>
                    <span className="text-sm font-medium">{Math.round(subtaskProgress)}%</span>
                  </div>
                  <Progress value={subtaskProgress} className="h-2" />
                </div>
              )}
              
              <SubtaskSection
                subtasks={subtasks}
                onChange={setSubtasks}
                teamMembers={teamMembers}
              />
            </TabsContent>

            <TabsContent value="comments" className="px-6 py-4 m-0 space-y-4">
              {/* Comment input */}
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  disabled={isAddingComment}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!newComment.trim() || isAddingComment}
                >
                  {isAddingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>

              {/* Comments list */}
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{comment.user?.full_name || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="px-6 py-4 m-0">
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No activity recorded yet.
                  </p>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 py-2 border-b border-border last:border-0"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={() => updateTaskMutation.mutate()}
            disabled={updateTaskMutation.isPending || !hasChanges}
          >
            {updateTaskMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
