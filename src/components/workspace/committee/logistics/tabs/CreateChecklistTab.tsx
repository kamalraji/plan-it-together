import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  useLogisticsChecklists, 
  useCreateChecklist, 
  useUpdateChecklist, 
  useDeleteChecklist 
} from '@/hooks/useLogisticsCommitteeData';
import { 
  ClipboardList, 
  Plus, 
  Trash2,
  Circle,
  X
} from 'lucide-react';

interface CreateChecklistTabProps {
  workspaceId: string;
}

interface ChecklistItem {
  label: string;
  checked: boolean;
}

const phaseConfig = {
  pre_event: { label: 'Pre-Event', variant: 'secondary' as const },
  during_event: { label: 'During Event', variant: 'default' as const },
  post_event: { label: 'Post-Event', variant: 'outline' as const },
};

const defaultTemplates = [
  {
    title: 'Venue Setup Checklist',
    phase: 'pre_event',
    items: [
      { label: 'Confirm venue access times', checked: false },
      { label: 'Arrange tables and chairs', checked: false },
      { label: 'Set up signage and banners', checked: false },
      { label: 'Check AV equipment', checked: false },
      { label: 'Test all microphones', checked: false },
      { label: 'Verify WiFi connectivity', checked: false },
    ],
  },
  {
    title: 'Equipment Transport Checklist',
    phase: 'pre_event',
    items: [
      { label: 'Inventory all equipment', checked: false },
      { label: 'Pack equipment securely', checked: false },
      { label: 'Load vehicles', checked: false },
      { label: 'Verify delivery address', checked: false },
      { label: 'Confirm arrival time', checked: false },
    ],
  },
  {
    title: 'Day-of Operations Checklist',
    phase: 'during_event',
    items: [
      { label: 'Arrive early for final setup', checked: false },
      { label: 'Brief volunteer team', checked: false },
      { label: 'Confirm catering delivery', checked: false },
      { label: 'Test registration systems', checked: false },
      { label: 'Emergency contacts accessible', checked: false },
    ],
  },
  {
    title: 'Teardown Checklist',
    phase: 'post_event',
    items: [
      { label: 'Remove all signage', checked: false },
      { label: 'Pack all equipment', checked: false },
      { label: 'Clean venue areas', checked: false },
      { label: 'Return rented items', checked: false },
      { label: 'Final walkthrough with venue', checked: false },
    ],
  },
];

export function CreateChecklistTab({ workspaceId }: CreateChecklistTabProps) {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [formData, setFormData] = useState({
    title: '',
    phase: 'pre_event',
    items: [{ label: '', checked: false }] as ChecklistItem[],
  });

  const { data: checklists, isLoading } = useLogisticsChecklists(workspaceId);
  const createChecklist = useCreateChecklist(workspaceId);
  const updateChecklist = useUpdateChecklist(workspaceId);
  const deleteChecklist = useDeleteChecklist(workspaceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = formData.items.filter(item => item.label.trim());
    if (!validItems.length) return;
    
    createChecklist.mutate({
      title: formData.title,
      phase: formData.phase,
      items: validItems,
    }, {
      onSuccess: () => {
        setFormData({ title: '', phase: 'pre_event', items: [{ label: '', checked: false }] });
        setView('list');
      },
    });
  };

  const handleUseTemplate = (template: typeof defaultTemplates[0]) => {
    createChecklist.mutate({
      title: template.title,
      phase: template.phase,
      items: template.items,
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { label: '', checked: false }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, label: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], label };
    setFormData({ ...formData, items: newItems });
  };

  const toggleChecklistItem = (checklistId: string, items: ChecklistItem[], itemIndex: number) => {
    const newItems = items.map((item, i) => 
      i === itemIndex ? { ...item, checked: !item.checked } : item
    );
    updateChecklist.mutate({ id: checklistId, items: newItems });
  };

  const getProgress = (items: ChecklistItem[]) => {
    if (!items?.length) return 0;
    const checked = items.filter(item => item.checked).length;
    return Math.round((checked / items.length) * 100);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading checklists...</div>;
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={view === 'list' ? 'default' : 'outline'}
          onClick={() => setView('list')}
        >
          View Checklists
        </Button>
        <Button
          variant={view === 'create' ? 'default' : 'outline'}
          onClick={() => setView('create')}
        >
          <Plus className="h-4 w-4 mr-1" />
          Create New
        </Button>
      </div>

      {view === 'create' ? (
        <div className="space-y-6">
          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {defaultTemplates.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start h-auto py-3"
                    onClick={() => handleUseTemplate(template)}
                    disabled={createChecklist.isPending}
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <p className="font-medium">{template.title}</p>
                      <p className="text-xs text-muted-foreground">{template.items.length} items</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Checklist Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create Custom Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Checklist Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Speaker Setup Checklist"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phase">Phase</Label>
                    <Select
                      value={formData.phase}
                      onValueChange={(value) => setFormData({ ...formData, phase: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pre_event">Pre-Event</SelectItem>
                        <SelectItem value="during_event">During Event</SelectItem>
                        <SelectItem value="post_event">Post-Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Checklist Items</Label>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Circle className="h-4 w-4 text-muted-foreground" />
                        <Input
                          value={item.label}
                          onChange={(e) => updateItem(index, e.target.value)}
                          placeholder="Enter item..."
                          className="flex-1"
                        />
                        {formData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createChecklist.isPending}>
                    {createChecklist.isPending ? 'Creating...' : 'Create Checklist'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setView('list')}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {!checklists?.length ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No checklists created yet</p>
                  <p className="text-sm">Create your first checklist or use a template</p>
                  <Button className="mt-4" onClick={() => setView('create')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Checklist
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checklists.map((checklist) => {
                const rawItems = checklist.items;
                const items: ChecklistItem[] = Array.isArray(rawItems) ? rawItems.map((item: unknown) => {
                  const obj = item as { label?: string; checked?: boolean };
                  return { label: obj?.label || '', checked: obj?.checked || false };
                }) : [];
                const progress = getProgress(items);
                const phase = (checklist.phase as keyof typeof phaseConfig) || 'pre_event';
                const phaseInfo = phaseConfig[phase];

                return (
                  <Card key={checklist.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{checklist.title}</CardTitle>
                          <Badge variant={phaseInfo.variant} className="mt-1">
                            {phaseInfo.label}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteChecklist.mutate(checklist.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="flex-1" />
                          <span className="text-sm text-muted-foreground">{progress}%</span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {items.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                              onClick={() => toggleChecklistItem(checklist.id, items, index)}
                            >
                              <Checkbox checked={item.checked} />
                              <span className={item.checked ? 'line-through text-muted-foreground' : ''}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
