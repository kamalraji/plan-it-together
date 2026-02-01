import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, 
  Users, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle, 
  Circle,
  Trash2,
  Archive,
  MoreVertical,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  WORKSPACE_DEPARTMENTS, 
  DEPARTMENT_COMMITTEES,
} from '@/lib/workspaceHierarchy';
import { WorkspaceType } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';

interface WorkspaceStructureOverviewProps {
  eventId: string;
  parentWorkspaceId: string;
  canManage?: boolean;
}

interface ExistingWorkspace {
  id: string;
  name: string;
  workspace_type: string | null;
  department_id: string | null;
  status: string;
}

export function WorkspaceStructureOverview({
  eventId,
  parentWorkspaceId,
  canManage = false,
}: WorkspaceStructureOverviewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set(WORKSPACE_DEPARTMENTS.map(d => d.id)));
  const [deleteDialog, setDeleteDialog] = useState<{ workspace: ExistingWorkspace } | null>(null);
  const [archiveDialog, setArchiveDialog] = useState<{ workspace: ExistingWorkspace } | null>(null);

  // Fetch all sub-workspaces under the root
  const { data: existingWorkspaces, isLoading } = useQuery({
    queryKey: ['workspace-structure', eventId, parentWorkspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, workspace_type, department_id, status')
        .eq('event_id', eventId)
        .eq('parent_workspace_id', parentWorkspaceId);

      if (error) throw error;
      return (data || []) as ExistingWorkspace[];
    },
    enabled: !!eventId && !!parentWorkspaceId,
  });

  // Build lookup maps
  const { departmentMap, committeeMap } = useMemo(() => {
    const deptMap = new Map<string, ExistingWorkspace>();
    const commMap = new Map<string, ExistingWorkspace>();

    existingWorkspaces?.forEach(ws => {
      if (ws.workspace_type === WorkspaceType.DEPARTMENT && ws.department_id) {
        deptMap.set(ws.department_id, ws);
      }
      if (ws.workspace_type === WorkspaceType.COMMITTEE) {
        commMap.set(ws.name.toLowerCase(), ws);
      }
    });

    return { departmentMap: deptMap, committeeMap: commMap };
  }, [existingWorkspaces]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      // First check if workspace has children
      const { data: children } = await supabase
        .from('workspaces')
        .select('id')
        .eq('parent_workspace_id', workspaceId);

      if (children && children.length > 0) {
        throw new Error('Cannot delete workspace with sub-workspaces. Delete children first.');
      }

      // Delete team members first
      await supabase
        .from('workspace_team_members')
        .delete()
        .eq('workspace_id', workspaceId);

      // Delete the workspace
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Workspace deleted', description: 'The workspace has been permanently deleted.' });
      queryClient.invalidateQueries({ queryKey: ['workspace-structure'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['existing-sub-workspaces'] });
      setDeleteDialog(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete', description: error.message, variant: 'destructive' });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      const { error } = await supabase
        .from('workspaces')
        .update({ status: 'ARCHIVED' })
        .eq('id', workspaceId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Workspace archived', description: 'The workspace has been archived and hidden.' });
      queryClient.invalidateQueries({ queryKey: ['workspace-structure'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['existing-sub-workspaces'] });
      setArchiveDialog(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to archive', description: error.message, variant: 'destructive' });
    },
  });

  const toggleDept = (deptId: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  // Calculate stats
  const totalDepts = WORKSPACE_DEPARTMENTS.length;
  const createdDepts = WORKSPACE_DEPARTMENTS.filter(d => departmentMap.has(d.id)).length;
  const totalComms = Object.values(DEPARTMENT_COMMITTEES).flat().length;
  const createdComms = Object.values(DEPARTMENT_COMMITTEES).flat().filter(c => 
    committeeMap.has(c.name.toLowerCase())
  ).length;

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">Departments:</span>
            <span className="font-medium">{createdDepts}/{totalDepts}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">Committees:</span>
            <span className="font-medium">{createdComms}/{totalComms}</span>
          </div>
        </div>
        <div className="flex gap-2 text-[10px]">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Created
          </span>
          <span className="flex items-center gap-1">
            <Circle className="h-3 w-3 text-muted-foreground" />
            Planned
          </span>
        </div>
      </div>

      {/* Tree */}
      <div className="border rounded-lg divide-y divide-border/50">
        {WORKSPACE_DEPARTMENTS.map((dept) => {
          const existingDept = departmentMap.get(dept.id);
          const isCreated = !!existingDept;
          const isArchived = existingDept?.status === 'ARCHIVED';
          const isExpanded = expandedDepts.has(dept.id);
          const committees = DEPARTMENT_COMMITTEES[dept.id] || [];
          const createdInDept = committees.filter(c => committeeMap.has(c.name.toLowerCase())).length;

          return (
            <div key={dept.id} className={cn(isArchived && "opacity-50")}>
              {/* Department Row */}
              <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50">
                <button
                  type="button"
                  onClick={() => toggleDept(dept.id)}
                  className="p-0.5 rounded hover:bg-muted text-muted-foreground"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {isCreated ? (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}

                <Building2 className={cn("h-4 w-4", isCreated ? "text-blue-500" : "text-muted-foreground")} />
                
                <span className={cn(
                  "flex-1 text-sm font-medium",
                  isCreated ? "text-foreground" : "text-muted-foreground"
                )}>
                  {dept.name}
                </span>

                <span className="text-xs text-muted-foreground">
                  {createdInDept}/{committees.length} committees
                </span>

                {isCreated && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    isArchived 
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  )}>
                    {isArchived ? 'Archived' : 'Active'}
                  </span>
                )}

                {isCreated && canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!isArchived && (
                        <DropdownMenuItem onClick={() => setArchiveDialog({ workspace: existingDept })}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => setDeleteDialog({ workspace: existingDept })}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Committees */}
              {isExpanded && (
                <div className="bg-muted/20 border-t border-border/30">
                  {committees.map((comm) => {
                    const existingComm = committeeMap.get(comm.name.toLowerCase());
                    const isCommCreated = !!existingComm;
                    const isCommArchived = existingComm?.status === 'ARCHIVED';

                    return (
                      <div 
                        key={comm.id} 
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 pl-12 hover:bg-muted/50",
                          isCommArchived && "opacity-50"
                        )}
                      >
                        {isCommCreated ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}

                        <Users className={cn("h-3.5 w-3.5", isCommCreated ? "text-amber-500" : "text-muted-foreground")} />
                        
                        <span className={cn(
                          "flex-1 text-sm",
                          isCommCreated ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {comm.name}
                        </span>

                        {isCommCreated && (
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-full",
                            isCommArchived 
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          )}>
                            {isCommArchived ? 'Archived' : 'Active'}
                          </span>
                        )}

                        {isCommCreated && canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!isCommArchived && (
                                <DropdownMenuItem onClick={() => setArchiveDialog({ workspace: existingComm })}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => setDeleteDialog({ workspace: existingComm })}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Workspace
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{deleteDialog?.workspace.name}</strong>? 
              This action cannot be undone. All tasks, team members, and data in this workspace will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog && deleteMutation.mutate(deleteDialog.workspace.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!archiveDialog} onOpenChange={(open) => !open && setArchiveDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-500" />
              Archive Workspace
            </AlertDialogTitle>
            <AlertDialogDescription>
              Archive <strong>{archiveDialog?.workspace.name}</strong>? 
              The workspace will be hidden from navigation but data will be preserved. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveDialog && archiveMutation.mutate(archiveDialog.workspace.id)}
            >
              {archiveMutation.isPending ? 'Archiving...' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
