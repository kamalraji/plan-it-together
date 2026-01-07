import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceStatus, UserRole } from '@/types';
import { useCurrentOrganization } from './OrganizationContext';
import { OrganizationBreadcrumbs } from '@/components/organization/OrganizationBreadcrumbs';
import { WorkspaceDashboard } from '@/components/workspace/WorkspaceDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { buildWorkspaceUrl } from '@/lib/workspaceNavigation';
import { 
  PlusIcon, 
  Squares2X2Icon, 
  CheckIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { cn } from '@/lib/utils';
import { ENHANCED_WORKSPACE_TEMPLATES, EnhancedWorkspaceTemplate } from '@/lib/workspaceTemplates';
import { WorkspaceTemplateSelector } from '@/components/workspace/WorkspaceTemplateSelector';
import { useWorkspaceProvisioning } from '@/hooks/useWorkspaceProvisioning';

// Workspace list item component with sub-workspace support
interface WorkspaceListItemProps {
  workspace: any;
  selectedWorkspaceId?: string;
  onSelect: (id: string) => void;
  showEvent?: boolean;
  isSubWorkspace?: boolean;
}

const WorkspaceListItem: React.FC<WorkspaceListItemProps> = ({
  workspace,
  selectedWorkspaceId,
  onSelect,
  showEvent = false,
  isSubWorkspace = false,
}) => {
  const isSelected = selectedWorkspaceId === workspace.id;
  
  return (
    <>
      <button
        onClick={() => onSelect(workspace.id)}
        className={cn(
          "w-full text-left px-3 py-2.5 rounded-lg transition-colors",
          "hover:bg-muted/50",
          isSelected
            ? "bg-primary/10 border border-primary/20"
            : "border border-transparent",
          isSubWorkspace && "ml-4"
        )}
      >
        <div className="flex items-center gap-2">
          <Squares2X2Icon className={cn(
            "h-4 w-4 flex-shrink-0",
            isSelected ? "text-primary" : "text-muted-foreground"
          )} />
          <div className="min-w-0 flex-1">
            <p className={cn(
              "text-sm font-medium truncate",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {workspace.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {showEvent && workspace.event?.name 
                ? workspace.event.name 
                : workspace.status === 'ACTIVE' ? 'Active' : workspace.status}
            </p>
          </div>
          {isSelected && (
            <CheckIcon className="h-4 w-4 text-primary flex-shrink-0" />
          )}
        </div>
      </button>
      {workspace.subWorkspaces?.map((subWorkspace: any) => (
        <WorkspaceListItem
          key={subWorkspace.id}
          workspace={subWorkspace}
          selectedWorkspaceId={selectedWorkspaceId}
          onSelect={onSelect}
          showEvent={showEvent}
          isSubWorkspace
        />
      ))}
    </>
  );
};

/**
 * OrgWorkspacePage - Organization-scoped workspace portal
 */
export const OrgWorkspacePage: React.FC = () => {
  const organization = useCurrentOrganization();
  const { orgSlug, eventId } = useParams<{ orgSlug: string; eventId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Extract workspace type from URL path (e.g., /department, /committee, /team, /root)
  const pathParts = location.pathname.split('/').filter(Boolean);
  const workspaceTypeFromPath = pathParts.find(part => 
    ['root', 'department', 'committee', 'team'].includes(part)
  ) as 'root' | 'department' | 'committee' | 'team' | undefined;
  
  // Get workspace name from query params for new URL structure
  const workspaceName = searchParams.get('name') || undefined;
  const selectedWorkspaceId = searchParams.get('workspaceId') || undefined;
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EnhancedWorkspaceTemplate>(ENHANCED_WORKSPACE_TEMPLATES[0]);

  const { provisionWorkspaceAsync, isPending: isProvisioning } = useWorkspaceProvisioning();

  // Load all workspaces for this organization
  const { data: workspacesData, isLoading: workspacesLoading } = useQuery({
    queryKey: ['org-workspaces', organization?.id, eventId, user?.id],
    queryFn: async () => {
      if (!organization?.id) return { myWorkspaces: [], orgWorkspaces: [] };

      let query = supabase
        .from('workspaces')
        .select(`
          id, name, status, created_at, updated_at, event_id, organizer_id, parent_workspace_id, workspace_type,
          events!inner(id, name, organization_id),
          workspace_team_members(user_id)
        `)
        .eq('events.organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const allWorkspaces = (data || []).map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        name: row.name,
        status: row.status as WorkspaceStatus,
        workspaceType: row.workspace_type, // Include workspace_type
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        organizerId: row.organizer_id,
        parentWorkspaceId: row.parent_workspace_id,
        isOwner: row.organizer_id === user?.id,
        isMember: row.workspace_team_members?.some((m: any) => m.user_id === user?.id),
        event: row.events ? { id: row.events.id, name: row.events.name } : undefined,
      }));

      const myWorkspaces = allWorkspaces.filter((w: any) => w.isOwner || w.isMember);
      const orgWorkspaces = allWorkspaces.filter((w: any) => !w.isOwner && !w.isMember);

      const buildHierarchy = (workspaces: any[]) => {
        const roots = workspaces.filter((w: any) => !w.parentWorkspaceId);
        const children = workspaces.filter((w: any) => w.parentWorkspaceId);
        return roots.map((root: any) => ({
          ...root,
          subWorkspaces: children.filter((c: any) => c.parentWorkspaceId === root.id),
        }));
      };

      return {
        myWorkspaces: buildHierarchy(myWorkspaces),
        orgWorkspaces: buildHierarchy(orgWorkspaces),
        allFlat: allWorkspaces,
      };
    },
    enabled: !!organization?.id && !!user?.id,
  });

  const workspaces = workspacesData?.allFlat || [];
  const myWorkspaces = workspacesData?.myWorkspaces || [];
  const orgWorkspaces = workspacesData?.orgWorkspaces || [];

  // Get event details
  const { data: event } = useQuery({
    queryKey: ['event-name', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from('events')
        .select('id, name')
        .eq('id', eventId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (!selectedWorkspaceId && workspaces && workspaces.length > 0) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('workspaceId', workspaces[0].id);
        return next;
      }, { replace: true });
    }
  }, [selectedWorkspaceId, workspaces, setSearchParams]);

  const canManageWorkspaces =
    !!user && (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN);

  const hasNoWorkspaces = !workspacesLoading && (!workspaces || workspaces.length === 0);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }
    if (!eventId || !user?.id) {
      toast.error('Missing required data');
      return;
    }

    try {
      const result = await provisionWorkspaceAsync({
        name: newWorkspaceName.trim(),
        eventId,
        userId: user.id,
        template: selectedTemplate,
        organizationId: organization?.id,
      });

      queryClient.invalidateQueries({ queryKey: ['org-workspaces', organization?.id, eventId] });
      setIsCreateDialogOpen(false);
      setNewWorkspaceName('');
      setSelectedTemplate(ENHANCED_WORKSPACE_TEMPLATES[0]);
      
      // Navigate to the newly created workspace using the new type-based URL
      if (orgSlug) {
        const url = buildWorkspaceUrl({
          orgSlug,
          eventId,
          workspaceId: result.rootWorkspace.id,
          workspaceType: 'ROOT',
          workspaceName: result.rootWorkspace.name,
        });
        navigate(url);
      }
    } catch (error) {
      // Error already handled by the hook
    }
  };

  const handleSelectWorkspace = (workspaceId: string, workspace?: any) => {
    if (workspace && orgSlug && eventId) {
      const url = buildWorkspaceUrl({
        orgSlug,
        eventId,
        workspaceId,
        workspaceType: workspace.workspaceType || 'ROOT',
        workspaceName: workspace.name,
      });
      navigate(url);
    } else if (orgSlug && eventId) {
      // Fallback: navigate with just workspaceId
      navigate(`/${orgSlug}/workspaces/${eventId}/root?workspaceId=${workspaceId}`);
    }
  };

  // Log current URL context for debugging (uses the extracted variables)
  if (process.env.NODE_ENV === 'development') {
    console.debug('[OrgWorkspacePage] URL context:', { workspaceTypeFromPath, workspaceName, selectedWorkspaceId });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Page header when no workspace selected */}
      {!selectedWorkspaceId && (
        <header className="space-y-2">
          <OrganizationBreadcrumbs
            items={[
              { label: organization?.name ?? 'Organization', href: orgSlug ? `/${orgSlug}` : undefined },
              { label: 'Events', href: `/${orgSlug}/eventmanagement` },
              { label: event?.name ?? 'Event', href: `/${orgSlug}/eventmanagement/${eventId}` },
              { label: 'Workspaces', isCurrent: true },
            ]}
            className="text-xs"
          />
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {event?.name ? `${event.name} Workspaces` : 'Event Workspaces'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage workspaces for this event with tasks, team, and communication.
              </p>
            </div>
            {canManageWorkspaces && (
              <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="gap-2">
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">New Workspace</span>
              </Button>
            )}
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="min-h-[500px]">
        {selectedWorkspaceId ? (
          <WorkspaceDashboard workspaceId={selectedWorkspaceId} orgSlug={orgSlug} />
        ) : hasNoWorkspaces ? (
          <div className="rounded-2xl border border-border/70 bg-card/80 p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Squares2X2Icon className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No workspaces yet</h2>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Create your first workspace to start organizing tasks, managing your team, and coordinating communication for this event.
            </p>
            {canManageWorkspaces && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <PlusIcon className="h-4 w-4" />
                Create Workspace
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <h2 className="text-base font-semibold text-foreground mb-2">Select a workspace</h2>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Choose a workspace from the sidebar to view tasks, team members, and communication.
            </p>
          </div>
        )}
      </main>

      {/* Mobile workspace selector */}
      {!hasNoWorkspaces && workspaces && workspaces.length > 0 && (
        <div className="md:hidden">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Select Workspace</Label>
          <select
            value={selectedWorkspaceId || ''}
            onChange={(e) => handleSelectWorkspace(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            {myWorkspaces.length > 0 && (
              <optgroup label="My Workspaces">
                {myWorkspaces.map((workspace: any) => (
                  <React.Fragment key={workspace.id}>
                    <option value={workspace.id}>{workspace.name}</option>
                    {workspace.subWorkspaces?.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>↳ {sub.name}</option>
                    ))}
                  </React.Fragment>
                ))}
              </optgroup>
            )}
            {orgWorkspaces.length > 0 && (
              <optgroup label="Organization Workspaces">
                {orgWorkspaces.map((workspace: any) => (
                  <React.Fragment key={workspace.id}>
                    <option value={workspace.id}>{workspace.name}</option>
                    {workspace.subWorkspaces?.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>↳ {sub.name}</option>
                    ))}
                  </React.Fragment>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      )}

      {/* Create Workspace Dialog with Enhanced Templates */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace for {event?.name || 'this event'}. Choose a template to auto-generate departments, committees, tasks, and milestones.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Workspace Name */}
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                placeholder="e.g., Main Operations, Event HQ"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
              />
            </div>

            {/* Enhanced Template Selection */}
            <div className="space-y-3">
              <Label>Choose a Template</Label>
              <WorkspaceTemplateSelector
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border/50 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewWorkspaceName('');
                setSelectedTemplate(ENHANCED_WORKSPACE_TEMPLATES[0]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={isProvisioning || !newWorkspaceName.trim()}
            >
              {isProvisioning ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgWorkspacePage;
