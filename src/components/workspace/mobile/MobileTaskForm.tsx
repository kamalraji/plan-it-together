import { useState } from 'react';
import { WorkspaceTask, TaskCategory, TaskPriority, TeamMember, WorkspaceRoleScope } from '@/types';
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
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  Layers,
  ListTodo,
  Tag
} from 'lucide-react';
import { SubtaskSection, type Subtask } from '../task-form/SubtaskSection';
import { CalendarSync } from '../task-form/CalendarSync';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface MobileTaskFormProps {
  isOpen: boolean;
  task?: WorkspaceTask;
  teamMembers: TeamMember[];
  workspaceId: string;
  onSubmit: (taskData: MobileTaskFormData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export interface MobileTaskFormData {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  assigneeIds: string[];
  dueDate?: string;
  tags: string[];
  roleScope?: WorkspaceRoleScope;
  subtasks: Subtask[];
}

const PRIORITY_OPTIONS = [
  { value: TaskPriority.LOW, label: 'Low', color: 'bg-emerald-500' },
  { value: TaskPriority.MEDIUM, label: 'Medium', color: 'bg-warning' },
  { value: TaskPriority.HIGH, label: 'High', color: 'bg-rose-500' },
  { value: TaskPriority.URGENT, label: 'Urgent', color: 'bg-primary' },
];

const CATEGORY_ICONS: Record<string, string> = {
  GENERAL: '📋',
  SETUP: '🎪',
  MARKETING: '📢',
  LOGISTICS: '🏢',
  TECHNICAL: '⚙️',
  REGISTRATION: '📝',
  COMMUNICATION: '💬',
  FINANCE: '💰',
  CONTENT: '✍️',
  DESIGN: '🎨',
  CATERING: '🍽️',
  SAFETY: '🛡️',
};

export function MobileTaskForm({
  isOpen,
  task,
  teamMembers,
  onSubmit,
  onClose,
  isLoading = false,
}: Omit<MobileTaskFormProps, 'workspaceId'> & { workspaceId?: string }) {
  const [formData, setFormData] = useState<MobileTaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    category: task?.category || TaskCategory.GENERAL,
    priority: task?.priority || TaskPriority.MEDIUM,
    assigneeIds: task?.assignees?.map(a => a.userId) || [],
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    tags: task?.tags || [],
    roleScope: task?.roleScope,
    subtasks: (task?.subtasks || []).map(s => ({ 
      id: s.id, 
      title: s.title, 
      status: s.status, 
      assignedTo: s.assignedTo 
    })),
  });

  const [newTag, setNewTag] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleInputChange = <K extends keyof MobileTaskFormData>(field: K, value: MobileTaskFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleInputChange('tags', formData.tags.filter(t => t !== tag));
  };

  const toggleAssignee = (userId: string) => {
    const newIds = formData.assigneeIds.includes(userId)
      ? formData.assigneeIds.filter(id => id !== userId)
      : [...formData.assigneeIds, userId];
    handleInputChange('assigneeIds', newIds);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSubmit(formData);
  };

  const SectionHeader = ({ title, section, icon }: { title: string; section: string; icon: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-3 text-sm font-medium text-foreground"
    >
      <div className="flex items-center gap-2">
        {icon}
        {title}
      </div>
      {expandedSections.has(section) ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base">
                {task ? 'Edit Task' : 'New Task'}
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {/* Title - Always visible */}
            <div className="space-y-2 pb-4 border-b border-border">
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Task title"
                className={cn(
                  "text-lg font-medium h-12 border-0 border-b rounded-none px-0 focus-visible:ring-0",
                  errors.title && "border-destructive"
                )}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            {/* Priority - Quick select */}
            <div className="py-4 border-b border-border">
              <Label className="text-xs text-muted-foreground mb-2 block">Priority</Label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('priority', option.value)}
                    className={cn(
                      "flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all",
                      formData.priority === option.value
                        ? `${option.color} text-primary-foreground`
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Section */}
            <div className="border-b border-border">
              <SectionHeader title="Description" section="description" icon={<ListTodo className="h-4 w-4" />} />
              {expandedSections.has('description') && (
                <div className="pb-4">
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="What needs to be done?"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              )}
            </div>

            {/* Category & Due Date */}
            <div className="border-b border-border">
              <SectionHeader title="Details" section="details" icon={<Layers className="h-4 w-4" />} />
              {expandedSections.has('details') && (
                <div className="pb-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value as TaskCategory)}
                      className="w-full h-11 px-3 rounded-lg border border-border bg-background text-foreground text-sm"
                    >
                      {Object.values(TaskCategory).map(cat => (
                        <option key={cat} value={cat}>
                          {CATEGORY_ICONS[cat] || '📋'} {cat.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Due Date
                    </Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange('dueDate', e.target.value)}
                      className="h-11"
                    />
                    {formData.dueDate && (
                      <CalendarSync
                        title={formData.title}
                        description={formData.description}
                        dueDate={formData.dueDate}
                        disabled={isLoading}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Assignees */}
            <div className="border-b border-border">
              <SectionHeader 
                title={`Assignees${formData.assigneeIds.length > 0 ? ` (${formData.assigneeIds.length})` : ''}`} 
                section="assignees" 
                icon={<Users className="h-4 w-4" />} 
              />
              {expandedSections.has('assignees') && (
                <div className="pb-4 space-y-2">
                  {teamMembers.map(member => {
                    const isSelected = formData.assigneeIds.includes(member.userId);
                    return (
                      <button
                        key={member.userId}
                        type="button"
                        onClick={() => toggleAssignee(member.userId)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                          isSelected ? "bg-primary/10 border border-primary/30" : "bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                        )}>
                          {isSelected && <span className="text-xs">✓</span>}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{member.user.name}</p>
                          <p className="text-xs text-muted-foreground">{member.role.replace(/_/g, ' ')}</p>
                        </div>
                      </button>
                    );
                  })}
                  {teamMembers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No team members available
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div className="border-b border-border">
              <SectionHeader 
                title={`Subtasks${formData.subtasks.length > 0 ? ` (${formData.subtasks.length})` : ''}`} 
                section="subtasks" 
                icon={<ListTodo className="h-4 w-4" />} 
              />
              {expandedSections.has('subtasks') && (
                <div className="pb-4">
                  <SubtaskSection
                    subtasks={formData.subtasks}
                    onChange={(subtasks) => handleInputChange('subtasks', subtasks)}
                    teamMembers={teamMembers}
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="border-b border-border">
              <SectionHeader 
                title={`Tags${formData.tags.length > 0 ? ` (${formData.tags.length})` : ''}`} 
                section="tags" 
                icon={<Tag className="h-4 w-4" />} 
              />
              {expandedSections.has('tags') && (
                <div className="pb-4 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="Add tag..."
                      className="h-10 flex-1"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={handleAddTag} className="h-10 w-10">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed footer */}
          <div className="border-t border-border p-4 bg-background">
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isLoading}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <ActionButton 
                onClick={handleSubmit}
                isLoading={isLoading}
                loadingText={task ? 'Updating...' : 'Creating...'}
                className="flex-1 h-12"
              >
                {task ? 'Update Task' : 'Create Task'}
              </ActionButton>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
