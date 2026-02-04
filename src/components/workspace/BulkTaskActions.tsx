import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WorkspaceTask, TaskStatus, TaskPriority } from '@/types';
import { CheckSquare, Trash2, Tag, X } from 'lucide-react';
import { toast } from 'sonner';

interface BulkTaskActionsProps {
  tasks: WorkspaceTask[];
  selectedIds: Set<string>;
  onSelectAll: (selectAll: boolean) => void;
  onSelectTask: (taskId: string, selected: boolean) => void;
  onBulkStatusChange: (taskIds: string[], status: TaskStatus) => Promise<void>;
  onBulkPriorityChange?: (taskIds: string[], priority: TaskPriority) => Promise<void>;
  onBulkDelete: (taskIds: string[]) => Promise<void>;
  onClearSelection: () => void;
}

export function BulkTaskActions({
  tasks,
  selectedIds,
  onSelectAll,
  onSelectTask: _onSelectTask,
  onBulkStatusChange,
  onBulkPriorityChange,
  onBulkDelete,
  onClearSelection,
}: BulkTaskActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedCount = selectedIds.size;
  const allSelected = tasks.length > 0 && selectedCount === tasks.length;
  const someSelected = selectedCount > 0 && selectedCount < tasks.length;

  const handleBulkStatusChange = async (status: TaskStatus) => {
    if (selectedCount === 0) return;
    
    setIsProcessing(true);
    try {
      await onBulkStatusChange(Array.from(selectedIds), status);
      toast.success(`Updated ${selectedCount} tasks to ${status.replace('_', ' ')}`);
      onClearSelection();
    } catch (error) {
      toast.error('Failed to update tasks');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkPriorityChange = async (priority: TaskPriority) => {
    if (selectedCount === 0 || !onBulkPriorityChange) return;
    
    setIsProcessing(true);
    try {
      await onBulkPriorityChange(Array.from(selectedIds), priority);
      toast.success(`Updated priority for ${selectedCount} tasks`);
      onClearSelection();
    } catch (error) {
      toast.error('Failed to update priority');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await onBulkDelete(Array.from(selectedIds));
      toast.success(`Deleted ${selectedCount} tasks`);
      onClearSelection();
    } catch (error) {
      toast.error('Failed to delete tasks');
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  if (selectedCount === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-b border-border">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(checked) => onSelectAll(!!checked)}
          aria-label="Select all tasks"
        />
        <span className="text-sm text-muted-foreground">
          Select tasks to perform bulk actions
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border-b border-primary/20">
        <Checkbox
          checked={allSelected}
          ref={(el) => {
            if (el) {
              (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = someSelected;
            }
          }}
          onCheckedChange={(checked) => onSelectAll(!!checked)}
          aria-label="Select all tasks"
        />
        
        <span className="text-sm font-medium text-foreground">
          {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
        </span>

        <div className="flex items-center gap-2 ml-auto">
          {/* Change Status */}
          <Select onValueChange={(v) => handleBulkStatusChange(v as TaskStatus)} disabled={isProcessing}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Set Status" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TaskStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Change Priority */}
          {onBulkPriorityChange && (
            <Select onValueChange={(v) => handleBulkPriorityChange(v as TaskPriority)} disabled={isProcessing}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <Tag className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="Set Priority" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TaskPriority).map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Delete */}
          <Button
            variant="destructive"
            size="sm"
            className="h-8"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isProcessing}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={onClearSelection}
            disabled={isProcessing}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} tasks?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All selected tasks will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
