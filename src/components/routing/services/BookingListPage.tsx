import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MagnifyingGlassIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '../PageHeader';
import OrganizerBookingsManager from '../../organizer/OrganizerBookingsManager';

/**
 * BookingListPage provides AWS-style booking management interface for the marketplace.
 * Features:
 * - Booking request management
 * - Status tracking and updates
 * - Communication with vendors
 * - Integration with existing BookingManagementUI component
 * - AWS-style page layout with consistent header and actions
 */
export const BookingListPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId?: string }>();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const pageActions = [
    {
      label: 'Browse Services',
      action: () => { window.location.href = '/console/marketplace/services'; },
      icon: MagnifyingGlassIcon,
      variant: 'primary' as const,
    },
    {
      label: 'Vendor Dashboard',
      action: () => { window.location.href = '/console/marketplace/vendors'; },
      icon: BuildingStorefrontIcon,
      variant: 'secondary' as const,
    },
  ];

  const breadcrumbs = [
    { label: 'Marketplace', href: '/console/marketplace' },
    { label: 'Bookings', href: '/console/marketplace/bookings' },
  ];

  if (bookingId) {
    breadcrumbs.push({
      label: `Booking ${bookingId}`,
      href: `/console/marketplace/bookings/${bookingId}`,
    });
  }

  const filters = [
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'ALL', label: 'All Statuses' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'VENDOR_REVIEWING', label: 'Vendor Reviewing' },
        { value: 'QUOTE_SENT', label: 'Quote Sent' },
        { value: 'QUOTE_ACCEPTED', label: 'Quote Accepted' },
        { value: 'CONFIRMED', label: 'Confirmed' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' },
        { value: 'DISPUTED', label: 'Disputed' },
      ],
    },
  ];

  const getPageTitle = () => {
    if (bookingId) {
      return `Booking Details - ${bookingId}`;
    }
    return 'My Bookings';
  };

  const getPageSubtitle = () => {
    if (bookingId) {
      return 'View and manage this booking request';
    }
    return 'Manage your service bookings and communicate with vendors';
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
          breadcrumbs={breadcrumbs}
          actions={pageActions}
          filters={filters}
        />

        {/* Booking Status Overview */}
        {!bookingId && (
          <div className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { status: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
                { status: 'QUOTE_SENT', label: 'Quote Sent', color: 'bg-blue-100 text-blue-800', icon: '💰' },
                { status: 'CONFIRMED', label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: '✅' },
                { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: '🔄' },
                { status: 'COMPLETED', label: 'Completed', color: 'bg-gray-100 text-gray-800', icon: '🎉' },
              ].map((item) => (
                <button
                  key={item.status}
                  onClick={() => setStatusFilter(item.status)}
                  className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    statusFilter === item.status
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-2xl">{item.icon}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.color}`}>
                      {item.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Booking Management Interface */}
        <div className="rounded-lg">
          <OrganizerBookingsManager />
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Management Tips</h3>
          <p className="text-gray-600 mb-4">
            Manage your service bookings effectively to ensure smooth event planning and vendor coordination.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">📋 Track Status</h4>
              <p className="text-gray-600">Monitor booking progress from initial request to completion.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">💬 Communicate</h4>
              <p className="text-gray-600">Use the built-in messaging system to coordinate with vendors.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">⭐ Review</h4>
              <p className="text-gray-600">Leave reviews after service completion to help other organizers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingListPage;