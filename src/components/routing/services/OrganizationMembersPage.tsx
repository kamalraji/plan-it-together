import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import OrganizationAdminManagement from '../../organization/OrganizationAdminManagement';
import { useAuth } from '../../../hooks/useAuth';
import { useOrganizerOrganizations } from '@/hooks/useOrganizerOrganizations';

/**
 * OrganizationMembersPage provides AWS-style interface for organization member management.
 * Now backed by Supabase organizations via useOrganizerOrganizations and owner-based access control.
 */
export const OrganizationMembersPage: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { user } = useAuth();
  const { organizations, managedOrganizations, isLoadingOrganizations } = useOrganizerOrganizations();

  const organization = useMemo(
    () => organizations?.find((org) => org.id === organizationId) ?? null,
    [organizations, organizationId],
  );

  const managedOrg = useMemo(
    () => managedOrganizations.find((org) => org.id === organizationId) ?? null,
    [managedOrganizations, organizationId],
  );

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
          <p className="text-gray-600 mb-4">The organization you are looking for does not exist.</p>
          <Link
            to="/dashboard/organizations"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            ← Back to Organizations
          </Link>
        </div>
      </div>
    );
  }

  // Only owners can manage members from this console
  if (!managedOrg || !user) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to manage members for this organization.
          </p>
          <Link
            to={`/dashboard/organizations/${organization.id}`}
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
      action: () => {
        window.location.href = `/dashboard/organizations/${organization.id}`;
      },
      variant: 'secondary' as const,
    },
    {
      label: 'Organization Settings',
      action: () => {
        window.location.href = `/dashboard/organizations/${organization.id}/settings`;
      },
      variant: 'secondary' as const,
    },
  ];

  const breadcrumbs = [
    { label: 'Organizations', href: '/dashboard/organizations' },
    { label: organization.name, href: `/dashboard/organizations/${organization.id}` },
    { label: 'Members', href: `/dashboard/organizations/${organization.id}/members` },
  ];

  const handleUpdate = () => {
    // Placeholder for refresh after member changes; data is driven by Supabase hooks now.
  };

  const organizationForAdmin: any = {
    ...organization,
    role: 'OWNER',
    memberCount: 0,
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Member Management"
          subtitle={`Manage members and roles for ${organization.name}`}
          breadcrumbs={breadcrumbs}
          actions={pageActions}
        />

        <div className="mt-8">
          <OrganizationAdminManagement
            organization={organizationForAdmin}
            currentUser={user}
            onUpdate={handleUpdate}
          />
        </div>


        {/* Existing member management helper content remains unchanged */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Member Statistics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Member Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Total Members</span>
                <span className="text-lg font-semibold text-gray-900">0</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Owners</span>
                <span className="text-lg font-semibold text-purple-600">1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Admins</span>
                <span className="text-lg font-semibold text-blue-600">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Members</span>
                <span className="text-lg font-semibold text-gray-600">11</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📧</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Bulk Invite Members</h4>
                    <p className="text-sm text-gray-600">Invite multiple members at once via CSV upload</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">📊</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Member Activity Report</h4>
                    <p className="text-sm text-gray-600">Generate report of member activity and engagement</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">⚙️</span>
                  <div>
                    <h4 className="font-medium text-gray-900">Role Permissions</h4>
                    <p className="text-sm text-gray-600">Configure permissions for different member roles</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Member Management Tips */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Member Management Best Practices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Role Assignment</h4>
              <p className="text-blue-700">
                Assign roles based on responsibilities. Owners have full access, Admins can manage
                events and members, Members have basic access.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Regular Reviews</h4>
              <p className="text-blue-700">
                Regularly review member access and remove inactive members to maintain security and
                organization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationMembersPage;
