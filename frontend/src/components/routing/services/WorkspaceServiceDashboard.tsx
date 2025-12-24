import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { PageHeader } from '../PageHeader';
import { Workspace, WorkspaceStatus } from '../../../types';
import api from '../../../lib/api';

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

  // Fetch user's workspaces
  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['user-workspaces'],
    queryFn: async () => {
      const response = await api.get('/workspaces/my-workspaces');
      return response.data.workspaces as Workspace[];
    },
  });

  // Calculate dashboard metrics
  const dashboardData = React.useMemo(() => {
    if (!workspaces) return null;

    const activeWorkspaces = workspaces.filter(w => w.status === WorkspaceStatus.ACTIVE);
    const provisioningWorkspaces = workspaces.filter(w => w.status === WorkspaceStatus.PROVISIONING);
    const windingDownWorkspaces = workspaces.filter(w => w.status === WorkspaceStatus.WINDING_DOWN);
    
    // Calculate total tasks and team members across all workspaces
    const totalTasks = workspaces.reduce((sum, w) => sum + (w.taskSummary?.total || 0), 0);
    const totalTeamMembers = workspaces.reduce((sum, w) => sum + (w.teamMembers?.length || 0), 0);

    return {
      metrics: {
        totalWorkspaces: workspaces.length,
        activeWorkspaces: activeWorkspaces.length,
        provisioningWorkspaces: provisioningWorkspaces.length,
        windingDownWorkspaces: windingDownWorkspaces.length,
        totalTasks,
        totalTeamMembers,
      },
      recentWorkspaces: workspaces
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
      quickActions: [
        {
          title: 'Create New Workspace',
          description: 'Start a new collaborative workspace',
          href: '/console/workspaces/create',
          icon: '🏗️',
          primary: true,
        },
        {
          title: 'Browse Templates',
          description: 'Use pre-built workspace templates',
          href: '/console/workspaces/templates',
          icon: '📋',
        },
        {
          title: 'View All Workspaces',
          description: 'Manage your existing workspaces',
          href: '/console/workspaces/list',
          icon: '📊',
        },
        {
          title: 'Team Analytics',
          description: 'View team performance metrics',
          href: '/console/analytics/workspaces',
          icon: '📈',
        },
      ],
    };
  }, [workspaces]);

  const pageActions = [
    {
      label: 'Create Workspace',
      action: () => window.location.href = '/console/workspaces/create',
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
          subtitle="Create, manage, and collaborate in event workspaces"
          actions={pageActions}
        />

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
                to="/console/workspaces/list"
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
                            to={`/console/workspaces/${workspace.id}`}
                            className="text-blue-600 hover:text-blue-500 mr-4"
                          >
                            View
                          </Link>
                          <Link
                            to={`/console/workspaces/${workspace.id}/tasks`}
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