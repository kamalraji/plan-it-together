import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceType } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Trash2, 
  Building2, 
  Users, 
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { CreateSubWorkspaceModal } from '../CreateSubWorkspaceModal';

interface ChildWorkspacesManagerProps {
  workspace: Workspace;
  orgSlug?: string;
  onWorkspaceSelect?: (workspaceId: string) => void;
}

interface ChildWorkspaceData {
  id: string;
  name: string;
  workspace_type: string | null;
  status: string;
  workspace_team_members: { count: number }[];
}

export function ChildWorkspacesManager({
  workspace,
  onWorkspaceSelect,
}: ChildWorkspacesManagerProps) {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch child workspaces
  const { data: childWorkspaces = [], isLoading } = useQuery({
    queryKey: ['child-workspaces', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          id,
          name,
          workspace_type,
          status,
          workspace_team_members(count)
        `)
        .eq('parent_workspace_id', workspace.id)
        .order('name');

      if (error) throw error;
      return data as ChildWorkspaceData[];
    },
  });

  // Delete workspace mutation
  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      // First check if there are any child workspaces
      const { data: children } = await supabase
        .from('workspaces')
        .select('id')
        .eq('parent_workspace_id', workspaceId);

      if (children && children.length > 0) {
        throw new Error('Cannot delete workspace with sub-workspaces. Please delete sub-workspaces first.');
      }

      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['child-workspaces', workspace.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace-hierarchy'] });
      toast.success('Workspace deleted successfully');
      setDeletingId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete workspace');
      setDeletingId(null);
    },
  });

  const handleDelete = (workspaceId: string) => {
    setDeletingId(workspaceId);
    deleteWorkspaceMutation.mutate(workspaceId);
  };

  const getWorkspaceTypeLabel = (type?: string | null) => {
    switch (type) {
      case WorkspaceType.DEPARTMENT:
        return 'Department';
      case WorkspaceType.COMMITTEE:
        return 'Committee';
      case WorkspaceType.TEAM:
        return 'Team';
      default:
        return 'Workspace';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden w-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Sub-Workspaces ({childWorkspaces.length})
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Create
          </Button>
        </div>

        {childWorkspaces.length > 0 ? (
          <div className="divide-y divide-border">
            {childWorkspaces.map((child) => {
              const memberCount = child.workspace_team_members?.[0]?.count || 0;
              
              return (
                <div
                  key={child.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors group"
                >
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => onWorkspaceSelect?.(child.id)}
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {child.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="px-1.5 py-0.5 bg-muted rounded">
                          {getWorkspaceTypeLabel(child.workspace_type)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {memberCount} members
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Delete Workspace
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <strong>"{child.name}"</strong>? 
                          This will permanently remove the workspace and all associated data 
                          including tasks, team members, and settings.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(child.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deletingId === child.id}
                        >
                          {deletingId === child.id ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-3">
              No sub-workspaces yet
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Create First Sub-Workspace
            </Button>
          </div>
        )}
      </div>

      <CreateSubWorkspaceModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        parentWorkspaceId={workspace.id}
        eventId={workspace.eventId}
      />
    </>
  );
}
