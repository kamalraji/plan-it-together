import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { PageHeader } from '../PageHeader';
import { Workspace, WorkspaceStatus } from '../../../types';
import api from '../../../lib/api';
import { useLocation, useSearchParams } from 'react-router-dom';

/**
 * WorkspaceServiceDashboard provides the AWS-style service landing page for Workspace Management.
 * Features:
 * - Service overview with key workspace metrics
 * - Quick action buttons for common workspace tasks
 * - Recent workspaces and activity
 * - Service-specific widgets and analytics
 */
export const WorkspaceServiceDashboard: React.FC = () => {
  useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
 
  const currentPath = location.pathname;
  const orgSlugCandidate = currentPath.split('/')[1];
  const isOrgContext = !!orgSlugCandidate && orgSlugCandidate !== 'dashboard';
  const eventId = searchParams.get('eventId');
 
  const baseWorkspacePath = isOrgContext && orgSlugCandidate
    ? `/${orgSlugCandidate}/workspaces`
    : '/dashboard/workspaces';
 
  // Fetch user's workspaces (scoped by org/event via query params when available)
  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['user-workspaces', orgSlugCandidate, eventId],
    queryFn: async () => {
      const response = await api.get('/workspaces/my-workspaces', {
        params: {
          orgSlug: isOrgContext ? orgSlugCandidate : undefined,
          eventId: eventId || undefined,
        },
      });
      return response.data.workspaces as Workspace[];
    },
  });

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
 
    const totalTasks = scopedWorkspaces.reduce((sum, w) => sum + (w.taskSummary?.total || 0), 0);
    const totalTeamMembers = scopedWorkspaces.reduce((sum, w) => sum + (w.teamMembers?.length || 0), 0);
 
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

  const pageActions = [
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
  ];

  const getStatusColor = (status: WorkspaceStatus) => {
    switch (status) {
      case WorkspaceStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case WorkspaceStatus.PROVISIONING:
        return 'bg-yellow-100 text-yellow-800';
      case WorkspaceStatus.WINDING_DOWN:
        return 'bg-blue-100 text-blue-800';
      case WorkspaceStatus.DISSOLVED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
 
        {/* Event Filter (org-scoped) */}
        {dashboardData && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Filter by event:</span>
            <select
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

        {/* Service Overview Metrics */}
        {dashboardData && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🏗️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Workspaces</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.metrics.totalWorkspaces}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🟢</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Workspaces</p>
                    <p className="text-2xl font-bold text-green-600">{dashboardData.metrics.activeWorkspaces}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Provisioning</p>
                    <p className="text-2xl font-bold text-yellow-600">{dashboardData.metrics.provisioningWorkspaces}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Winding Down</p>
                    <p className="text-2xl font-bold text-blue-600">{dashboardData.metrics.windingDownWorkspaces}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-bold text-purple-600">{dashboardData.metrics.totalTasks}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Team Members</p>
                    <p className="text-2xl font-bold text-indigo-600">{dashboardData.metrics.totalTeamMembers}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {dashboardData && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardData.quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.href}
                  className={`block p-6 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    action.primary
                      ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{action.icon}</span>
                    <h4 className={`font-medium ${action.primary ? 'text-blue-900' : 'text-gray-900'}`}>
                      {action.title}
                    </h4>
                  </div>
                  <p className={`text-sm ${action.primary ? 'text-blue-700' : 'text-gray-600'}`}>
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Workspaces */}
        {dashboardData && dashboardData.recentWorkspaces.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-medium text-gray-900">Recent Workspaces</h3>
               <Link
                 to={`${baseWorkspacePath}/list${eventId ? `?eventId=${eventId}` : ''}`}
                 className="text-sm text-blue-600 hover:text-blue-500 font-medium"
               >
                 View all workspaces →
               </Link>
             </div>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Workspace Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.recentWorkspaces.map((workspace) => (
                      <tr key={workspace.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{workspace.name}</div>
                          {workspace.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {workspace.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(workspace.status)}`}>
                            {workspace.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {workspace.event ? workspace.event.name : 'No event'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {workspace.teamMembers?.length || 0} members
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(workspace.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                             to={`${baseWorkspacePath}/${workspace.id}`}
                             className="text-blue-600 hover:text-blue-500 mr-4"
                           >
                             View
                           </Link>
                           <Link
                             to={`${baseWorkspacePath}/${workspace.id}/tasks`}
                             className="text-gray-600 hover:text-gray-500"
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
        <div className="bg-indigo-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-indigo-900 mb-2">About Workspace Management Service</h3>
          <p className="text-indigo-700 mb-4">
            The Workspace Management Service provides comprehensive tools for creating, managing, and collaborating in event workspaces. 
            From team coordination to task management, organize your entire event preparation in collaborative workspaces.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-indigo-900 mb-1">Team Collaboration</h4>
              <p className="text-indigo-700">Invite team members, assign roles, and coordinate event preparation tasks.</p>
            </div>
            <div>
              <h4 className="font-medium text-indigo-900 mb-1">Task Management</h4>
              <p className="text-indigo-700">Create, assign, and track tasks with Kanban boards and progress monitoring.</p>
            </div>
            <div>
              <h4 className="font-medium text-indigo-900 mb-1">Communication Hub</h4>
              <p className="text-indigo-700">Centralized communication with messaging, announcements, and file sharing.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceServiceDashboard;