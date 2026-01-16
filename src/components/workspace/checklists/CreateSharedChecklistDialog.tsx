import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ClipboardList, 
  Clock, 
  CheckCircle2,
  CalendarIcon,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTemplatesForCategory, getDefaultTemplates } from '@/lib/sharedChecklistTemplates';
import type { Database } from '@/integrations/supabase/types';

type EventCategory = Database['public']['Enums']['event_category'];
type Phase = 'pre_event' | 'during_event' | 'post_event';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface ChecklistItemInput {
  id: string;
  title: string;
  description: string;
  showDescription: boolean;
}

interface CreateSharedChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    phase: Phase;
    priority?: Priority;
    items: { title: string; description?: string }[];
    dueDate?: string;
  }) => void;
  isSubmitting: boolean;
  eventCategory?: EventCategory | null;
}

const PHASE_CONFIG = {
  pre_event: {
    label: 'Pre-Event',
    icon: ClipboardList,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20',
    activeColor: 'bg-blue-500 text-white border-blue-600',
  },
  during_event: {
    label: 'During Event',
    icon: Clock,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20',
    activeColor: 'bg-amber-500 text-white border-amber-600',
  },
  post_event: {
    label: 'Post-Event',
    icon: CheckCircle2,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20',
    activeColor: 'bg-emerald-500 text-white border-emerald-600',
  },
};

const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    color: 'bg-slate-500/10 text-slate-600 border-slate-500/30 hover:bg-slate-500/20',
    activeColor: 'bg-slate-500 text-white border-slate-600',
  },
  medium: {
    label: 'Medium',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20',
    activeColor: 'bg-blue-500 text-white border-blue-600',
  },
  high: {
    label: 'High',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20',
    activeColor: 'bg-amber-500 text-white border-amber-600',
  },
  urgent: {
    label: 'Urgent',
    color: 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20',
    activeColor: 'bg-red-500 text-white border-red-600',
  },
};

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_ITEM_TITLE_LENGTH = 200;

export function CreateSharedChecklistDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  eventCategory,
}: CreateSharedChecklistDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phase, setPhase] = useState<Phase>('pre_event');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [items, setItems] = useState<ChecklistItemInput[]>([
    { id: crypto.randomUUID(), title: '', description: '', showDescription: false },
  ]);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [touched, setTouched] = useState({ title: false, items: false });
  
  const lastItemRef = useRef<HTMLInputElement>(null);

  // Get templates based on event category
  const templates = eventCategory 
    ? getTemplatesForCategory(eventCategory) 
    : getDefaultTemplates();

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplate && useTemplate) {
      const template = templates.find(t => t.title === selectedTemplate);
      if (template) {
        setTitle(template.title);
        setDescription(template.description || '');
        setPhase(template.phase);
        setItems(template.items.map(item => ({
          id: crypto.randomUUID(),
          title: item.title,
          description: item.description || '',
          showDescription: !!item.description,
        })));
      }
    }
  }, [selectedTemplate, useTemplate, templates]);

  const handleAddItem = () => {
    const newItem = { id: crypto.randomUUID(), title: '', description: '', showDescription: false };
    setItems([...items, newItem]);
    // Focus new item after render
    setTimeout(() => lastItemRef.current?.focus(), 50);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof ChecklistItemInput, value: string | boolean) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const toggleItemDescription = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, showDescription: !item.showDescription } : item
    ));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (index === items.length - 1) {
        handleAddItem();
      }
    }
  };

  const handleSubmit = () => {
    setTouched({ title: true, items: true });
    
    if (!title.trim()) return;
    const validItems = items.filter(item => item.title.trim());
    if (validItems.length === 0) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      phase,
      priority,
      items: validItems.map(item => ({
        title: item.title.trim(),
        description: item.description.trim() || undefined,
      })),
      dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
    });

    handleReset();
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setPhase('pre_event');
    setPriority('medium');
    setDueDate(undefined);
    setItems([{ id: crypto.randomUUID(), title: '', description: '', showDescription: false }]);
    setUseTemplate(false);
    setSelectedTemplate('');
    setTouched({ title: false, items: false });
  };

  const handleClose = () => {
    onOpenChange(false);
    handleReset();
  };

  const validItemCount = items.filter(item => item.title.trim()).length;
  const isValid = title.trim() && validItemCount > 0;

  const getValidationMessage = () => {
    if (!title.trim() && touched.title) return 'Title is required';
    if (validItemCount === 0 && touched.items) return 'At least one item is required';
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Create Shared Checklist
          </DialogTitle>
          <DialogDescription>
            Create a checklist visible to all workspaces in this event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Template Toggle */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={useTemplate ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setUseTemplate(!useTemplate);
                    if (useTemplate) {
                      setSelectedTemplate('');
                      handleReset();
                    }
                  }}
                  className="gap-1.5"
                >
                  <FileText className="h-4 w-4" />
                  From Template
                </Button>
                {useTemplate && (
                  <span className="text-xs text-muted-foreground">
                    Select a template to pre-fill the form
                  </span>
                )}
              </div>
              
              {useTemplate && (
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template, index) => (
                      <SelectItem key={`${template.title}-${index}`} value={template.title}>
                        <div className="flex items-center gap-2">
                          <span>{template.title}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {template.items.length} items
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Title *</Label>
              <span className={cn(
                "text-xs",
                title.length > MAX_TITLE_LENGTH * 0.9 
                  ? "text-destructive" 
                  : "text-muted-foreground"
              )}>
                {title.length}/{MAX_TITLE_LENGTH}
              </span>
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
              onBlur={() => setTouched(t => ({ ...t, title: true }))}
              placeholder="e.g., Pre-Event Setup Tasks"
              className={cn(
                !title.trim() && touched.title && "border-destructive focus-visible:ring-destructive"
              )}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <span className={cn(
                "text-xs",
                description.length > MAX_DESCRIPTION_LENGTH * 0.9 
                  ? "text-destructive" 
                  : "text-muted-foreground"
              )}>
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
              placeholder="Brief description of this checklist..."
              rows={2}
            />
          </div>

          {/* Phase Selection */}
          <div className="space-y-2">
            <Label>Phase *</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PHASE_CONFIG) as Phase[]).map((p) => {
                const config = PHASE_CONFIG[p];
                const Icon = config.icon;
                const isActive = phase === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPhase(p)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all",
                      isActive ? config.activeColor : config.color
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => {
                const config = PRIORITY_CONFIG[p];
                const isActive = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-sm font-medium transition-all",
                      isActive ? config.activeColor : config.color
                    )}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Select a due date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Checklist Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Checklist Items *</Label>
                <Badge variant="secondary" className="text-xs">
                  {validItemCount} item{validItemCount !== 1 ? 's' : ''}
                </Badge>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "rounded-lg border bg-muted/30 p-2 space-y-2",
                    !item.title.trim() && touched.items && index === 0 && "border-destructive"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground cursor-grab">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium w-5">
                      {index + 1}.
                    </span>
                    <Input
                      ref={index === items.length - 1 ? lastItemRef : undefined}
                      value={item.title}
                      onChange={(e) => handleItemChange(item.id, 'title', e.target.value.slice(0, MAX_ITEM_TITLE_LENGTH))}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onBlur={() => setTouched(t => ({ ...t, items: true }))}
                      placeholder={`Item ${index + 1}`}
                      className="flex-1 h-8 text-sm"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => toggleItemDescription(item.id)}
                          >
                            {item.showDescription ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {item.showDescription ? 'Hide description' : 'Add description'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {item.showDescription && (
                    <div className="pl-11">
                      <Textarea
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="Optional description for this item..."
                        rows={2}
                        className="text-sm resize-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground">
              Press Enter to add a new item
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {getValidationMessage() && (
            <div className="flex-1 flex items-center gap-1.5 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {getValidationMessage()}
            </div>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!isValid || isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Checklist'}
                  </Button>
                </span>
              </TooltipTrigger>
              {!isValid && (
                <TooltipContent>
                  {!title.trim() ? 'Enter a title' : 'Add at least one item'}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
