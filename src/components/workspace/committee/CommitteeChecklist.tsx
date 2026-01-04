import { useState } from 'react';
import { ClipboardList, Plus, Check, Square, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChecklists, COMMITTEE_CHECKLIST_TEMPLATES, ChecklistItem } from '@/hooks/useCommitteeDashboard';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CommitteeChecklistProps {
  workspaceId: string;
  committeeType?: string;
}

export function CommitteeChecklist({ workspaceId, committeeType }: CommitteeChecklistProps) {
  const { checklists, isLoading, createChecklist, toggleItem } = useChecklists(workspaceId);
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newChecklist, setNewChecklist] = useState({ title: '', template: '' });
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});

  const normalizedType = committeeType?.toLowerCase().replace(/\s+committee$/i, '').trim();
  const templates = normalizedType ? COMMITTEE_CHECKLIST_TEMPLATES[normalizedType] : [];

  const handleAddFromTemplate = (templateTitle: string) => {
    const template = templates?.find(t => t.title === templateTitle);
    if (!template) return;

    const items: ChecklistItem[] = template.items.map((text, index) => ({
      id: `${Date.now()}-${index}`,
      text,
      completed: false,
    }));

    createChecklist({
      workspace_id: workspaceId,
      title: template.title,
      committee_type: committeeType || null,
      items,
      is_template: false,
    });
    setShowAddDialog(false);
  };

  const handleAddCustomChecklist = () => {
    if (!newChecklist.title.trim()) return;
    createChecklist({
      workspace_id: workspaceId,
      title: newChecklist.title,
      committee_type: committeeType || null,
      items: [],
      is_template: false,
    });
    setNewChecklist({ title: '', template: '' });
    setShowAddDialog(false);
  };

  const handleAddItem = (checklistId: string) => {
    const text = newItemText[checklistId]?.trim();
    if (!text) return;

    const checklist = checklists.find(c => c.id === checklistId);
    if (!checklist) return;

    const newItem: ChecklistItem = {
      id: `${Date.now()}`,
      text,
      completed: false,
    };

    // We need to update the checklist with the new item
    // This is a bit hacky but works with our current hook setup
    toggleItem({
      checklistId,
      itemId: newItem.id,
      completed: false,
      userId: user?.id || '',
    });

    setNewItemText(prev => ({ ...prev, [checklistId]: '' }));
  };

  const handleToggleItem = (checklistId: string, itemId: string, currentState: boolean) => {
    toggleItem({
      checklistId,
      itemId,
      completed: !currentState,
      userId: user?.id || '',
    });
  };

  const getCompletionStats = (items: ChecklistItem[]) => {
    const completed = items.filter(i => i.completed).length;
    return { completed, total: items.length, percentage: items.length > 0 ? (completed / items.length) * 100 : 0 };
  };

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-secondary/50">
            <ClipboardList className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Checklists</h3>
            <p className="text-xs text-muted-foreground">
              {checklists.length} checklist{checklists.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Checklist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {templates && templates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Use Template
                  </p>
                  <div className="grid gap-2">
                    {templates.map((template) => (
                      <Button
                        key={template.title}
                        variant="outline"
                        className="justify-start h-auto py-3"
                        onClick={() => handleAddFromTemplate(template.title)}
                      >
                        <div className="text-left">
                          <p className="font-medium">{template.title}</p>
                          <p className="text-xs text-muted-foreground">{template.items.length} items</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or create custom</span>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Checklist title"
                  value={newChecklist.title}
                  onChange={(e) => setNewChecklist(prev => ({ ...prev, title: e.target.value }))}
                />
                <Button onClick={handleAddCustomChecklist} className="w-full">
                  Create Empty Checklist
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {checklists.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No checklists yet. Create one from a template or start fresh.
        </p>
      ) : (
        <div className="space-y-4">
          {checklists.map((checklist) => {
            const stats = getCompletionStats(checklist.items);
            
            return (
              <div key={checklist.id} className="border border-border rounded-lg overflow-hidden">
                <div className="p-3 bg-muted/50 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{checklist.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.completed}/{stats.total} completed
                    </p>
                  </div>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  {checklist.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleToggleItem(checklist.id, item.id, item.completed)}
                      className="flex items-start gap-2 w-full text-left group"
                    >
                      {item.completed ? (
                        <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0 group-hover:text-primary" />
                      )}
                      <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {item.text}
                      </span>
                    </button>
                  ))}

                  {/* Add new item */}
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Add item..."
                      value={newItemText[checklist.id] || ''}
                      onChange={(e) => setNewItemText(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddItem(checklist.id);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => handleAddItem(checklist.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
