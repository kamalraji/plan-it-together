import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  useRunOfShowChecklists,
  useCreateRunOfShowChecklist,
  useUpdateRunOfShowChecklist,
  useDeleteRunOfShowChecklist,
  RunOfShowChecklist,
  RunOfShowChecklistInsert,
} from '@/hooks/useEventCommitteeData';

interface RunOfShowTabProps {
  workspaceId: string;
}

const PHASES = [
  { value: 'pre-event', label: 'Pre-Event', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'day-of', label: 'Day Of', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  { value: 'during', label: 'During Event', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  { value: 'post-event', label: 'Post-Event', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
];

// Use same item type as hook
interface ChecklistItemLocal {
  id: string;
  text: string;
  completed: boolean;
  critical?: boolean;
}

export const RunOfShowTab: React.FC<RunOfShowTabProps> = ({ workspaceId }) => {
  const { data: checklists = [], isLoading } = useRunOfShowChecklists(workspaceId);
  const createMutation = useCreateRunOfShowChecklist();
  const updateMutation = useUpdateRunOfShowChecklist();
  const deleteMutation = useDeleteRunOfShowChecklist();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<RunOfShowChecklist | null>(null);
  const [activePhase, setActivePhase] = useState('pre-event');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<{
    title: string;
    phase: string;
    items: ChecklistItemLocal[];
  }>({
    title: '',
    phase: 'pre-event',
    items: [{ id: crypto.randomUUID(), text: '', completed: false, critical: false }],
  });

  const handleOpenDialog = (checklist?: RunOfShowChecklist) => {
    if (checklist) {
      setEditingChecklist(checklist);
      setFormData({
        title: checklist.title,
        phase: checklist.phase,
        items: checklist.items?.length > 0 
          ? checklist.items.map(i => ({ id: i.id, text: i.text, completed: i.completed, critical: i.critical }))
          : [{ id: crypto.randomUUID(), text: '', completed: false, critical: false }],
      });
    } else {
      setEditingChecklist(null);
      setFormData({
        title: '',
        phase: activePhase,
        items: [{ id: crypto.randomUUID(), text: '', completed: false, critical: false }],
      });
    }
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { id: crypto.randomUUID(), text: '', completed: false, critical: false }],
    });
  };

  const handleRemoveItem = (id: string) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter(item => item.id !== id),
      });
    }
  };

  const handleItemChange = (id: string, field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      items: formData.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const validItems = formData.items.filter(item => item.text.trim());

    const payload: RunOfShowChecklistInsert = {
      workspace_id: workspaceId,
      title: formData.title,
      phase: formData.phase,
      items: validItems,
      due_date: null,
    };

    if (editingChecklist) {
      await updateMutation.mutateAsync({ id: editingChecklist.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this checklist section?')) {
      await deleteMutation.mutateAsync({ id, workspaceId });
    }
  };

  const handleToggleItem = async (checklist: RunOfShowChecklist, itemId: string) => {
    const updatedItems = checklist.items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await updateMutation.mutateAsync({ id: checklist.id, items: updatedItems });
  };

  // Phase config helper (available for future use)
  // const getPhaseConfig = (phase: string) => PHASES.find(p => p.value === phase) || PHASES[0];

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const getCompletionStats = (items: Array<{ completed: boolean }>) => {
    const total = items.length;
    const completed = items.filter(i => i.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  // Filter checklists by phase
  const filteredChecklists = checklists.filter(c => c.phase === activePhase);

  // Stats
  const allItems = checklists.flatMap(c => c.items || []);
  const totalItems = allItems.length;
  const completedItems = allItems.filter(i => i.completed).length;
  const overallPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const criticalItems = allItems.filter(i => i.critical && !i.completed).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Run of Show</h2>
          <p className="text-muted-foreground">Phase-based checklists for event execution</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingChecklist ? 'Edit Section' : 'Add Checklist Section'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Section Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Venue Setup"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phase">Phase</Label>
                <Select value={formData.phase} onValueChange={(v) => setFormData({ ...formData, phase: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHASES.map(phase => (
                      <SelectItem key={phase.value} value={phase.value}>{phase.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Checklist Items</Label>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Input
                        value={item.text}
                        onChange={(e) => handleItemChange(item.id, 'text', e.target.value)}
                        placeholder={`Item ${index + 1}`}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-1">
                        <Checkbox
                          id={`critical-${item.id}`}
                          checked={item.critical}
                          onCheckedChange={(checked) => handleItemChange(item.id, 'critical', checked as boolean)}
                        />
                        <Label htmlFor={`critical-${item.id}`} className="text-xs text-muted-foreground cursor-pointer">
                          Critical
                        </Label>
                      </div>
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingChecklist ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedItems}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalItems}</p>
                <p className="text-sm text-muted-foreground">Critical Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-lg font-bold">{overallPercentage}%</p>
              </div>
              <Progress value={overallPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase Tabs */}
      <Tabs value={activePhase} onValueChange={setActivePhase}>
        <TabsList className="grid w-full grid-cols-4">
          {PHASES.map(phase => {
            const phaseChecklists = checklists.filter(c => c.phase === phase.value);
            const phaseItems = phaseChecklists.flatMap(c => c.items || []);
            const phaseCompleted = phaseItems.filter(i => i.completed).length;
            return (
              <TabsTrigger key={phase.value} value={phase.value} className="relative">
                {phase.label}
                {phaseItems.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {phaseCompleted}/{phaseItems.length}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {PHASES.map(phase => (
          <TabsContent key={phase.value} value={phase.value} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className={phase.color} variant="secondary">
                    {phase.label}
                  </Badge>
                  Checklists
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredChecklists.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No checklists for this phase</p>
                    <p className="text-sm">Add a checklist section to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredChecklists.map((checklist) => {
                      const stats = getCompletionStats(checklist.items || []);
                      const isExpanded = expandedSections.has(checklist.id);

                      return (
                        <Collapsible
                          key={checklist.id}
                          open={isExpanded}
                          onOpenChange={() => toggleSection(checklist.id)}
                        >
                          <div className="border rounded-lg">
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                                <div className="flex items-center gap-3">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <div>
                                    <h4 className="font-medium">{checklist.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {stats.completed}/{stats.total} completed
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <div className="w-24">
                                    <Progress value={stats.percentage} className="h-2" />
                                  </div>
                                  <span className="text-sm font-medium">{stats.percentage}%</span>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDialog(checklist);
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(checklist.id);
                                      }}
                                      disabled={deleteMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="border-t px-4 py-3 space-y-2">
                                {(checklist.items || []).map((item) => (
                                  <div
                                    key={item.id}
                                    className={`flex items-center gap-3 p-2 rounded-md hover:bg-accent/30 transition-colors ${
                                      item.completed ? 'opacity-60' : ''
                                    }`}
                                  >
                                    <Checkbox
                                      checked={item.completed}
                                      onCheckedChange={() => handleToggleItem(checklist, item.id)}
                                    />
                                    <span className={`flex-1 ${item.completed ? 'line-through' : ''}`}>
                                      {item.text}
                                    </span>
                                    {item.critical && (
                                      <Badge variant="destructive" className="text-xs">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Critical
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default RunOfShowTab;
