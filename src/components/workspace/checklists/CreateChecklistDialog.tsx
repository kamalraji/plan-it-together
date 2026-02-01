import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  Plus, 
  X, 
  CalendarIcon,
  Send,
  Building2,
  Users 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { COMMITTEE_CHECKLIST_TEMPLATES } from '@/hooks/useCommitteeDashboard';

type EventPhase = 'pre_event' | 'during_event' | 'post_event';

interface ChildWorkspace {
  id: string;
  name: string;
  workspace_type: string;
  slug: string;
}

interface CreateChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    phase: EventPhase;
    items: { id: string; text: string; completed: boolean }[];
    delegateToWorkspaceId?: string;
    dueDate?: Date;
  }) => void;
  committeeType?: string;
  workspaceId?: string;
  canDelegate?: boolean;
}

const phaseOptions = [
  { value: 'pre_event', label: 'Pre-Event', icon: ClipboardList, color: 'text-blue-500' },
  { value: 'during_event', label: 'During Event', icon: Clock, color: 'text-amber-500' },
  { value: 'post_event', label: 'Post-Event', icon: CheckCircle, color: 'text-green-500' },
];

export function CreateChecklistDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  committeeType,
  workspaceId,
  canDelegate = false,
}: CreateChecklistDialogProps) {
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<EventPhase>('pre_event');
  const [items, setItems] = useState<string[]>(['']);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Delegation state
  const [enableDelegation, setEnableDelegation] = useState(false);
  const [delegateToWorkspaceId, setDelegateToWorkspaceId] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date | undefined>();

  // Get available templates for the committee type
  const templates = committeeType ? COMMITTEE_CHECKLIST_TEMPLATES[committeeType.toLowerCase()] || [] : [];

  // Fetch child workspaces for delegation
  const { data: childWorkspaces = [], isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ['child-workspaces-for-delegation', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, workspace_type, slug')
        .eq('parent_workspace_id', workspaceId)
        .in('workspace_type', ['DEPARTMENT', 'COMMITTEE'])
        .order('name');
      if (error) throw error;
      return data as ChildWorkspace[];
    },
    enabled: open && canDelegate && !!workspaceId,
  });

  const groupedWorkspaces = useMemo(() => {
    const departments = childWorkspaces.filter(w => w.workspace_type === 'DEPARTMENT');
    const committees = childWorkspaces.filter(w => w.workspace_type === 'COMMITTEE');
    return { departments, committees };
  }, [childWorkspaces]);

  const hasChildWorkspaces = childWorkspaces.length > 0;
  const selectedWorkspace = childWorkspaces.find(w => w.id === delegateToWorkspaceId);

  const handleAddItem = () => {
    setItems([...items, '']);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const handleTemplateSelect = (templateTitle: string) => {
    const template = templates.find(t => t.title === templateTitle);
    if (template) {
      setTitle(template.title);
      setItems(template.items);
      setSelectedTemplate(templateTitle);
    }
  };

  const resetForm = () => {
    setTitle('');
    setPhase('pre_event');
    setItems(['']);
    setUseTemplate(false);
    setSelectedTemplate('');
    setEnableDelegation(false);
    setDelegateToWorkspaceId('');
    setDueDate(undefined);
  };

  const handleSubmit = () => {
    const validItems = items.filter(item => item.trim() !== '');
    if (!title.trim() || validItems.length === 0) return;
    if (enableDelegation && !delegateToWorkspaceId) return;

    onSubmit({
      title: title.trim(),
      phase,
      items: validItems.map((text, index) => ({
        id: `item-${Date.now()}-${index}`,
        text: text.trim(),
        completed: false,
      })),
      delegateToWorkspaceId: enableDelegation ? delegateToWorkspaceId : undefined,
      dueDate: enableDelegation ? dueDate : undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const isSubmitDisabled = 
    !title.trim() || 
    items.filter(i => i.trim()).length === 0 ||
    (enableDelegation && !delegateToWorkspaceId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Checklist</DialogTitle>
          <DialogDescription>
            Add a new checklist to organize your event tasks by phase.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Selection (if available) */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Use Template</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUseTemplate(!useTemplate);
                    if (useTemplate) {
                      setTitle('');
                      setItems(['']);
                      setSelectedTemplate('');
                    }
                  }}
                >
                  {useTemplate ? 'Custom' : 'From Template'}
                </Button>
              </div>
              {useTemplate && (
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.title} value={template.title}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter checklist title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Phase Selection */}
          <div className="space-y-2">
            <Label>Event Phase</Label>
            <div className="flex gap-2">
              {phaseOptions.map(option => {
                const Icon = option.icon;
                const isSelected = phase === option.value;
                return (
                  <Badge
                    key={option.value}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      "cursor-pointer transition-all px-3 py-1.5",
                      isSelected && "ring-2 ring-primary/50"
                    )}
                    onClick={() => setPhase(option.value as EventPhase)}
                  >
                    <Icon className={cn("h-3.5 w-3.5 mr-1.5", !isSelected && option.color)} />
                    {option.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-2">
            <Label>Checklist Items</Label>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Item ${index + 1}...`}
                    value={item}
                    onChange={e => handleItemChange(index, e.target.value)}
                  />
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleAddItem}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Delegation Options */}
          {canDelegate && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="delegation-toggle" className="text-sm font-medium">
                    Delegate to another workspace
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Assign this checklist to a department or committee
                  </p>
                </div>
                <Switch
                  id="delegation-toggle"
                  checked={enableDelegation}
                  onCheckedChange={setEnableDelegation}
                  disabled={!hasChildWorkspaces}
                />
              </div>

              {!hasChildWorkspaces && !isLoadingWorkspaces && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  No child workspaces available. Create departments or committees first.
                </p>
              )}

              {enableDelegation && hasChildWorkspaces && (
                <div className="space-y-3 pl-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Target Workspace Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm">Assign to</Label>
                    <Select value={delegateToWorkspaceId} onValueChange={setDelegateToWorkspaceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select workspace..." />
                      </SelectTrigger>
                      <SelectContent>
                        {groupedWorkspaces.departments.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                              <Building2 className="h-3 w-3" />
                              Departments
                            </div>
                            {groupedWorkspaces.departments.map(ws => (
                              <SelectItem key={ws.id} value={ws.id}>
                                {ws.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {groupedWorkspaces.committees.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-1">
                              <Users className="h-3 w-3" />
                              Committees
                            </div>
                            {groupedWorkspaces.committees.map(ws => (
                              <SelectItem key={ws.id} value={ws.id}>
                                {ws.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedWorkspace && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedWorkspace.workspace_type}
                      </Badge>
                    )}
                  </div>

                  {/* Due Date Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm">Due Date (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !dueDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, 'PPP') : 'Pick a due date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {enableDelegation ? (
              <>
                <Send className="h-4 w-4 mr-2" />
                Create & Delegate
              </>
            ) : (
              'Create Checklist'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
