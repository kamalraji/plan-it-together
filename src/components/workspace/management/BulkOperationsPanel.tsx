import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Archive, Trash2, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface BulkOperationsPanelProps {
  selectedIds: string[];
  eventId: string;
  onClearSelection: () => void;
}

export function BulkOperationsPanel({ 
  selectedIds, 
  eventId,
  onClearSelection 
}: BulkOperationsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleBulkArchive = async () => {
    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ status: 'ARCHIVED' })
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: 'Workspaces Archived',
        description: `Successfully archived ${selectedIds.length} workspace(s)`,
      });

      queryClient.invalidateQueries({ queryKey: ['all-workspaces-management', eventId] });
      onClearSelection();
    } catch (error) {
      console.error('Error archiving workspaces:', error);
      toast({
        title: 'Archive Failed',
        description: 'Failed to archive workspaces. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
      setShowArchiveDialog(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: 'Workspaces Deleted',
        description: `Successfully deleted ${selectedIds.length} workspace(s)`,
      });

      queryClient.invalidateQueries({ queryKey: ['all-workspaces-management', eventId] });
      onClearSelection();
    } catch (error) {
      console.error('Error deleting workspaces:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete workspaces. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Preparing workspace data for export...',
    });
    // TODO: Implement actual export logic
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
        <span className="text-sm font-medium text-muted-foreground">
          {selectedIds.length} selected
        </span>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowArchiveDialog(true)}
          disabled={isArchiving}
          className="gap-1.5"
        >
          <Archive className="w-4 h-4" />
          Archive
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-1.5"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting}
          className="gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          Clear
        </Button>
      </div>

      {/* Archive Confirmation */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {selectedIds.length} Workspace(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the selected workspaces. They will no longer appear in the active list but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkArchive} disabled={isArchiving}>
              {isArchiving ? 'Archiving...' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} Workspace(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected workspaces and all associated data including tasks, team members, and communications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
