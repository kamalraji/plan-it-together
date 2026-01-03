import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { PageHeader } from '../PageHeader';
import { WorkspaceStatus } from '../../../types';
import { UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/components/organization/OrganizationContext';


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
  const [searchParams, setSearchParams] = useSearchParams();
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
          action: () => {
            window.location.href = `${baseWorkspacePath}/create${eventId ? `?eventId=${eventId}` : ''}`;
          },
          variant: 'primary' as const,
        },
        {
          label: 'Import Workspace',
          action: () => console.log('Import workspace'),
          variant: 'secondary' as const,
        },
      ]
    : [];


  const getStatusColor = (status: WorkspaceStatus) => {
    switch (status) {
      case WorkspaceStatus.ACTIVE:
        return 'bg-emerald-100 text-emerald-800';
      case WorkspaceStatus.PROVISIONING:
        return 'bg-amber-100 text-amber-800';
      case WorkspaceStatus.WINDING_DOWN:
        return 'bg-sky-100 text-sky-800';
      case WorkspaceStatus.DISSOLVED:
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const isWorkspacesLoading = isLoading;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
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

 
        {/* Event Filter (org-scoped) */}
        {dashboardData && (
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Filter by event:</span>
            <select
              className="border border-border rounded-md px-3 py-1.5 text-xs sm:text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              value={eventId || ''}
              onChange={(e) => {
                const value = e.target.value;
                const params = new URLSearchParams(searchParams);
                if (value) {
                  params.set('eventId', value);
                } else {
                  params.delete('eventId');
                }
                setSearchParams(params);
              }}
            >
              <option value="">All events</option>
              {workspaces &&
                Array.from(
                  new Map(
                    workspaces
                      .filter((w) => w.event)
                      .map((w) => [w.event!.id, w.event!.name] as [string, string])
                  ).entries()
                ).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
            </select>
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

                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">
                    {/* existing metric cards unchanged */}
                    <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="text-xl sm:text-2xl">🏗️</span>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Workspaces</p>
                          <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardData.metrics.totalWorkspaces}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="text-xl sm:text-2xl">🟢</span>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Workspaces</p>
                          <p className="text-xl sm:text-2xl font-bold text-primary">{dashboardData.metrics.activeWorkspaces}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="text-xl sm:text-2xl">📝</span>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Provisioning</p>
                          <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardData.metrics.provisioningWorkspaces}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="text-xl sm:text-2xl">⏳</span>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Winding Down</p>
                          <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardData.metrics.windingDownWorkspaces}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="text-xl sm:text-2xl">📋</span>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Tasks</p>
                          <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardData.metrics.totalTasks}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="text-xl sm:text-2xl">👥</span>
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Team Members</p>
                          <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardData.metrics.totalTeamMembers}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )
          )}
        </section>


        {/* Quick Actions */}
        {dashboardData && (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-foreground">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {dashboardData.quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.href}
                  className={`block p-4 sm:p-6 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    action.primary
                      ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                      : 'border-border bg-card hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                    <span className="text-xl sm:text-2xl">{action.icon}</span>
                    <h4 className={`text-sm sm:text-base font-medium ${action.primary ? 'text-primary' : 'text-foreground'}`}>
                      {action.title}
                    </h4>
                  </div>
                  <p className={`text-xs sm:text-sm ${action.primary ? 'text-primary' : 'text-muted-foreground'}`}>
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Workspaces */}
        {dashboardData && dashboardData.recentWorkspaces.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
              <h3 className="text-base sm:text-lg font-medium text-foreground">Recent Workspaces</h3>
              <Link
                to={`${baseWorkspacePath}/list${eventId ? `?eventId=${eventId}` : ''}`}
                className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium"
              >
                View all workspaces →
              </Link>
            </div>
            
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Workspace Name
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Team Size
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {dashboardData.recentWorkspaces.map((workspace) => (
                      <tr key={workspace.id} className="hover:bg-muted/60">
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">{workspace.name}</div>
                          {workspace.description && (
                            <div className="text-xs sm:text-sm text-muted-foreground truncate max-w-xs">
                              {workspace.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-[11px] sm:text-xs font-semibold rounded-full ${getStatusColor(workspace.status)}`}>
                            {workspace.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">
                          {workspace.event ? workspace.event.name : 'No event'}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">
                          {workspace.teamMembers?.length || 0} members
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">
                          {new Date(workspace.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <Link
                            to={`${baseWorkspacePath}/${workspace.id}`}
                            className="text-primary hover:text-primary/80 mr-3 sm:mr-4"
                          >
                            View
                          </Link>
                          <Link
                            to={`${baseWorkspacePath}/${workspace.id}/tasks`}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Tasks
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
  );
};

export default WorkspaceServiceDashboard;