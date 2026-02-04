import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { ResourceListPage } from '../ResourceListPage';
import { useOrganizerOrganizations } from '@/hooks/useOrganizerOrganizations';
import { useMyOrganizationMemberships } from '@/hooks/useOrganization';
import MembershipBadge from '@/components/organization/MembershipBadge';

interface OrganizationListPageProps {
  filterBy?: 'all' | 'managed' | 'member';
}

interface OrganizationListRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  role: 'OWNER' | 'ADMIN' | 'ORGANIZER' | 'VIEWER' | 'UNKNOWN';
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REMOVED' | 'UNKNOWN';
  memberCount: number;
  eventCount: number;
  followerCount: number;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  lastActivity: string;
  description?: string | null;
}

/**
 * OrganizationListPage provides AWS-style resource list interface for organizations.
 * The mock data has been replaced with Supabase-backed organizations via
 * useOrganizerOrganizations, and actions are constrained to owned organizations.
 */
export const OrganizationListPage: React.FC<OrganizationListPageProps> = ({
  filterBy = 'all',
}) => {
  const {
    organizations,
    managedOrganizations,
    perOrgAnalytics,
    isLoadingOrganizations,
    isLoadingEvents,
  } = useOrganizerOrganizations();

  const { data: myMemberships } = useMyOrganizationMemberships();

  const organizationsWithMetrics: OrganizationListRow[] = useMemo(() => {
    if (!organizations) return [];

    return organizations.map((org) => {
      const isManaged = managedOrganizations.some((m) => m.id === org.id);
      const analytics = perOrgAnalytics[org.id] ?? {
        totalEvents: 0,
      };

      const membership = (myMemberships || []).find(
        (m: any) => m.organization_id === org.id,
      );

      const role = (membership?.role as OrganizationListRow['role'])
        || (isManaged ? 'OWNER' : 'VIEWER');
      const status = (membership?.status as OrganizationListRow['status'])
        || (isManaged ? 'ACTIVE' : 'UNKNOWN');

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        category: org.category,
        role,
        status,
        // These aggregates can be wired to real metrics once available
        memberCount: 0,
        eventCount: analytics.totalEvents,
        followerCount: 0,
        verificationStatus: 'VERIFIED',
        lastActivity: org.created_at,
        // description is not part of OrganizerOrganizationRow currently
        description: null,
      };
    });
  }, [organizations, managedOrganizations, perOrgAnalytics, myMemberships]);

  const filteredOrganizations = useMemo(() => {
    if (filterBy === 'managed') {
      return organizationsWithMetrics.filter((org) =>
        ['OWNER', 'ADMIN', 'ORGANIZER'].includes(org.role),
      );
    }
    if (filterBy === 'member') {
      return organizationsWithMetrics.filter((org) => org.status === 'ACTIVE');
    }
    return organizationsWithMetrics;
  }, [filterBy, organizationsWithMetrics]);

  const columns = [
    {
      key: 'name',
      label: 'Organization Name',
      sortable: true,
      filterable: true,
      render: (_value: string, record: OrganizationListRow) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-lg bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {record.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{record.name}</div>
            {record.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {record.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value === 'COMPANY'
              ? 'bg-purple-100 text-purple-800'
              : value === 'COLLEGE'
              ? 'bg-blue-100 text-blue-800'
              : value === 'INDUSTRY'
              ? 'bg-green-100 text-green-800'
              : value === 'NON_PROFIT'
              ? 'bg-orange-100 text-orange-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Your Role',
      sortable: true,
      filterable: true,
      render: (_value: string, record: OrganizationListRow) => (
        <MembershipBadge role={record.role} status={record.status} />
      ),
    },
    {
      key: 'memberCount',
      label: 'Members',
      sortable: true,
      filterable: false,
      render: (value: number) => (
        <span className="text-sm text-gray-900">{value}</span>
      ),
    },
    {
      key: 'eventCount',
      label: 'Events',
      sortable: true,
      filterable: false,
      render: (value: number) => (
        <span className="text-sm text-gray-900">{value}</span>
      ),
    },
    {
      key: 'followerCount',
      label: 'Followers',
      sortable: true,
      filterable: false,
      render: (value: number) => (
        <span className="text-sm text-gray-900">{value.toLocaleString()}</span>
      ),
    },
    {
      key: 'verificationStatus',
      label: 'Status',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value === 'VERIFIED'
              ? 'bg-green-100 text-green-800'
              : value === 'PENDING'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      filterable: false,
      render: (_value: any, record: OrganizationListRow) => (
        <div className="flex space-x-2">
          <Link
            to={`/${record.slug}/organizations`}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            View
          </Link>
          {record.role === 'OWNER' && (
            <>
              <Link
                to={`/${record.slug}/organizations/members`}
                className="text-gray-600 hover:text-gray-500 text-sm font-medium"
              >
                Members
              </Link>
              <Link
                to={`/${record.slug}/organizations/settings`}
                className="text-gray-600 hover:text-gray-500 text-sm font-medium"
              >
                Settings
              </Link>
            </>
          )}
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: 'category',
      label: 'Category',
      type: 'select' as const,
      options: [
        { value: 'COMPANY', label: 'Company' },
        { value: 'COLLEGE', label: 'College' },
        { value: 'INDUSTRY', label: 'Industry' },
        { value: 'NON_PROFIT', label: 'Non-Profit' },
      ],
    },
    {
      key: 'role',
      label: 'Your Role',
      type: 'select' as const,
      options: [
        { value: 'OWNER', label: 'Owner' },
        { value: 'MEMBER', label: 'Member' },
      ],
    },
    {
      key: 'verificationStatus',
      label: 'Verification Status',
      type: 'select' as const,
      options: [
        { value: 'VERIFIED', label: 'Verified' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'UNVERIFIED', label: 'Unverified' },
      ],
    },
  ];

  const bulkActions = [
    {
      label: 'Export Selected',
      action: (selectedItems: OrganizationListRow[]) => {
        // This is read-only and safe for any role
        console.log('Exporting organizations:', selectedItems.map((i) => i.id));
      },
    },
    {
      label: 'View Analytics',
      action: (selectedItems: OrganizationListRow[]) => {
        const manageable = selectedItems.filter((i) =>
          ['OWNER', 'ADMIN', 'ORGANIZER'].includes(i.role),
        );
        console.log(
          'Viewing analytics for manageable organizations:',
          manageable.map((i) => i.id),
        );
      },
    },
  ];

  const pageActions = [
    {
      label: 'View Analytics',
      action: () => {
        window.location.href = '/console/analytics';
      },
      variant: 'secondary' as const,
    },
    {
      label: 'Export All',
      action: () => console.log('Export all organizations'),
      variant: 'secondary' as const,
    },
  ];

  const getPageTitle = () => {
    switch (filterBy) {
      case 'managed':
        return 'Managed Organizations';
      case 'member':
        return 'Member Organizations';
      default:
        return 'All Organizations';
    }
  };

  const getPageSubtitle = () => {
    switch (filterBy) {
      case 'managed':
        return 'Organizations where you have administrative access';
      case 'member':
        return 'Organizations where you are a member';
      default:
        return 'All organizations you belong to';
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
          actions={pageActions}
        />

        <ResourceListPage
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
          resourceType="organization"
          data={filteredOrganizations}
          columns={columns}
          filters={filters}
          bulkActions={bulkActions}
          searchable={true}
          exportable={true}
          loading={isLoadingOrganizations || isLoadingEvents}
        />
      </div>
    </div>
  );
};

export default OrganizationListPage;
