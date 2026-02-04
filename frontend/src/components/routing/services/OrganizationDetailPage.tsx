import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { ResourceDetailPage } from '../ResourceDetailPage';
import OrganizationPage from '../../organization/OrganizationPage';
import { useAuth } from '../../../hooks/useAuth';

/**
 * OrganizationDetailPage provides AWS-style resource detail interface for organizations.
 * Features:
 * - Tabbed content with organization details, events, and analytics
 * - Resource actions for organization management
 * - Integration with existing OrganizationPage component
 * - Role-based access controls
 */
export const OrganizationDetailPage: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real implementation, this would come from API
    const mockOrganization = {
      id: organizationId,
      name: 'Tech Innovation Hub',
      category: 'COMPANY',
      role: 'OWNER',
      memberCount: 15,
      eventCount: 12,
      followerCount: 456,
      verificationStatus: 'VERIFIED',
      description: 'Leading technology innovation and startup acceleration',
      branding: {
        logoUrl: null,
        bannerUrl: null,
      },
      socialLinks: {
        website: 'https://techinnovationhub.com',
        linkedin: 'https://linkedin.com/company/tech-innovation-hub',
      },
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

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      component: () => (
        <OrganizationPage 
          organizationId={organizationId!} 
          currentUser={user ?? undefined} 
        />
      ),
    },
    {
      id: 'members',
      label: 'Members',
      badge: organization.memberCount,
      component: () => (
        <div className="p-6">
          <p className="text-gray-600">Member management interface would be displayed here.</p>
          <Link
            to={`/console/organizations/${organizationId}/members`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-500 font-medium"
          >
            Go to Member Management →
          </Link>
        </div>
      ),
      roles: ['OWNER', 'ADMIN'],
    },
    {
      id: 'settings',
      label: 'Settings',
      component: () => (
        <div className="p-6">
          <p className="text-gray-600">Organization settings interface would be displayed here.</p>
          <Link
            to={`/console/organizations/${organizationId}/settings`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-500 font-medium"
          >
            Go to Organization Settings →
          </Link>
        </div>
      ),
      roles: ['OWNER', 'ADMIN'],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      component: () => (
        <div className="p-6">
          <p className="text-gray-600">Organization analytics interface would be displayed here.</p>
          <Link
            to={`/console/organizations/${organizationId}/analytics`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-500 font-medium"
          >
            Go to Analytics Dashboard →
          </Link>
        </div>
      ),
      roles: ['OWNER', 'ADMIN'],
    },
  ];

  const actions = [
    {
      label: 'Manage Members',
      action: () => { window.location.href = `/console/organizations/${organizationId}/members`; },
      variant: 'primary' as const,
      roles: ['OWNER', 'ADMIN'],
    },
    {
      label: 'View Analytics',
      action: () => { window.location.href = `/console/organizations/${organizationId}/analytics`; },
      variant: 'secondary' as const,
      roles: ['OWNER', 'ADMIN'],
    },
    {
      label: 'Organization Settings',
      action: () => { window.location.href = `/console/organizations/${organizationId}/settings`; },
      variant: 'secondary' as const,
      roles: ['OWNER', 'ADMIN'],
    },
  ];

  // Filter actions and tabs based on user role
  const userRole = organization.role;
  const filteredActions = actions.filter(action => 
    !action.roles || action.roles.includes(userRole)
  );
  const filteredTabs = tabs.filter(tab => 
    !tab.roles || tab.roles.includes(userRole)
  );

  const breadcrumbs = [
    { label: 'Organizations', href: '/console/organizations' },
    { label: organization.name, href: `/console/organizations/${organizationId}` },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title={organization.name}
          subtitle={organization.description}
          breadcrumbs={breadcrumbs}
          actions={filteredActions}
        />

        <ResourceDetailPage
          title={organization.name}
          resourceId={organizationId!}
          resourceType="organization"
          tabs={filteredTabs}
          actions={filteredActions}
        />
      </div>
    </div>
  );
};

export default OrganizationDetailPage;