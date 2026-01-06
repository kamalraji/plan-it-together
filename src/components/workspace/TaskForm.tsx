import { useState } from 'react';
import { WorkspaceTask, TaskCategory, TaskPriority, TeamMember, WorkspaceRoleScope, TaskStatus } from '../../types';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
  AlertCircle
} from 'lucide-react';

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
  dueDate?: string;
  dependencies: string[];
  tags: string[];
  templateId?: string;
  roleScope?: WorkspaceRoleScope;
}

const TASK_TEMPLATES = [
  {
    id: 'event-setup',
    name: 'Event Setup',
    icon: '🎪',
    category: TaskCategory.SETUP,
    priority: TaskPriority.HIGH,
    description: 'Set up event infrastructure and basic requirements',
    tags: ['setup', 'infrastructure']
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    icon: '📢',
    category: TaskCategory.MARKETING,
    priority: TaskPriority.MEDIUM,
    description: 'Create and execute marketing campaign for the event',
    tags: ['marketing', 'promotion']
  },
  {
    id: 'venue-logistics',
    name: 'Venue Logistics',
    icon: '🏢',
    category: TaskCategory.LOGISTICS,
    priority: TaskPriority.HIGH,
    description: 'Coordinate venue arrangements and logistics',
    tags: ['venue', 'logistics']
  },
  {
    id: 'technical-setup',
    name: 'Technical Setup',
    icon: '⚙️',
    category: TaskCategory.TECHNICAL,
    priority: TaskPriority.HIGH,
    description: 'Set up technical infrastructure and equipment',
    tags: ['technical', 'equipment']
  },
  {
    id: 'registration-management',
    name: 'Registration',
    icon: '📋',
    category: TaskCategory.REGISTRATION,
    priority: TaskPriority.MEDIUM,
    description: 'Manage participant registration and communication',
    tags: ['registration', 'participants']
  }
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
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    category: task?.category || TaskCategory.SETUP,
    priority: task?.priority || TaskPriority.MEDIUM,
    assigneeId: task?.assignee?.userId || '',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    dependencies: task?.dependencies || [],
    tags: task?.tags || [],
    templateId: '',
    roleScope: task?.roleScope || (task?.metadata?.roleScope as WorkspaceRoleScope | undefined),
  });

  const [newTag, setNewTag] = useState('');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(task?.dependencies || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        templateId,
        title: template.name,
        description: template.description,
        category: template.category,
        priority: template.priority,
        tags: template.tags
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
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

      return currentTask.dependencies.some(depId =>
        checkCircular(depId, targetTaskId, new Set(visited))
      );
    };

    return checkCircular(taskId, task.id, new Set());
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

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

      const { error } = await supabase.from('workspace_tasks').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.error('Failed to upsert workspace task', error);
      }
    }

    onSubmit?.(formData);
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {task ? 'Edit Task' : 'Create New Task'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {task ? 'Update task details and configuration' : 'Define a new task for your workspace'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Quick Templates */}
        {!task && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium text-foreground">Quick Start Templates</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {TASK_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
                    formData.templateId === template.id
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/50"
                  )}
                >
                  <span>{template.icon}</span>
                  <span>{template.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Task Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter a clear, actionable title"
            className={cn(
              "h-11",
              errors.title && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.title && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe what needs to be done, expected outcomes, and any important details..."
            className={cn(
              "resize-none",
              errors.description && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.description && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.description}
            </p>
          )}
        </div>

        {/* Category and Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Category
            </Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value as TaskCategory)}
              className="w-full h-11 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              {Object.values(TaskCategory).map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Flag className="h-4 w-4 text-muted-foreground" />
              Priority
            </Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleInputChange('priority', key as TaskPriority)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200",
                    formData.priority === key
                      ? config.color + " ring-2 ring-offset-2 ring-offset-background ring-primary/30"
                      : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Assignee, Due Date, Role Scope */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="assignee" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Assignee
            </Label>
            <select
              id="assignee"
              value={formData.assigneeId}
              onChange={(e) => handleInputChange('assigneeId', e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.userId}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Due Date
            </Label>
            <Input
              type="date"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className={cn(
                "h-11",
                errors.dueDate && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {errors.dueDate && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.dueDate}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleScope" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Team Scope
            </Label>
            <select
              id="roleScope"
              value={formData.roleScope || ''}
              onChange={(e) =>
                handleInputChange('roleScope', (e.target.value || undefined) as WorkspaceRoleScope | undefined)
              }
              className="w-full h-11 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">All teams</option>
              {Array.from(new Set(teamMembers.map((m) => m.role))).map((role) => (
                <option key={role} value={role}>
                  {role.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dependencies */}
        {availableDependencies.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              Dependencies
            </Label>
            <div className="bg-muted/30 rounded-lg border border-border p-3 max-h-36 overflow-y-auto space-y-1">
              {availableDependencies.map(availableTask => {
                const wouldCreateCircular = wouldCreateCircularDependency(availableTask.id);
                const isSelected = selectedDependencies.includes(availableTask.id);
                return (
                  <label
                    key={availableTask.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer",
                      wouldCreateCircular 
                        ? "opacity-50 cursor-not-allowed" 
                        : isSelected 
                          ? "bg-primary/10" 
                          : "hover:bg-muted"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => !wouldCreateCircular && handleDependencyToggle(availableTask.id)}
                      disabled={wouldCreateCircular}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground flex-1">
                      {availableTask.title}
                    </span>
                    {wouldCreateCircular && (
                      <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                        Circular
                      </span>
                    )}
                    {isSelected && !wouldCreateCircular && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Tags
          </Label>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="pl-2.5 pr-1.5 py-1 gap-1.5 text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="p-0.5 rounded-full hover:bg-foreground/10 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Type a tag and press Enter"
              className="h-10 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTag}
              className="h-10 px-3"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {task ? 'Update Task' : 'Create Task'}
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}