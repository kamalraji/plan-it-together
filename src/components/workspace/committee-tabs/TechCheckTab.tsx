import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, CheckCircle, Clock, User, Play, Plus, Trash2, RotateCcw, Volume2, Monitor, Wifi, Lightbulb, Loader2 } from 'lucide-react';
import { useTechCheck, TechCheckSection } from '@/hooks/useTechCheck';
import { format } from 'date-fns';

interface TechCheckTabProps {
  workspaceId: string;
  eventId?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Settings,
  Volume2,
  Monitor,
  Wifi,
  Lightbulb,
};

function SectionIcon({ iconName, className }: { iconName: string | null; className?: string }) {
  const Icon = iconName ? iconMap[iconName] || Settings : Settings;
  return <Icon className={className} />;
}

export function TechCheckTab({ workspaceId, eventId }: TechCheckTabProps) {
  const {
    sections,
    stats,
    isLoading,
    createSection,
    deleteSection,
    createItem,
    deleteItem,
    toggleItem,
    resetAllItems,
    createDefaultTemplate,
  } = useTechCheck(workspaceId, eventId);

  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) return;
    await createSection.mutateAsync({ title: newSectionTitle.trim() });
    setNewSectionTitle('');
    setShowAddSection(false);
  };

  const handleCreateItem = async (sectionId: string) => {
    if (!newItemLabel.trim()) return;
    await createItem.mutateAsync({ sectionId, label: newItemLabel.trim() });
    setNewItemLabel('');
    setShowAddItem(null);
  };

  const handleCreateDefaultTemplate = async () => {
    setIsCreatingTemplate(true);
    await createDefaultTemplate();
    setIsCreatingTemplate(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tech Check</h2>
          <p className="text-sm text-muted-foreground">Pre-event technical verification checklist</p>
        </div>
        <div className="flex gap-2">
          {sections.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all items?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will uncheck all items and clear all notes. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={resetAllItems}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={() => setShowAddSection(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {sections.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No checklist items yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your tech check sections or use a default template
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setShowAddSection(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
              <Button onClick={handleCreateDefaultTemplate} disabled={isCreatingTemplate}>
                {isCreatingTemplate ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Use Default Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      {sections.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{stats.completedItems}/{stats.totalItems} items</span>
            </div>
            <Progress value={stats.progress} className="h-2" />
            <div className="flex items-center gap-4 mt-3">
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />{stats.completedItems} Complete
              </Badge>
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                <Clock className="h-3 w-3 mr-1" />{stats.totalItems - stats.completedItems} Remaining
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checklist Sections */}
      <div className="grid gap-4">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            onToggleItem={toggleItem}
            onDeleteSection={() => deleteSection.mutate(section.id)}
            onAddItem={() => setShowAddItem(section.id)}
            onDeleteItem={(itemId) => deleteItem.mutate(itemId)}
          />
        ))}
      </div>

      {/* Add Section Dialog */}
      <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Section title (e.g., Audio Systems)"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSection(false)}>Cancel</Button>
            <Button onClick={handleCreateSection} disabled={!newSectionTitle.trim() || createSection.isPending}>
              {createSection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Section'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={!!showAddItem} onOpenChange={() => setShowAddItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Item label (e.g., Test main speakers)"
              value={newItemLabel}
              onChange={(e) => setNewItemLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && showAddItem && handleCreateItem(showAddItem)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItem(null)}>Cancel</Button>
            <Button 
              onClick={() => showAddItem && handleCreateItem(showAddItem)} 
              disabled={!newItemLabel.trim() || createItem.isPending}
            >
              {createItem.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SectionCardProps {
  section: TechCheckSection;
  onToggleItem: (itemId: string) => void;
  onDeleteSection: () => void;
  onAddItem: () => void;
  onDeleteItem: (itemId: string) => void;
}

function SectionCard({ section, onToggleItem, onDeleteSection, onAddItem, onDeleteItem }: SectionCardProps) {
  const sectionComplete = section.items.filter(i => i.checked).length;
  const sectionTotal = section.items.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <SectionIcon iconName={section.icon} className="h-4 w-4" />
            {section.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{sectionComplete}/{sectionTotal}</Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete section?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete the section "{section.title}" and all its items. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteSection} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {section.items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-2 rounded-lg border transition-colors group ${
                item.checked ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-card hover:bg-muted/30'
              }`}
            >
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => onToggleItem(item.id)}
              />
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                  {item.label}
                </span>
                {item.checked && item.checkedAt && item.checkedByName && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Checked by {item.checkedByName} at {format(item.checkedAt, 'h:mm a')}
                  </p>
                )}
                {item.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic">
                    {item.notes}
                  </p>
                )}
              </div>
              {item.assigneeName && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {item.assigneeName}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                onClick={() => onDeleteItem(item.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          {/* Add Item Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full border-dashed border text-muted-foreground hover:text-foreground"
            onClick={onAddItem}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
