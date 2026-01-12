import React, { useState } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { PageHeader } from '../PageHeader';
import { WorkspaceStatus } from '../../../types';
import { UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/components/organization/OrganizationContext';
import { ChevronDown, ChevronRight, Users, Building2, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';


/**
 * WorkspaceServiceDashboard provides the AWS-style service landing page for Workspace Management.
 * Features:
 * - Service overview with key workspace metrics
 * - Quick action buttons for common workspace tasks
 * - Recent workspaces and activity
 * - Service-specific widgets and analytics
 */
export const WorkspaceServiceDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const organization = useCurrentOrganization();
 
  const currentPath = location.pathname;
  const orgSlugCandidate = currentPath.split('/')[1];
  const isOrgContext = !!orgSlugCandidate && orgSlugCandidate !== 'dashboard';
  const eventId = searchParams.get('eventId');
 
  const baseWorkspacePath = isOrgContext && orgSlugCandidate
    ? `/${orgSlugCandidate}/workspaces`
    : '/dashboard/workspaces';

  // Fetch user's workspaces directly from Supabase (grouped by user/org)
  const { data: workspacesData, isLoading } = useQuery({
    queryKey: ['user-workspaces-supabase', organization?.id, eventId, user?.id],
    queryFn: async () => {
      if (!user?.id) return { myWorkspaces: [], orgWorkspaces: [], allFlat: [] };

      // Build query based on context
      let query = supabase
        .from('workspaces')
        .select(`
          id, name, status, created_at, updated_at, event_id, organizer_id, parent_workspace_id,
          events!inner(id, name, organization_id),
          workspace_team_members(user_id)
        `)
        .order('created_at', { ascending: false });

      // If in org context, filter by organization
      if (organization?.id) {
        query = query.eq('events.organization_id', organization.id);
      }

      // If eventId is provided, filter by event
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
        teamMembers: row.workspace_team_members || [],
        channels: [],
        taskSummary: undefined,
        description: undefined,
      }));

      // Separate into my workspaces (created or member) and organization workspaces
      const myWorkspaces = allWorkspaces.filter((w) => w.isOwner || w.isMember);
      const orgWorkspaces = allWorkspaces.filter((w) => !w.isOwner && !w.isMember);

      // Build hierarchy for display (root workspaces with their children)
      const buildHierarchy = (workspaces: typeof allWorkspaces) => {
        const roots = workspaces.filter((w) => !w.parentWorkspaceId);
        const children = workspaces.filter((w) => w.parentWorkspaceId);
        
        return roots.map((root) => ({
          ...root,
          subWorkspaces: children.filter((c) => c.parentWorkspaceId === root.id),
        }));
      };

      return {
        myWorkspaces: buildHierarchy(myWorkspaces),
        orgWorkspaces: buildHierarchy(orgWorkspaces),
        allFlat: allWorkspaces,
      };
    },
    enabled: !!user?.id,
  });

  const workspaces = workspacesData?.allFlat || [];

  // Calculate dashboard metrics, optionally scoped by event
  const dashboardData = React.useMemo(() => {
    if (!workspaces) return null;
 
    const scopedWorkspaces = eventId
      ? workspaces.filter((w) => w.eventId === eventId)
      : workspaces;
 
    if (!scopedWorkspaces.length) {
      return {
        metrics: {
          totalWorkspaces: 0,
          activeWorkspaces: 0,
          provisioningWorkspaces: 0,
          windingDownWorkspaces: 0,
          totalTasks: 0,
          totalTeamMembers: 0,
        },
        recentWorkspaces: [],
        quickActions: [],
      };
    }
 
    const activeWorkspaces = scopedWorkspaces.filter((w) => w.status === WorkspaceStatus.ACTIVE);
    const provisioningWorkspaces = scopedWorkspaces.filter((w) => w.status === WorkspaceStatus.PROVISIONING);
    const windingDownWorkspaces = scopedWorkspaces.filter((w) => w.status === WorkspaceStatus.WINDING_DOWN);
 
    const totalTasks = scopedWorkspaces.reduce((sum, w: any) => sum + (w.taskSummary?.total || 0), 0);
    const totalTeamMembers = scopedWorkspaces.reduce((sum, w: any) => sum + (w.teamMembers?.length || 0), 0);
 
    return {
      metrics: {
        totalWorkspaces: scopedWorkspaces.length,
        activeWorkspaces: activeWorkspaces.length,
        provisioningWorkspaces: provisioningWorkspaces.length,
        windingDownWorkspaces: windingDownWorkspaces.length,
        totalTasks,
        totalTeamMembers,
      },
      recentWorkspaces: scopedWorkspaces
        .slice()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
      quickActions: [
        {
          title: 'Create New Workspace',
          description: 'Start a new collaborative workspace',
          href: `${baseWorkspacePath}/create${eventId ? `?eventId=${eventId}` : ''}`,
          icon: '🏗️',
          primary: true,
        },
        {
          title: 'Browse Templates',
          description: 'Use pre-built workspace templates',
          href: `${baseWorkspacePath}/templates`,
          icon: '📋',
        },
        {
          title: 'View All Workspaces',
          description: 'Manage your existing workspaces',
          href: `${baseWorkspacePath}/list${eventId ? `?eventId=${eventId}` : ''}`,
          icon: '📊',
        },
        {
          title: 'Team Analytics',
          description: 'View team performance metrics',
          href: isOrgContext && orgSlugCandidate
            ? `/${orgSlugCandidate}/analytics?scope=workspaces${eventId ? `&eventId=${eventId}` : ''}`
            : '/dashboard/analytics?scope=workspaces',
          icon: '📈',
        },
      ],
    };
  }, [workspaces, eventId, isOrgContext, orgSlugCandidate, baseWorkspacePath]);

  const canManageWorkspaces =
    !isOrgContext || (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ORGANIZER);

  const pageActions = canManageWorkspaces
    ? [
        {
          label: 'Create Workspace',
          action: () => navigate(`${baseWorkspacePath}/create${eventId ? `?eventId=${eventId}` : ''}`),
          variant: 'primary' as const,
        },
        {
          label: 'Import Workspace',
          action: () => console.log('Import workspace'),
          variant: 'secondary' as const,
        },
      ]
    : [];



  const isWorkspacesLoading = isLoading;

  // Sidebar state
  const [myWorkspacesExpanded, setMyWorkspacesExpanded] = useState(true);
  const [orgWorkspacesExpanded, setOrgWorkspacesExpanded] = useState(true);
  const navigate = useNavigate();

  // Helper to render workspace item in sidebar
  const WorkspaceSidebarItem = ({ workspace, depth = 0 }: { workspace: any; depth?: number }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = workspace.subWorkspaces && workspace.subWorkspaces.length > 0;
    
    return (
      <div>
        <button
          onClick={() => {
            if (workspace.eventId) {
              navigate(`${baseWorkspacePath}/${workspace.eventId}?workspaceId=${workspace.id}`);
            } else {
              navigate(`${baseWorkspacePath}/${workspace.id}`);
            }
          }}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left",
            "text-foreground"
          )}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-0.5 hover:bg-muted-foreground/20 rounded"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          {expanded && hasChildren ? (
            <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="truncate flex-1">{workspace.name}</span>
          {workspace.isOwner && (
            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">Owner</span>
          )}
        </button>
        {hasChildren && expanded && (
          <div>
            {workspace.subWorkspaces.map((sub: any) => (
              <WorkspaceSidebarItem key={sub.id} workspace={sub} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-card">
        <ScrollArea className="flex-1 py-4">
          {/* My Workspaces Section */}
          <div className="px-3 mb-4">
            <button
              onClick={() => setMyWorkspacesExpanded(!myWorkspacesExpanded)}
              className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>My Workspaces</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {workspacesData?.myWorkspaces?.length || 0}
                </span>
                {myWorkspacesExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>
            {myWorkspacesExpanded && (
              <div className="mt-1 space-y-0.5">
                {workspacesData?.myWorkspaces?.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No workspaces yet</p>
                ) : (
                  workspacesData?.myWorkspaces?.map((workspace: any) => (
                    <WorkspaceSidebarItem key={workspace.id} workspace={workspace} />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Organization Workspaces Section */}
          <div className="px-3">
            <button
              onClick={() => setOrgWorkspacesExpanded(!orgWorkspacesExpanded)}
              className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>Organization Workspaces</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {workspacesData?.orgWorkspaces?.length || 0}
                </span>
                {orgWorkspacesExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>
            {orgWorkspacesExpanded && (
              <div className="mt-1 space-y-0.5">
                {workspacesData?.orgWorkspaces?.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No other workspaces</p>
                ) : (
                  workspacesData?.orgWorkspaces?.map((workspace: any) => (
                    <WorkspaceSidebarItem key={workspace.id} workspace={workspace} />
                  ))
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Workspace Management"
          subtitle={
            eventId
              ? 'Workspaces for this event and organization'
              : isOrgContext
                ? 'Workspaces for this organization'
                : 'Create, manage, and collaborate in event workspaces'
          }
          actions={pageActions}
        />

        {/* Role-aware notice */}
        {!canManageWorkspaces && (
          <div className="rounded-md border border-border/80 bg-muted/40 px-4 py-3 text-xs sm:text-sm text-muted-foreground">
            You have view-only access to workspace analytics. Organizers and admins can create and manage workspaces.
          </div>
        )}

 

        {/* Service Overview / Empty state */}
        <section>
          {isWorkspacesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6 animate-pulse">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-muted rounded-lg border border-border/60 h-24 sm:h-28"
                />
              ))}
            </div>
          ) : (
            dashboardData && (
              <>
                {dashboardData.metrics.totalWorkspaces === 0 ? (
                  <div className="bg-card rounded-lg border border-dashed border-border/80 p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div className="space-y-3">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground">
                          No workspaces yet
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {eventId
                            ? 'No workspaces have been provisioned for this event in this organization yet.'
                            : isOrgContext
                              ? 'This organization has no workspaces yet.'
                              : "You don’t have any workspaces yet."}
                        </p>
                        {eventId && (
                          <p className="text-[11px] sm:text-xs text-muted-foreground">
                            You can also provision a workspace for this event from the Event Management console.
                          </p>
                        )}

                        <div className="mt-2">
                          <p className="text-[11px] sm:text-xs font-medium text-muted-foreground mb-1.5">
                            Get started in three steps:
                          </p>
                          <ol className="space-y-1.5 text-[11px] sm:text-xs text-muted-foreground list-decimal list-inside">
                            <li>Create a workspace for your event or organizing team.</li>
                            <li>Invite team members so everyone has a shared home.</li>
                            <li>Add tasks, assign owners, and track progress together.</li>
                          </ol>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 min-w-[200px]">
                        {canManageWorkspaces ? (
                          <>
                            <Link
                              to={`${baseWorkspacePath}/create${eventId ? `?eventId=${eventId}` : ''}`}
                              className="inline-flex items-center justify-center rounded-md bg-primary px-3.5 py-2 text-xs sm:text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                            >
                              Create workspace
                            </Link>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-[11px] sm:text-xs font-medium text-muted-foreground hover:bg-muted"
                            >
                              Learn more about workspaces
                            </button>
                          </>
                        ) : (
                          <p className="text-[11px] sm:text-xs text-muted-foreground">
                            Ask an organizer or admin to create a workspace for you.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                ) : null}
              </>
            )
          )}
        </section>

        {/* Recent Workspaces - Innovative Card Design */}
        {dashboardData && dashboardData.recentWorkspaces.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/30 rounded-full" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
                  Recent Workspaces
                </h3>
              </div>
              <Link
                to={`${baseWorkspacePath}/list${eventId ? `?eventId=${eventId}` : ''}`}
                className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {dashboardData.recentWorkspaces.map((workspace, index) => (
                <Link
                  key={workspace.id}
                  to={`${baseWorkspacePath}/${workspace.id}`}
                  className="group relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Status indicator bar */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-1 transition-all duration-300",
                    workspace.status === WorkspaceStatus.ACTIVE && "bg-gradient-to-r from-emerald-500 to-emerald-400",
                    workspace.status === WorkspaceStatus.PROVISIONING && "bg-gradient-to-r from-amber-500 to-amber-400",
                    workspace.status === WorkspaceStatus.WINDING_DOWN && "bg-gradient-to-r from-sky-500 to-sky-400",
                    workspace.status === WorkspaceStatus.DISSOLVED && "bg-gradient-to-r from-muted-foreground/50 to-muted-foreground/30"
                  )} />
                  
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {workspace.name}
                        </h4>
                        {workspace.event && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {workspace.event.name}
                          </p>
                        )}
                      </div>
                      <span className={cn(
                        "shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full uppercase tracking-wide",
                        workspace.status === WorkspaceStatus.ACTIVE && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                        workspace.status === WorkspaceStatus.PROVISIONING && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                        workspace.status === WorkspaceStatus.WINDING_DOWN && "bg-sky-500/15 text-sky-600 dark:text-sky-400",
                        workspace.status === WorkspaceStatus.DISSOLVED && "bg-muted text-muted-foreground"
                      )}>
                        {workspace.status}
                      </span>
                    </div>
                    
                    {/* Description */}
                    {workspace.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {workspace.description}
                      </p>
                    )}
                    
                    {/* Footer stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>{workspace.teamMembers?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground/60">Updated</span>
                          <span>{new Date(workspace.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-medium">Open</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </Link>
              ))}
            </div>
          </div>
        )}
 
        {/* Service Information */}
        <div className="bg-primary/5 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-primary mb-2">About Workspace Management Service</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            The Workspace Management Service provides comprehensive tools for creating, managing, and collaborating in
            event workspaces. From team coordination to task management, organize your entire event preparation in
            collaborative workspaces.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-1">Team Collaboration</h4>
              <p className="text-muted-foreground">Invite team members, assign roles, and coordinate event preparation tasks.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Task Management</h4>
              <p className="text-muted-foreground">Create, assign, and track tasks with Kanban boards and progress monitoring.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Communication Hub</h4>
              <p className="text-muted-foreground">Centralized communication with messaging, announcements, and file sharing.</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceServiceDashboard;