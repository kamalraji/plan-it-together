import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { ResourceListPage } from '../ResourceListPage';

interface OrganizationListPageProps {
  filterBy?: 'all' | 'managed' | 'member';
}

/**
 * OrganizationListPage provides AWS-style resource list interface for organizations.
 * Features:
 * - Table view with filtering and sorting
 * - Bulk actions for organization management
 * - Search and filter capabilities
 * - Role-based access controls
 */
export const OrganizationListPage: React.FC<OrganizationListPageProps> = ({ 
  filterBy = 'all' 
}) => {
  // Mock data - in real implementation, this would come from API
  const organizations = [
    {
      id: '1',
      name: 'Tech Innovation Hub',
      category: 'COMPANY',
      role: 'OWNER',
      memberCount: 15,
      eventCount: 12,
      followerCount: 456,
      verificationStatus: 'VERIFIED',
      lastActivity: '2024-01-15T10:30:00Z',
      description: 'Leading technology innovation and startup acceleration',
    },
    {
      id: '2',
      name: 'Startup Accelerator',
      category: 'INDUSTRY',
      role: 'ADMIN',
      memberCount: 8,
      eventCount: 5,
      followerCount: 234,
      verificationStatus: 'PENDING',
      lastActivity: '2024-01-14T15:45:00Z',
      description: 'Supporting early-stage startups with mentorship and funding',
    },
    {
      id: '3',
      name: 'AI Research Collective',
      category: 'COLLEGE',
      role: 'MEMBER',
      memberCount: 24,
      eventCount: 18,
      followerCount: 1144,
      verificationStatus: 'VERIFIED',
      lastActivity: '2024-01-13T09:15:00Z',
      description: 'Advancing artificial intelligence research and education',
    },
    {
      id: '4',
      name: 'Green Energy Initiative',
      category: 'NON_PROFIT',
      role: 'MEMBER',
      memberCount: 32,
      eventCount: 7,
      followerCount: 678,
      verificationStatus: 'VERIFIED',
      lastActivity: '2024-01-12T14:20:00Z',
      description: 'Promoting sustainable energy solutions and environmental awareness',
    },
  ];

  const filteredOrganizations = organizations.filter(org => {
    if (filterBy === 'managed') return org.role === 'OWNER' || org.role === 'ADMIN';
    if (filterBy === 'member') return org.role === 'MEMBER';
    return true;
  });

  const columns = [
    {
      key: 'name',
      label: 'Organization Name',
      sortable: true,
      filterable: true,
      render: (_value: string, record: any) => (
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
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {record.description}
            </div>
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
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'COMPANY' ? 'bg-purple-100 text-purple-800' :
          value === 'COLLEGE' ? 'bg-blue-100 text-blue-800' :
          value === 'INDUSTRY' ? 'bg-green-100 text-green-800' :
          value === 'NON_PROFIT' ? 'bg-orange-100 text-orange-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Your Role',
      sortable: true,
      filterable: true,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'OWNER' ? 'bg-purple-100 text-purple-800' :
          value === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
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
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'VERIFIED' ? 'bg-green-100 text-green-800' :
          value === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      filterable: false,
      render: (_value: any, record: any) => (
        <div className="flex space-x-2">
          <Link
            to={`/console/organizations/${record.id}`}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            View
          </Link>
          {(record.role === 'OWNER' || record.role === 'ADMIN') && (
            <>
              <Link
                to={`/console/organizations/${record.id}/members`}
                className="text-gray-600 hover:text-gray-500 text-sm font-medium"
              >
                Members
              </Link>
              <Link
                to={`/console/organizations/${record.id}/settings`}
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
        { value: 'ADMIN', label: 'Admin' },
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
      action: (selectedItems: any[]) => {
        console.log('Exporting organizations:', selectedItems);
      },
    },
    {
      label: 'View Analytics',
      action: (selectedItems: any[]) => {
        console.log('Viewing analytics for organizations:', selectedItems);
      },
    },
  ];

  const pageActions = [
    {
      label: 'View Analytics',
      action: () => window.location.href = '/console/analytics',
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
        />
      </div>
    </div>
  );
};

export default OrganizationListPage;