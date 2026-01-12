import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Workspace } from '@/types';
import { useAllWorkspacesData } from '@/hooks/useAllWorkspacesData';
import { AllWorkspacesTable } from '../management/AllWorkspacesTable';
import { WorkspaceHealthDashboard } from '../management/WorkspaceHealthDashboard';
import { BulkOperationsPanel } from '../management/BulkOperationsPanel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, RefreshCw, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { slugify, buildWorkspaceUrl, buildHierarchyChain } from '@/lib/workspaceNavigation';

interface WorkspaceManagementTabProps {
  workspace: Workspace;
  orgSlug?: string;
  onCreateSubWorkspace: () => void;
}

export function WorkspaceManagementTab({ 
  workspace, 
  orgSlug,
  onCreateSubWorkspace 
}: WorkspaceManagementTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useAllWorkspacesData(workspace.eventId);

  const handleViewWorkspace = async (workspaceId: string) => {
    if (!orgSlug || !workspace.eventId) return;

    // Fetch workspace data to build hierarchical URL
    const { data: targetWs } = await supabase
      .from('workspaces')
      .select('id, name, slug, workspace_type, parent_workspace_id')
      .eq('id', workspaceId)
      .single();

    const { data: eventData } = await supabase
      .from('events')
      .select('slug, name')
      .eq('id', workspace.eventId)
      .single();

    if (targetWs && eventData && data?.workspaces) {
      const eventSlug = eventData.slug || slugify(eventData.name);
      const hierarchy = buildHierarchyChain(workspaceId, data.workspaces.map(ws => ({
        id: ws.id,
        slug: ws.slug || slugify(ws.name),
        name: ws.name,
        workspaceType: ws.workspaceType,
        parentWorkspaceId: ws.parentWorkspaceId,
      })));

      const newUrl = buildWorkspaceUrl({ orgSlug, eventSlug, eventId: workspace.eventId, hierarchy });
      navigate(newUrl);
    }
  };

  const handleArchiveWorkspace = async (workspaceId: string) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ status: 'ARCHIVED' })
        .eq('id', workspaceId);

      if (error) throw error;

      toast({
        title: 'Workspace Archived',
        description: 'The workspace has been archived successfully.',
      });

      refetch();
    } catch (err) {
      console.error('Error archiving workspace:', err);
      toast({
        title: 'Archive Failed',
        description: 'Failed to archive workspace. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) throw error;

      toast({
        title: 'Workspace Deleted',
        description: 'The workspace has been deleted successfully.',
      });

      refetch();
    } catch (err) {
      console.error('Error deleting workspace:', err);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete workspace. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExportStructure = () => {
    if (!data?.workspaces) return;

    const exportData = {
      exportedAt: new Date().toISOString(),
      eventId: workspace.eventId,
      stats: data.stats,
      workspaces: data.workspaces,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-structure-${workspace.eventId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Workspace structure has been exported.',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive mb-4">Failed to load workspace data</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const { workspaces = [], stats } = data || { workspaces: [], stats: null };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Workspace Control</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all workspaces across your event hierarchy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportStructure}>
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={onCreateSubWorkspace}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create
          </Button>
        </div>
      </div>

      {/* Health Dashboard */}
      {stats && (
        <WorkspaceHealthDashboard stats={stats} workspaces={workspaces} />
      )}

      {/* Bulk Operations */}
      {workspace.eventId && (
        <BulkOperationsPanel
          selectedIds={selectedIds}
          eventId={workspace.eventId}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      {/* All Workspaces Table */}
      <div className="bg-card rounded-lg border p-4">
        <AllWorkspacesTable
          workspaces={workspaces}
          onViewWorkspace={handleViewWorkspace}
          onArchiveWorkspace={handleArchiveWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>
    </div>
  );
}
