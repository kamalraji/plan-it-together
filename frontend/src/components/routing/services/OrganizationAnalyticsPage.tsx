import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { OrganizationAnalyticsDashboard } from '../../organization/OrganizationAnalyticsDashboard';
import { useAuth } from '../../../hooks/useAuth';

/**
 * OrganizationAnalyticsPage provides AWS-style interface for organization analytics.
 * Features:
 * - Comprehensive analytics dashboard
 * - Export functionality for reports
 * - Date range filtering
 * - Integration with existing OrganizationAnalyticsDashboard component
 */
export const OrganizationAnalyticsPage: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  useAuth();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real implementation, this would come from API
    const mockOrganization = {
      id: organizationId,
      name: 'Tech Innovation Hub',
      category: 'COMPANY',
      role: 'OWNER',
      description: 'Leading technology innovation and startup acceleration',
    };

    setTimeout(() => {
      setOrganization(mockOrganization);
      setLoading(false);
    }, 500);
  }, [organizationId]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Not Found</h2>
          <p className="text-gray-600 mb-4">The organization you are looking for does not exist.</p>
          <Link
            to="/console/organizations"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            ← Back to Organizations
          </Link>
        </div>
      </div>
    );
  }

  // Check if user has permission to view analytics
  const canViewAnalytics = organization.role === 'OWNER' || organization.role === 'ADMIN';

  if (!canViewAnalytics) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to view analytics for this organization.</p>
          <Link
            to={`/console/organizations/${organizationId}`}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            ← Back to Organization
          </Link>
        </div>
      </div>
    );
  }

  const pageActions = [
    {
      label: 'View Organization',
      action: () => { window.location.href = `/console/organizations/${organizationId}`; },
      variant: 'secondary' as const,
    },
    {
      label: 'Manage Members',
      action: () => { window.location.href = `/console/organizations/${organizationId}/members`; },
      variant: 'secondary' as const,
    },
    {
      label: 'Organization Settings',
      action: () => { window.location.href = `/console/organizations/${organizationId}/settings`; },
      variant: 'secondary' as const,
    },
  ];

  const breadcrumbs = [
    { label: 'Organizations', href: '/console/organizations' },
    { label: organization.name, href: `/console/organizations/${organizationId}` },
    { label: 'Analytics', href: `/console/organizations/${organizationId}/analytics` },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Organization Analytics"
          subtitle={`Performance insights and metrics for ${organization.name}`}
          breadcrumbs={breadcrumbs}
          actions={pageActions}
        />

        <div className="mt-8">
          <OrganizationAnalyticsDashboard organizationId={organizationId!} />
        </div>

        {/* Additional Analytics Features */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Insights */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Insights</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Growth Rate</span>
                <span className="text-sm font-medium text-green-600">+12.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Engagement Score</span>
                <span className="text-sm font-medium text-blue-600">8.4/10</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Event Success Rate</span>
                <span className="text-sm font-medium text-purple-600">94%</span>
              </div>
            </div>
          </div>

          {/* Top Events */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Events</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 truncate">Tech Innovation Summit</span>
                <span className="text-sm text-gray-600">156 attendees</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 truncate">AI Workshop Series</span>
                <span className="text-sm text-gray-600">89 attendees</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 truncate">Startup Pitch Night</span>
                <span className="text-sm text-gray-600">67 attendees</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-gray-600">New follower:</span>
                <span className="text-gray-900 ml-1">John Doe</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Event published:</span>
                <span className="text-gray-900 ml-1">AI Workshop</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Member joined:</span>
                <span className="text-gray-900 ml-1">Jane Smith</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Tips */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Analytics Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Growth Tracking</h4>
              <p className="text-blue-700">Monitor follower growth and engagement trends to understand your organization's reach and impact.</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Event Performance</h4>
              <p className="text-blue-700">Track event attendance and engagement to optimize future event planning and marketing strategies.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationAnalyticsPage;