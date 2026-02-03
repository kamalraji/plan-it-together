import React from 'react';
import { useOrganizationAnalytics } from '@/hooks/useOrganization';

interface OrganizationAnalyticsDashboardProps {
  organizationId: string;
}

export const OrganizationAnalyticsDashboard: React.FC<OrganizationAnalyticsDashboardProps> = ({ 
  organizationId,
}) => {
  const { data, isLoading, error, refetch } = useOrganizationAnalytics(organizationId);

  const formatNumber = (num: number) => new Intl.NumberFormat().format(num || 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="h-5 w-5 text-red-400" aria-hidden="true">!</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
            <p className="mt-1 text-sm text-red-700">{(error as Error).message}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm text-red-800 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="h-6 w-6 text-gray-400" aria-hidden="true">📅</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatNumber(data.totalEvents)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="h-6 w-6 text-gray-400" aria-hidden="true">✅</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Events</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatNumber(data.activeEvents)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="h-6 w-6 text-gray-400" aria-hidden="true">👥</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Registrations</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatNumber(data.totalRegistrations)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="h-6 w-6 text-gray-400" aria-hidden="true">⭐</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Followers</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatNumber(data.followerCount)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for future detailed charts */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Trends and insights</h3>
        <p className="text-sm text-gray-500">
          Detailed charts (registrations over time, attendance rates, follower growth) can be added here using
          the existing analytics data structure in the backend as it evolves.
        </p>
      </div>
    </div>
  );
};

export default OrganizationAnalyticsDashboard;