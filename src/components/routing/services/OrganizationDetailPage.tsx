import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { ResourceDetailPage } from '../ResourceDetailPage';
import OrganizationPage from '../../organization/OrganizationPage';
import { useAuth } from '../../../hooks/useAuth';
import { useOrganizerOrganizations } from '@/hooks/useOrganizerOrganizations';
import { useMyOrganizationMemberships } from '@/hooks/useOrganization';
import MembershipBadge from '@/components/organization/MembershipBadge';

/**
 * OrganizationDetailPage provides AWS-style resource detail interface for organizations.
 * Now backed by real Supabase data via useOrganizerOrganizations.
 */
export const OrganizationDetailPage: React.FC = () => {
  const { organizationId, orgSlug } = useParams<{ organizationId: string; orgSlug?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { organizations, perOrgAnalytics, isLoadingOrganizations } = useOrganizerOrganizations();
  const { data: myMemberships } = useMyOrganizationMemberships();

  const organization = useMemo(
    () => organizations?.find((org) => org.id === organizationId) ?? null,
    [organizations, organizationId],
  );

  const analytics = organization ? perOrgAnalytics[organization.id] : undefined;

  const membership = useMemo(
    () =>
      (myMemberships || []).find((m: any) => m.organization_id === organization?.id) ?? null,
    [myMemberships, organization?.id],
  );

  const isOwner = !!(organization && user && organization.owner_id === user.id);

  const membershipRole = (membership?.role as any) || (isOwner ? 'OWNER' : 'VIEWER');
  const membershipStatus = (membership?.status as any) || (isOwner ? 'ACTIVE' : 'UNKNOWN');

  const userRole: 'OWNER' | 'MEMBER' = membershipRole === 'OWNER' || isOwner ? 'OWNER' : 'MEMBER';

  if (isLoadingOrganizations && !organizations) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8" />
            <div className="h-64 bg-gray-200 rounded" />
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
          <p className="text-gray-600 mb-4">
            The organization you are looking for does not exist or you do not have access.
          </p>
          <Link
            to="/dashboard/organizations"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Back to Organizations
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
          organizationId={organization.id}
          currentUser={user ?? undefined}
        />
      ),
    },
    {
      id: 'members',
      label: 'Members',
      badge: 0,
      component: () => (
        <div className="p-6">
          <p className="text-gray-600">
            Member management interface is available on the Member Management page.
          </p>
          <Link
            to={`/dashboard/organizations/${organization.id}/members`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-500 font-medium"
          >
            Go to Member Management
          </Link>
        </div>
      ),
      roles: ['OWNER'],
    },
    {
      id: 'settings',
      label: 'Settings',
      component: () => (
        <div className="p-6">
          <p className="text-gray-600">
            Organization settings interface is available on the Settings page.
          </p>
          <Link
            to={`/dashboard/organizations/${organization.id}/settings`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-500 font-medium"
          >
            Go to Organization Settings
          </Link>
        </div>
      ),
      roles: ['OWNER'],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      component: () => (
        <div className="p-6 space-y-4">
          <p className="text-gray-600">
            View high-level analytics for this organization or open the full analytics dashboard.
          </p>
          {analytics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500">Total Events</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{analytics.totalEvents}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500">Published</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{analytics.publishedEvents}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500">Ongoing</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{analytics.ongoingEvents}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500">Completed</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{analytics.completedEvents}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No analytics data available yet.</p>
          )}
          <Link
            to={`/dashboard/organizations/${organization.id}/analytics`}
            className="inline-block text-blue-600 hover:text-blue-500 font-medium"
          >
            Open Analytics Dashboard
          </Link>
        </div>
      ),
      roles: ['OWNER'],
    },
  ];

  // Use org-scoped paths when available
  const basePath = orgSlug ? `/${orgSlug}` : `/dashboard/organizations/${organization.id}`;
  
  const actions = [
    {
      label: 'Manage Members',
      action: () => navigate(`${basePath}/settings/members`),
      variant: 'primary' as const,
      roles: ['OWNER'],
    },
    {
      label: 'View Analytics',
      action: () => navigate(`${basePath}/analytics`),
      variant: 'secondary' as const,
      roles: ['OWNER'],
    },
    {
      label: 'Organization Settings',
      action: () => navigate(`${basePath}/settings`),
      variant: 'secondary' as const,
      roles: ['OWNER'],
    },
  ];

  const filteredActions = actions.filter((action) => !action.roles || action.roles.includes(userRole));
  const filteredTabs = tabs.filter((tab) => !tab.roles || tab.roles.includes(userRole));

  const breadcrumbs = [
    { label: 'Organizations', href: '/dashboard/organizations' },
    { label: organization.name, href: `/dashboard/organizations/${organization.id}` },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title={organization.name}
          subtitle={`Category: ${organization.category}`}
          breadcrumbs={breadcrumbs}
          actions={filteredActions}
        />

        <div className="mb-4">
          <MembershipBadge role={membershipRole} status={membershipStatus} />
        </div>

        <ResourceDetailPage
          title={organization.name}
          resourceId={organization.id}
          resourceType="organization"
          tabs={filteredTabs}
          actions={filteredActions}
        />
      </div>
    </div>
  );
};

export default OrganizationDetailPage;
