import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../PageHeader';

/**
 * OrganizationServiceDashboard provides the AWS-style service landing page for Organization Management.
 * Features:
 * - Service overview with key metrics
 * - Quick action buttons for common tasks
 * - Recent organizations and activity
 * - Service-specific widgets and analytics
 */
export const OrganizationServiceDashboard: React.FC = () => {
  // Mock data - in real implementation, this would come from API
  const dashboardData = {
    metrics: {
      totalOrganizations: 5,
      managedOrganizations: 2,
      totalMembers: 47,
      totalFollowers: 1834,
      activeEvents: 8,
    },
    recentOrganizations: [
      {
        id: '1',
        name: 'Tech Innovation Hub',
        role: 'OWNER',
        memberCount: 15,
        eventCount: 12,
        followerCount: 456,
        lastActivity: '2024-01-15',
      },
      {
        id: '2',
        name: 'Startup Accelerator',
        role: 'ADMIN',
        memberCount: 8,
        eventCount: 5,
        followerCount: 234,
        lastActivity: '2024-01-14',
      },
      {
        id: '3',
        name: 'AI Research Collective',
        role: 'MEMBER',
        memberCount: 24,
        eventCount: 18,
        followerCount: 1144,
        lastActivity: '2024-01-13',
      },
    ],
    quickActions: [
      {
        title: 'Manage Members',
        description: 'Add, remove, and manage organization members',
        href: '/console/organizations/list',
        icon: '👥',
        primary: true,
      },
      {
        title: 'Organization Settings',
        description: 'Configure branding and organization settings',
        href: '/console/organizations/list',
        icon: '⚙️',
      },
      {
        title: 'View Analytics',
        description: 'Monitor organization performance and growth',
        href: '/console/organizations/list',
        icon: '📊',
      },
      {
        title: 'Multi-Org Management',
        description: 'Manage multiple organizations',
        href: '/console/organizations/multi-org',
        icon: '🏢',
      },
    ],
  };

  const pageActions = [
    {
      label: 'Manage Organizations',
      action: () => window.location.href = '/console/organizations/list',
      variant: 'primary' as const,
    },
    {
      label: 'View Analytics',
      action: () => window.location.href = '/console/analytics',
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title="Organization Management"
          subtitle="Manage your organizations, members, and settings"
          actions={pageActions}
        />

        {/* Service Overview Metrics */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🏢</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Organizations</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.metrics.totalOrganizations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👑</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Managed Organizations</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboardData.metrics.managedOrganizations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardData.metrics.totalMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">❤️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Followers</p>
                  <p className="text-2xl font-bold text-purple-600">{dashboardData.metrics.totalFollowers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Events</p>
                  <p className="text-2xl font-bold text-orange-600">{dashboardData.metrics.activeEvents}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
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

        {/* Recent Organizations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Your Organizations</h3>
            <Link
              to="/console/organizations/list"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              View all organizations →
            </Link>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Your Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Events
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Followers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          org.role === 'OWNER' ? 'bg-purple-100 text-purple-800' :
                          org.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {org.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {org.memberCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {org.eventCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {org.followerCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/console/organizations/${org.id}`}
                          className="text-blue-600 hover:text-blue-500 mr-4"
                        >
                          View
                        </Link>
                        {(org.role === 'OWNER' || org.role === 'ADMIN') && (
                          <Link
                            to={`/console/organizations/${org.id}/members`}
                            className="text-gray-600 hover:text-gray-500"
                          >
                            Manage
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Service Information */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">About Organization Management Service</h3>
          <p className="text-blue-700 mb-4">
            The Organization Management Service provides comprehensive tools for managing your organizations, 
            members, and organizational settings. Oversee multiple organizations, track analytics, and 
            configure branding and policies from one centralized location.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Member Management</h4>
              <p className="text-blue-700">Invite, manage, and assign roles to organization members with granular permissions.</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Organization Settings</h4>
              <p className="text-blue-700">Configure branding, policies, and organizational preferences.</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Analytics & Insights</h4>
              <p className="text-blue-700">Track organization growth, member activity, and event performance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationServiceDashboard;