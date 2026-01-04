import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceStatus, UserRole } from '@/types';
import { useCurrentOrganization } from './OrganizationContext';
import { OrganizationBreadcrumbs } from '@/components/organization/OrganizationBreadcrumbs';
import { WorkspaceDashboard } from '@/components/workspace/WorkspaceDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  PlusIcon, 
  Squares2X2Icon, 
  CheckIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
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
import { Badge } from '@/components/ui/badge';

// Workspace templates with pre-populated tasks and roles
const WORKSPACE_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Workspace',
    description: 'Start from scratch with an empty workspace',
    icon: Squares2X2Icon,
    complexity: 'SIMPLE' as const,
    roles: [],
    tasks: [],
  },
  {
    id: 'general-event',
    name: 'General Event',
    description: 'Basic event organization with core roles and tasks',
    icon: ClipboardDocumentListIcon,
    complexity: 'SIMPLE' as const,
    roles: [
      { role: 'EVENT_LEAD', count: 1 },
      { role: 'EVENT_COORDINATOR', count: 2 },
      { role: 'VOLUNTEER_COORDINATOR', count: 2 },
    ],
    tasks: [
      { title: 'Create event timeline', priority: 'HIGH', status: 'TODO' },
      { title: 'Set up registration system', priority: 'HIGH', status: 'TODO' },
      { title: 'Prepare venue logistics', priority: 'MEDIUM', status: 'TODO' },
      { title: 'Coordinate volunteer schedules', priority: 'MEDIUM', status: 'TODO' },
      { title: 'Send event reminders', priority: 'LOW', status: 'TODO' },
    ],
  },
  {
    id: 'conference',
    name: 'Conference',
    description: 'Multi-track conference with speakers, sessions, and networking',
    icon: UsersIcon,
    complexity: 'COMPLEX' as const,
    roles: [
      { role: 'EVENT_LEAD', count: 1 },
      { role: 'OPERATIONS_MANAGER', count: 1 },
      { role: 'MARKETING_LEAD', count: 1 },
      { role: 'CONTENT_LEAD', count: 1 },
      { role: 'SPEAKER_COORDINATOR', count: 2 },
      { role: 'REGISTRATION_COORDINATOR', count: 2 },
      { role: 'VOLUNTEER_COORDINATOR', count: 3 },
    ],
    tasks: [
      { title: 'Finalize conference theme and tracks', priority: 'HIGH', status: 'TODO' },
      { title: 'Confirm keynote speakers', priority: 'HIGH', status: 'TODO' },
      { title: 'Set up speaker submission portal', priority: 'HIGH', status: 'TODO' },
      { title: 'Create session schedule', priority: 'HIGH', status: 'TODO' },
      { title: 'Design conference badges', priority: 'MEDIUM', status: 'TODO' },
      { title: 'Arrange catering and refreshments', priority: 'MEDIUM', status: 'TODO' },
      { title: 'Set up networking areas', priority: 'MEDIUM', status: 'TODO' },
      { title: 'Prepare attendee welcome kit', priority: 'LOW', status: 'TODO' },
      { title: 'Create post-event survey', priority: 'LOW', status: 'TODO' },
    ],
  },
  {
    id: 'hackathon',
    name: 'Hackathon',
    description: 'Competition-style event with teams, judging, and prizes',
    icon: ClipboardDocumentListIcon,
    complexity: 'COMPLEX' as const,
    roles: [
      { role: 'EVENT_LEAD', count: 1 },
      { role: 'TECH_LEAD', count: 1 },
      { role: 'JUDGING_COORDINATOR', count: 1 },
      { role: 'SPONSOR_COORDINATOR', count: 1 },
      { role: 'MENTOR_COORDINATOR', count: 2 },
      { role: 'VOLUNTEER_COORDINATOR', count: 3 },
    ],
    tasks: [
      { title: 'Define hackathon themes and tracks', priority: 'HIGH', status: 'TODO' },
      { title: 'Set up team registration system', priority: 'HIGH', status: 'TODO' },
      { title: 'Create judging criteria and rubric', priority: 'HIGH', status: 'TODO' },
      { title: 'Recruit mentors and judges', priority: 'HIGH', status: 'TODO' },
      { title: 'Prepare development environment and APIs', priority: 'MEDIUM', status: 'TODO' },
      { title: 'Organize sponsor booths', priority: 'MEDIUM', status: 'TODO' },
      { title: 'Plan opening and closing ceremonies', priority: 'MEDIUM', status: 'TODO' },
      { title: 'Set up submission platform', priority: 'MEDIUM', status: 'TODO' },
      { title: 'Arrange prizes and swag', priority: 'LOW', status: 'TODO' },
    ],
  },
  {
    id: 'workshop',
    name: 'Workshop',
    description: 'Hands-on learning session with materials and exercises',
    icon: ClipboardDocumentListIcon,
    complexity: 'MODERATE' as const,
    roles: [
      { role: 'EVENT_LEAD', count: 1 },
      { role: 'CONTENT_LEAD', count: 1 },
      { role: 'TECHNICAL_COORDINATOR', count: 1 },
      { role: 'VOLUNTEER_COORDINATOR', count: 2 },
    ],
    tasks: [
      { title: 'Prepare workshop curriculum', priority: 'HIGH', status: 'TODO' },
      { title: 'Create hands-on exercises', priority: 'HIGH', status: 'TODO' },
      { title: 'Set up required tools and software', priority: 'HIGH', status: 'TODO' },
      { title: 'Prepare participant materials', priority: 'MEDIUM', status: 'TODO' },
      { title: 'Test AV equipment', priority: 'MEDIUM', status: 'TODO' },
      { title: 'Create feedback form', priority: 'LOW', status: 'TODO' },
    ],
  },
];

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
      {/* Render sub-workspaces if any */}
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
 * OrgWorkspacePage
 *
 * Organization-scoped workspace portal for the route `/:orgSlug/workspaces/:eventId`.
 * Shows workspace list sidebar and full workspace dashboard when one is selected.
 */
export const OrgWorkspacePage: React.FC = () => {
  const organization = useCurrentOrganization();
  const { orgSlug, eventId } = useParams<{ orgSlug: string; eventId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const selectedWorkspaceId = searchParams.get('workspaceId') || undefined;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(WORKSPACE_TEMPLATES[0]);

  // Load all workspaces for this organization (including sub-workspaces)
  // Grouped by: user's workspaces (created/member) and organization workspaces
  const { data: workspacesData, isLoading: workspacesLoading } = useQuery({
    queryKey: ['org-workspaces', organization?.id, eventId, user?.id],
    queryFn: async () => {
      if (!organization?.id) return { myWorkspaces: [], orgWorkspaces: [] };

      // Build query - if eventId is provided, filter by event
      let query = supabase
        .from('workspaces')
        .select(`
          id, name, status, created_at, updated_at, event_id, organizer_id, parent_workspace_id,
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
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        organizerId: row.organizer_id,
        parentWorkspaceId: row.parent_workspace_id,
        isOwner: row.organizer_id === user?.id,
        isMember: row.workspace_team_members?.some((m: any) => m.user_id === user?.id),
        event: row.events
          ? {
            id: row.events.id,
            name: row.events.name,
          }
          : undefined,
      }));

      // Separate into my workspaces (created or member) and organization workspaces
      const myWorkspaces = allWorkspaces.filter((w: any) => w.isOwner || w.isMember);
      const orgWorkspaces = allWorkspaces.filter((w: any) => !w.isOwner && !w.isMember);

      // Build hierarchy for display (root workspaces with their children)
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

  // Create workspace mutation with template support
  const createWorkspaceMutation = useMutation({
    mutationFn: async ({ name, template }: { name: string; template: typeof WORKSPACE_TEMPLATES[0] }) => {
      if (!eventId || !user?.id) throw new Error('Missing required data');
      
      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name,
          event_id: eventId,
          organizer_id: user.id,
          status: 'ACTIVE',
        })
        .select('id')
        .single();

      if (workspaceError) throw workspaceError;

      // If template has tasks, create them
      if (template.tasks.length > 0) {
        const tasksToInsert = template.tasks.map(task => ({
          workspace_id: workspace.id,
          title: task.title,
          priority: task.priority,
          status: task.status,
        }));

        const { error: tasksError } = await supabase
          .from('workspace_tasks')
          .insert(tasksToInsert);

        if (tasksError) {
          console.error('Failed to create template tasks:', tasksError);
          // Don't throw - workspace was created successfully
        }
      }

      // Add current user as owner in team members
      const { error: memberError } = await supabase
        .from('workspace_team_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'OWNER',
          status: 'ACTIVE',
        });

      if (memberError) {
        console.error('Failed to add owner to team:', memberError);
      }

      return workspace;
    },
    onSuccess: (data) => {
      const templateName = selectedTemplate.id !== 'blank' ? ` using "${selectedTemplate.name}" template` : '';
      toast.success(`Workspace created successfully${templateName}`);
      queryClient.invalidateQueries({ queryKey: ['org-workspaces', organization?.id, eventId] });
      setIsCreateDialogOpen(false);
      setNewWorkspaceName('');
      setSelectedTemplate(WORKSPACE_TEMPLATES[0]);
      // Select the newly created workspace
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('workspaceId', data.id);
        return next;
      });
    },
    onError: (error) => {
      console.error('Failed to create workspace:', error);
      toast.error('Failed to create workspace');
    },
  });

  // Auto-select first workspace if none selected and workspaces exist
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

  const handleCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }
    createWorkspaceMutation.mutate({ 
      name: newWorkspaceName.trim(), 
      template: selectedTemplate 
    });
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('workspaceId', workspaceId);
      return next;
    });
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'SIMPLE':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'MODERATE':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'COMPLEX':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Only show page header when no workspace is selected */}
      {!selectedWorkspaceId && (
        <header className="space-y-2">
          <OrganizationBreadcrumbs
            items={[
              {
                label: organization?.name ?? 'Organization',
                href: orgSlug ? `/${orgSlug}` : undefined,
              },
              {
                label: 'Events',
                href: `/${orgSlug}/eventmanagement`,
              },
              {
                label: event?.name ?? 'Event',
                href: `/${orgSlug}/eventmanagement/${eventId}`,
              },
              {
                label: 'Workspaces',
                isCurrent: true,
              },
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
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                size="sm"
                className="gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">New Workspace</span>
              </Button>
            )}
          </div>
        </header>
      )}

      {/* Main content - workspace dashboard */}
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
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-2"
              >
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

      {/* Create Workspace Dialog with Templates */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace for {event?.name || 'this event'}. Choose a template to get started quickly with pre-configured tasks and roles.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Workspace Name */}
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                placeholder="e.g., Main Operations, Marketing Team"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
              />
            </div>

            {/* Template Selection */}
            <div className="space-y-3">
              <Label>Choose a Template</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WORKSPACE_TEMPLATES.map((template) => {
                  const Icon = template.icon;
                  const isSelected = selectedTemplate.id === template.id;
                  
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplate(template)}
                      className={cn(
                        "relative text-left p-4 rounded-xl border-2 transition-all",
                        "hover:border-primary/50 hover:bg-primary/5",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border/70 bg-card/50"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckIcon className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          isSelected ? "bg-primary/10" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "h-5 w-5",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-foreground">
                              {template.name}
                            </h4>
                            {template.id !== 'blank' && (
                              <Badge 
                                variant="outline" 
                                className={cn("text-[10px] px-1.5 py-0", getComplexityColor(template.complexity))}
                              >
                                {template.complexity}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                          {template.id !== 'blank' && (
                            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{template.roles.length} roles</span>
                              <span>{template.tasks.length} tasks</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template Preview */}
            {selectedTemplate.id !== 'blank' && (
              <div className="rounded-lg border border-border/70 bg-muted/30 p-4 space-y-4">
                <h4 className="text-sm font-medium text-foreground">Template Preview</h4>
                
                {/* Roles */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Team Roles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTemplate.roles.map((role, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {role.role.replace(/_/g, ' ')} ({role.count})
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Pre-configured Tasks</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedTemplate.tasks.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            task.priority === 'HIGH' 
                              ? 'bg-red-500/10 text-red-600 border-red-500/20'
                              : task.priority === 'MEDIUM'
                              ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                              : 'bg-green-500/10 text-green-600 border-green-500/20'
                          )}
                        >
                          {task.priority}
                        </Badge>
                        <span className="text-foreground">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border/50 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewWorkspaceName('');
                setSelectedTemplate(WORKSPACE_TEMPLATES[0]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={createWorkspaceMutation.isPending || !newWorkspaceName.trim()}
            >
              {createWorkspaceMutation.isPending ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgWorkspacePage;