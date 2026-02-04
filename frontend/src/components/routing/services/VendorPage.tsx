import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { ServiceDashboard } from '../ServiceDashboard';
import { useAuth } from '../../../hooks/useAuth';

// Import existing vendor components
import VendorDashboard from '../../vendor/VendorDashboard';
import VendorAnalyticsDashboard from '../../vendor/VendorAnalyticsDashboard';
import ServiceListingManagement from '../../vendor/ServiceListingManagement';
import VendorBookingManagement from '../../vendor/VendorBookingManagement';

/**
 * VendorPage provides a comprehensive vendor management interface integrating existing components
 * with AWS Console-style navigation and layout patterns.
 * 
 * Features:
 * - Vendor profile and business management
 * - Service listing creation and management
 * - Booking request handling and coordination
 * - Performance analytics and customer reviews
 * - Revenue tracking and business insights
 */
export const VendorPage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId?: string }>();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'overview' | 'analytics' | 'services' | 'bookings' | 'profile'>('overview');

  const isOwnProfile = !vendorId || vendorId === user?.id;
  const currentVendorId = vendorId || user?.id || '';

  // Dashboard widgets for vendor overview
  const dashboardWidgets = [
    {
      id: 'vendor-metrics',
      type: 'metric' as const,
      title: 'Performance Overview',
      size: 'large' as const,
      data: {
        rating: 4.8,
        reviewCount: 127,
        responseTime: 2.5,
        completionRate: 98.5,
        totalBookings: 234,
        revenue: 125000,
      },
    },
    {
      id: 'recent-bookings',
      type: 'list' as const,
      title: 'Recent Booking Requests',
      size: 'medium' as const,
      data: {
        items: [
          { id: '1', title: 'Wedding Photography', client: 'Sarah Johnson', status: 'PENDING', date: '2024-03-15' },
          { id: '2', title: 'Corporate Event Catering', client: 'Tech Corp', status: 'CONFIRMED', date: '2024-03-20' },
          { id: '3', title: 'Birthday Party Setup', client: 'Mike Davis', status: 'QUOTE_SENT', date: '2024-03-25' },
        ],
      },
    },
    {
      id: 'service-performance',
      type: 'chart' as const,
      title: 'Service Performance',
      size: 'medium' as const,
      data: {
        services: ['Photography', 'Catering', 'Decoration', 'Audio/Visual'],
        bookings: [45, 32, 28, 15],
        revenue: [25000, 35000, 18000, 12000],
      },
    },
    {
      id: 'monthly-revenue',
      type: 'chart' as const,
      title: 'Monthly Revenue Trend',
      size: 'medium' as const,
      data: {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        revenue: [8500, 12000, 15500, 18000, 22000, 25000],
      },
    },
  ];

  const pageActions = [
    {
      label: 'Add Service',
      action: () => setActiveView('services'),
      variant: 'primary' as const,
    },
    {
      label: 'View Bookings',
      action: () => setActiveView('bookings'),
      variant: 'secondary' as const,
    },
    {
      label: 'Analytics',
      action: () => setActiveView('analytics'),
      variant: 'secondary' as const,
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'services', label: 'Service Listings', icon: '🛍️' },
    { id: 'bookings', label: 'Booking Management', icon: '📅' },
    { id: 'analytics', label: 'Analytics & Reports', icon: '📊' },
    { id: 'profile', label: 'Business Profile', icon: '🏪' },
  ];

  const breadcrumbs = [
    { label: 'Console', href: '/console' },
    { label: 'Marketplace', href: '/console/marketplace' },
    { label: 'Vendors', href: '/console/marketplace/vendors' },
  ];

  if (vendorId && !isOwnProfile) {
    breadcrumbs.push({
      label: `Vendor ${vendorId}`,
      href: `/console/marketplace/vendors/${vendorId}`,
    });
  }

  const getPageTitle = () => {
    if (isOwnProfile) {
      return 'My Vendor Dashboard';
    }
    return `Vendor Dashboard - ${vendorId}`;
  };

  const getPageSubtitle = () => {
    if (isOwnProfile) {
      return 'Manage your marketplace presence and track your business performance';
    }
    return 'View vendor profile and service offerings';
  };

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rating</p>
                    <p className="text-2xl font-bold text-yellow-600">4.8</p>
                    <p className="text-xs text-gray-500">127 reviews</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-blue-600">234</p>
                    <p className="text-xs text-gray-500">98.5% completion</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Response Time</p>
                    <p className="text-2xl font-bold text-green-600">2.5h</p>
                    <p className="text-xs text-gray-500">Average</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">$125K</p>
                    <p className="text-xs text-gray-500">This year</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor Dashboard Component */}
            <div className="bg-white rounded-lg border border-gray-200">
              <VendorDashboard userId={currentVendorId} />
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ServiceListingManagement vendorId={currentVendorId} />
            </div>
          </div>
        );

      case 'bookings':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <VendorBookingManagement vendorId={currentVendorId} />
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <VendorAnalyticsDashboard vendorId={currentVendorId} />
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Profile Management</h3>
              <p className="text-gray-600 mb-4">
                Manage your business information, verification status, and marketplace settings.
              </p>
              
              {/* Profile management would be implemented here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Business Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Business Name</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your Business Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe your business and services"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="business@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="tel"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <ServiceDashboard
            service="vendor"
            widgets={dashboardWidgets}
            layout={{
              columns: 2,
              rows: [
                { id: 'row-1', widgets: ['vendor-metrics'] },
                { id: 'row-2', widgets: ['recent-bookings', 'service-performance'] },
                { id: 'row-3', widgets: ['monthly-revenue'] },
              ],
              customizable: true,
            }}
          />
        );
    }
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
          tabs={tabs.map(tab => ({
            id: tab.id,
            label: tab.label,
            current: activeView === tab.id,
            onClick: () => setActiveView(tab.id as any),
          }))}
        />

        {/* Verification Status Banner */}
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Verified Vendor
                </p>
                <p className="text-sm text-green-700">
                  Your business has been verified and is eligible for premium marketplace features.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {renderContent()}
        </div>

        {/* Vendor Resources */}
        <div className="mt-8 bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-purple-900 mb-2">Vendor Success Resources</h3>
          <p className="text-purple-700 mb-4">
            Maximize your marketplace success with these tools and best practices designed for professional service providers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-purple-900 mb-1">📈 Performance Optimization</h4>
              <p className="text-purple-700">Track key metrics and optimize your response time and service quality.</p>
            </div>
            <div>
              <h4 className="font-medium text-purple-900 mb-1">📸 Professional Listings</h4>
              <p className="text-purple-700">Create compelling service listings with high-quality photos and detailed descriptions.</p>
            </div>
            <div>
              <h4 className="font-medium text-purple-900 mb-1">💬 Client Communication</h4>
              <p className="text-purple-700">Maintain professional communication and build lasting client relationships.</p>
            </div>
            <div>
              <h4 className="font-medium text-purple-900 mb-1">💰 Revenue Growth</h4>
              <p className="text-purple-700">Analyze booking patterns and pricing strategies to maximize your earnings.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPage;