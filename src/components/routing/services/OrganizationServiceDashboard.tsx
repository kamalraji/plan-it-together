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
        href: '/dashboard/organizations/list',
        icon: '👥',
        primary: true,
      },
      {
        title: 'Organization Settings',
        description: 'Configure branding and organization settings',
        href: '/dashboard/organizations/list',
        icon: '⚙️',
      },
      {
        title: 'View Analytics',
        description: 'Monitor organization performance and growth',
        href: '/dashboard/organizations/list',
        icon: '📊',
      },
      {
        title: 'Multi-Org Management',
        description: 'Manage multiple organizations',
        href: '/dashboard/organizations/multi-org',
        icon: '🏢',
      },
    ],
  };

  const pageActions = [
    {
      label: 'Manage Organizations',
      action: () => {
        window.location.href = '/dashboard/organizations/list';
      },
      variant: 'primary' as const,
    },
    {
      label: 'View Analytics',
      action: () => {
        window.location.href = '/dashboard/analytics';
      },
      variant: 'secondary' as const,
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Organization Management"
          subtitle="Manage your organizations, members, and settings"
          actions={pageActions}
        />
 
        {/* Service Overview Metrics */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">🏢</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Organizations</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardData.metrics.totalOrganizations}</p>
                </div>
              </div>
            </div>
 
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">👑</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Managed Organizations</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">{dashboardData.metrics.managedOrganizations}</p>
                </div>
              </div>
            </div>
 
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">👥</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardData.metrics.totalMembers}</p>
                </div>
              </div>
            </div>
 
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">❤️</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Followers</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardData.metrics.totalFollowers}</p>
                </div>
              </div>
            </div>
 
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">📅</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Events</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardData.metrics.activeEvents}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
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

        {/* Recent Organizations */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
            <h3 className="text-base sm:text-lg font-medium text-foreground">Your Organizations</h3>
            <Link
              to="/console/organizations/list"
              className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium"
            >
              View all organizations →
            </Link>
          </div>
          
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Organization Name
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Your Role
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Events
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Followers
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {dashboardData.recentOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-muted/60">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{org.name}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-[11px] sm:text-xs font-semibold rounded-full ${
                          org.role === 'OWNER' ? 'bg-purple-100 text-purple-800' :
                          org.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {org.role}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">
                        {org.memberCount}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">
                        {org.eventCount}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-foreground">
                        {org.followerCount}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <Link
                          to={`/console/organizations/${org.id}`}
                          className="text-primary hover:text-primary/80 mr-3 sm:mr-4"
                        >
                          View
                        </Link>
                        {(org.role === 'OWNER' || org.role === 'ADMIN') && (
                          <Link
                            to={`/console/organizations/${org.id}/members`}
                            className="text-muted-foreground hover:text-foreground"
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
        <div className="bg-primary/5 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-primary mb-2">About Organization Management Service</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            The Organization Management Service provides comprehensive tools for managing your organizations,
            members, and organizational settings. Oversee multiple organizations, track analytics, and
            configure branding and policies from one centralized location.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-1">Member Management</h4>
              <p className="text-muted-foreground">Invite, manage, and assign roles to organization members with granular permissions.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Organization Settings</h4>
              <p className="text-muted-foreground">Configure branding, policies, and organizational preferences.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Analytics & Insights</h4>
              <p className="text-muted-foreground">Track organization growth, member activity, and event performance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationServiceDashboard;