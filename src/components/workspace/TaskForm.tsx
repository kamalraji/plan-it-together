import { useState, useRef } from 'react';
import { WorkspaceTask, TaskCategory, TaskPriority, TeamMember, WorkspaceRoleScope, TaskStatus } from '../../types';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/action-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  X, 
  Plus, 
  Sparkles, 
  FileText, 
  Tag, 
  Calendar,
  Users,
  Flag,
  Layers,
  Link2,
  CheckCircle2,
  ListTodo
} from 'lucide-react';
import { SubtaskSection, type Subtask, MultiAssigneeSelector, useTaskFormKeyboard, CustomTemplateManager } from './task-form';
import { useTaskDraft } from '@/hooks/useTaskDraft';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';

interface TaskFormProps {
  task?: WorkspaceTask;
  teamMembers: TeamMember[];
  availableTasks: WorkspaceTask[];
  workspaceId?: string;
  onSubmit?: (taskData: TaskFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface TaskFormData {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeIds?: string[];
  dueDate?: string;
  dependencies: string[];
  tags: string[];
  templateId?: string;
  roleScope?: WorkspaceRoleScope;
  subtasks?: Subtask[];
  estimatedHours?: number;
}

const TASK_TEMPLATES = [
  { id: 'event-setup', name: 'Setup', icon: '🎪', category: TaskCategory.SETUP, priority: TaskPriority.HIGH, description: 'Set up event infrastructure', tags: ['setup'] },
  { id: 'marketing-campaign', name: 'Marketing', icon: '📢', category: TaskCategory.MARKETING, priority: TaskPriority.MEDIUM, description: 'Execute marketing campaign', tags: ['marketing'] },
  { id: 'venue-logistics', name: 'Logistics', icon: '🏢', category: TaskCategory.LOGISTICS, priority: TaskPriority.HIGH, description: 'Coordinate venue logistics', tags: ['logistics'] },
  { id: 'technical-setup', name: 'Technical', icon: '⚙️', category: TaskCategory.TECHNICAL, priority: TaskPriority.HIGH, description: 'Set up technical infrastructure', tags: ['technical'] },
  { id: 'registration-management', name: 'Registration', icon: '📋', category: TaskCategory.REGISTRATION, priority: TaskPriority.MEDIUM, description: 'Manage registration', tags: ['registration'] }
];

const PRIORITY_CONFIG = {
  [TaskPriority.LOW]: { label: 'Low', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  [TaskPriority.MEDIUM]: { label: 'Medium', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  [TaskPriority.HIGH]: { label: 'High', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
};

export function TaskForm({
  task,
  teamMembers,
  availableTasks,
  workspaceId,
  onSubmit,
  onCancel,
  isLoading = false
}: TaskFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    category: task?.category || TaskCategory.GENERAL,
    priority: task?.priority || TaskPriority.MEDIUM,
    assigneeId: task?.assignee?.userId || '',
    assigneeIds: task?.assignees?.map(a => a.userId) || [],
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    dependencies: task?.dependencies || [],
    tags: task?.tags || [],
    templateId: '',
    roleScope: task?.roleScope || (task?.metadata?.roleScope as WorkspaceRoleScope | undefined),
    subtasks: (task?.subtasks || []).map(s => ({ id: s.id, title: s.title, status: s.status, assignedTo: s.assignedTo })),
  });

  const [newTag, setNewTag] = useState('');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(task?.dependencies || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDependencies, setShowDependencies] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState((task?.subtasks?.length || 0) > 0);

  // Autosave drafts (only for new tasks)
  const { saveDraft } = useTaskDraft({
    workspaceId: workspaceId || '',
    onDraftRestored: (draft) => {
      if (!task) {
        setFormData(prev => ({ ...prev, ...draft }));
      }
    },
  });

  // Task notifications
  const { notifyTaskAssigned, notifyTaskCreated } = useTaskNotifications();

  // Keyboard shortcuts
  useTaskFormKeyboard({
    formRef,
    onSubmit: () => formRef.current?.requestSubmit(),
    onCancel,
    onSaveDraft: () => saveDraft(formData),
    onPriorityChange: (priority) => handleInputChange('priority', priority),
    onToggleDependencies: () => setShowDependencies(prev => !prev),
    onToggleSubtasks: () => setShowSubtasks(prev => !prev),
    disabled: isLoading,
  });

  const availableDependencies = availableTasks.filter(t => t.id !== task?.id);

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = TASK_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId: prev.templateId === templateId ? '' : templateId,
        title: prev.templateId === templateId ? '' : template.name,
        description: prev.templateId === templateId ? '' : template.description,
        category: prev.templateId === templateId ? TaskCategory.SETUP : template.category,
        priority: prev.templateId === templateId ? TaskPriority.MEDIUM : template.priority,
        tags: prev.templateId === templateId ? [] : template.tags
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleDependencyToggle = (taskId: string) => {
    const newDependencies = selectedDependencies.includes(taskId)
      ? selectedDependencies.filter(id => id !== taskId)
      : [...selectedDependencies, taskId];
    setSelectedDependencies(newDependencies);
    setFormData(prev => ({ ...prev, dependencies: newDependencies }));
  };

  const wouldCreateCircularDependency = (taskId: string): boolean => {
    if (!task?.id) return false;
    const checkCircular = (currentTaskId: string, targetTaskId: string, visited: Set<string>): boolean => {
      if (visited.has(currentTaskId)) return true;
      if (currentTaskId === targetTaskId) return true;
      visited.add(currentTaskId);
      const currentTask = availableTasks.find(t => t.id === currentTaskId);
      if (!currentTask) return false;
      return currentTask.dependencies.some(depId => checkCircular(depId, targetTaskId, new Set(visited)));
    };
    return checkCircular(taskId, task.id, new Set());
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Required';
    if (!formData.description.trim()) newErrors.description = 'Required';
    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) newErrors.dueDate = 'Cannot be past';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    let createdTaskId: string | undefined;

    if (workspaceId) {
      const payload: any = {
        id: task?.id,
        workspace_id: workspaceId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: task?.status || TaskStatus.NOT_STARTED,
        due_date: formData.dueDate || null,
        role_scope: formData.roleScope ?? null,
      };
      const { data, error } = await supabase.from('workspace_tasks').upsert(payload, { onConflict: 'id' }).select('id').single();
      if (error) {
        console.error('Failed to upsert workspace task', error);
      } else {
        createdTaskId = data?.id;

        // Send notifications for new tasks
        if (!task && createdTaskId) {
          await notifyTaskCreated({
            taskId: createdTaskId,
            taskTitle: formData.title,
            workspaceId,
          });

          // Notify assignees if any
          if (formData.assigneeIds?.length) {
            await notifyTaskAssigned({
              taskId: createdTaskId,
              taskTitle: formData.title,
              workspaceId,
              assigneeIds: formData.assigneeIds,
            });
          }
        }
      }
    }
    onSubmit?.(formData);
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden max-w-2xl mx-auto">
      {/* Compact Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-primary/5 to-transparent border-b border-border flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          {task ? 'Edit Task' : 'New Task'}
        </h3>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Quick Templates - Compact */}
        {!task && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Templates</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TASK_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-all",
                    formData.templateId === template.id
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>{template.icon}</span>
                  <span>{template.name}</span>
                </button>
              ))}
            </div>
            {/* Custom Templates */}
            {workspaceId && (
              <CustomTemplateManager
                workspaceId={workspaceId}
                currentFormData={formData}
                onTemplateSelect={(template) => {
                  setFormData(prev => ({
                    ...prev,
                    title: template.name,
                    description: template.description,
                    category: template.category,
                    priority: template.priority,
                    tags: template.tags,
                  }));
                }}
                disabled={isLoading}
              />
            )}
          </div>
        )}

        {/* Title & Description - Compact Grid */}
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs font-medium text-muted-foreground">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Task title"
              className={cn("h-9 text-sm", errors.title && "border-destructive")}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs font-medium text-muted-foreground">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              rows={2}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="What needs to be done?"
              className={cn("text-sm resize-none", errors.description && "border-destructive")}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>
        </div>

        {/* Priority - Inline */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Flag className="h-3 w-3" /> Priority
          </Label>
          <div className="flex gap-1.5">
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleInputChange('priority', key as TaskPriority)}
                className={cn(
                  "px-2.5 py-1 rounded-md border text-xs font-medium transition-all",
                  formData.priority === key
                    ? config.color + " ring-1 ring-offset-1 ring-offset-background ring-primary/20"
                    : "bg-muted/40 border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category, Assignee, Due Date - Compact 3-col */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Layers className="h-3 w-3" /> Category
            </Label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value as TaskCategory)}
              className="w-full h-9 px-2 rounded-md border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {Object.values(TaskCategory).map(category => (
                <option key={category} value={category}>{category.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Assignees
            </Label>
            <MultiAssigneeSelector
              teamMembers={teamMembers}
              selectedIds={formData.assigneeIds || []}
              onChange={(ids) => handleInputChange('assigneeIds', ids)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Due Date
            </Label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className={cn("h-9 text-xs", errors.dueDate && "border-destructive")}
            />
          </div>
        </div>

        {/* Team Scope */}
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">Team Scope</Label>
          <select
            value={formData.roleScope || ''}
            onChange={(e) => handleInputChange('roleScope', (e.target.value || undefined) as WorkspaceRoleScope | undefined)}
            className="w-full h-9 px-2 rounded-md border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All teams</option>
            {Array.from(new Set(teamMembers.map((m) => m.role))).map((role) => (
              <option key={role} value={role}>{role.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Dependencies - Collapsible */}
        {availableDependencies.length > 0 && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setShowDependencies(!showDependencies)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Link2 className="h-3 w-3" />
              Dependencies {selectedDependencies.length > 0 && `(${selectedDependencies.length})`}
              <span className={cn("transition-transform", showDependencies && "rotate-180")}>▼</span>
            </button>
            {showDependencies && (
              <div className="bg-muted/30 rounded-lg border border-border p-2 max-h-28 overflow-y-auto space-y-0.5">
                {availableDependencies.map(availableTask => {
                  const wouldCreateCircular = wouldCreateCircularDependency(availableTask.id);
                  const isSelected = selectedDependencies.includes(availableTask.id);
                  return (
                    <label
                      key={availableTask.id}
                      className={cn(
                        "flex items-center gap-2 p-1.5 rounded-md text-xs transition-colors cursor-pointer",
                        wouldCreateCircular ? "opacity-40 cursor-not-allowed" : isSelected ? "bg-primary/10" : "hover:bg-muted"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => !wouldCreateCircular && handleDependencyToggle(availableTask.id)}
                        disabled={wouldCreateCircular}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      <span className="text-foreground truncate flex-1">{availableTask.title}</span>
                      {isSelected && <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Subtasks Section */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ListTodo className="h-3 w-3" />
            Subtasks {(formData.subtasks?.length || 0) > 0 && `(${formData.subtasks?.length})`}
            <span className={cn("transition-transform", showSubtasks && "rotate-180")}>▼</span>
          </button>
          {showSubtasks && (
            <SubtaskSection
              subtasks={formData.subtasks || []}
              onChange={(subtasks) => handleInputChange('subtasks', subtasks)}
              teamMembers={teamMembers}
              disabled={isLoading}
            />
          )}
        </div>

        {/* Tags - Compact Inline */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Tag className="h-3 w-3" /> Tags
          </Label>
          <div className="flex flex-wrap items-center gap-1.5">
            {formData.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-0.5 gap-1 text-xs h-6">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:bg-foreground/10 rounded-full p-0.5">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
            <div className="flex gap-1">
              <Input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag..."
                className="h-7 w-24 text-xs px-2"
              />
              <Button type="button" variant="ghost" size="sm" onClick={handleAddTag} className="h-7 w-7 p-0">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <ActionButton 
            type="submit" 
            size="sm" 
            isLoading={isLoading}
            loadingText={task ? 'Updating...' : 'Creating...'}
            className="min-w-[90px]"
          >
            {task ? 'Update' : 'Create'}
          </ActionButton>
        </div>
      </form>
    </div>
  );
}