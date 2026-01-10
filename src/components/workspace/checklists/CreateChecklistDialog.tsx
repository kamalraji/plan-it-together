import { useState } from 'react';
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Clock, CheckCircle, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMITTEE_CHECKLIST_TEMPLATES } from '@/hooks/useCommitteeDashboard';

type EventPhase = 'pre_event' | 'during_event' | 'post_event';

interface CreateChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    phase: EventPhase;
    items: { id: string; text: string; completed: boolean }[];
  }) => void;
  committeeType?: string;
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
  committeeType 
}: CreateChecklistDialogProps) {
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<EventPhase>('pre_event');
  const [items, setItems] = useState<string[]>(['']);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Get available templates for the committee type
  const templates = committeeType ? COMMITTEE_CHECKLIST_TEMPLATES[committeeType.toLowerCase()] || [] : [];

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

  const handleSubmit = () => {
    const validItems = items.filter(item => item.trim() !== '');
    if (!title.trim() || validItems.length === 0) return;

    onSubmit({
      title: title.trim(),
      phase,
      items: validItems.map((text, index) => ({
        id: `item-${Date.now()}-${index}`,
        text: text.trim(),
        completed: false,
      })),
    });

    // Reset form
    setTitle('');
    setPhase('pre_event');
    setItems(['']);
    setUseTemplate(false);
    setSelectedTemplate('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!title.trim() || items.filter(i => i.trim()).length === 0}
          >
            Create Checklist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
