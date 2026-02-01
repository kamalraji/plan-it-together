import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardCheck, MapPin, Plus, MoreVertical, User, MessageSquare, Trash2, RotateCcw, RefreshCw, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useVenueSetupChecklist, VenueChecklistItem } from '@/hooks/useVenueSetupChecklist';
import { format } from 'date-fns';

interface VenueSetupChecklistProps {
  workspaceId: string;
  eventId?: string;
}

export function VenueSetupChecklist({ workspaceId, eventId }: VenueSetupChecklistProps) {
  const {
    items,
    stats,
    isLoading,
    createItem,
    deleteItem,
    toggleItem,
    assignItem,
    addNote,
    resetAllItems,
    createDefaultItems,
  } = useVenueSetupChecklist(workspaceId, eventId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VenueChecklistItem | null>(null);
  const [newTask, setNewTask] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [noteText, setNoteText] = useState('');

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    createItem.mutate({
      task: newTask.trim(),
      location: newLocation.trim() || undefined,
    });
    setNewTask('');
    setNewLocation('');
    setIsAddDialogOpen(false);
  };

  const handleOpenNote = (item: VenueChecklistItem) => {
    setSelectedItem(item);
    setNoteText(item.notes || '');
    setIsNoteDialogOpen(true);
  };

  const handleSaveNote = () => {
    if (selectedItem) {
      addNote(selectedItem.id, noteText);
      setIsNoteDialogOpen(false);
      setSelectedItem(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold text-foreground">Venue Setup Checklist</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-medium">
            {stats.completedItems}/{stats.totalItems} ({stats.progress}%)
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </DropdownMenuItem>
                </DialogTrigger>
              </Dialog>
              {items.length === 0 && (
                <DropdownMenuItem onClick={() => createDefaultItems()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Load Default Checklist
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => resetAllItems()} className="text-destructive">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No tasks yet</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
              <Button variant="secondary" size="sm" onClick={() => createDefaultItems()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Load Defaults
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {items.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                onToggle={() => toggleItem(item.id)}
                onDelete={() => deleteItem.mutate(item.id)}
                onOpenNote={() => handleOpenNote(item)}
                onAssign={(userId) => assignItem(item.id, userId)}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Description</label>
              <Input
                placeholder="e.g., Test main projector"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location (optional)</label>
              <Input
                placeholder="e.g., Main Hall"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTask} disabled={!newTask.trim() || createItem.isPending}>
              {createItem.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">{selectedItem?.task}</p>
            <Textarea
              placeholder="Add notes about this task..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNote}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface ChecklistItemRowProps {
  item: VenueChecklistItem;
  onToggle: () => void;
  onDelete: () => void;
  onOpenNote: () => void;
  onAssign: (userId: string | null) => void;
}

function ChecklistItemRow({ item, onToggle, onDelete, onOpenNote, onAssign }: ChecklistItemRowProps) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors group ${
        item.completed ? 'bg-success/5' : 'bg-muted/50'
      }`}
    >
      <Checkbox
        checked={item.completed}
        onCheckedChange={onToggle}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
          {item.task}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {item.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{item.location}</span>
            </div>
          )}
          {item.assigneeName && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-primary" />
              <span className="text-xs text-primary">{item.assigneeName}</span>
            </div>
          )}
          {item.completed && item.completedByName && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-success" />
              <span className="text-xs text-muted-foreground">
                by {item.completedByName}
                {item.completedAt && ` at ${format(item.completedAt, 'HH:mm')}`}
              </span>
            </div>
          )}
          {item.notes && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">{item.notes}</span>
            </div>
          )}
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onOpenNote} title="Add note">
          <MessageSquare className="h-3.5 w-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpenNote}>
              <MessageSquare className="h-4 w-4 mr-2" />
              {item.notes ? 'Edit Note' : 'Add Note'}
            </DropdownMenuItem>
            {item.assigneeId ? (
              <DropdownMenuItem onClick={() => onAssign(null)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Unassign
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
