import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PageHeader } from '../PageHeader';

/**
 * MarketplaceServiceDashboard provides the AWS-style service landing page for Marketplace Management.
 * Features:
 * - Service overview with key marketplace metrics
 * - Quick action buttons for common marketplace tasks
 * - Recent bookings and vendor activity
 * - Service-specific widgets and analytics
 * - Role-based interface (organizer vs vendor view)
 */
export const MarketplaceServiceDashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock data - in real implementation, this would come from API
  const dashboardData = {
    metrics: {
      totalServices: 156,
      activeVendors: 42,
      pendingBookings: 8,
      completedBookings: 234,
      totalRevenue: 125000,
    },
    recentBookings: [
      {
        id: '1',
        serviceName: 'Professional Photography Package',
        vendorName: 'Capture Moments Studio',
        eventName: 'Tech Innovation Summit 2024',
        status: 'CONFIRMED',
        serviceDate: '2024-03-15',
        amount: 2500,
      },
      {
        id: '2',
        serviceName: 'Premium Catering Service',
        vendorName: 'Gourmet Events Co.',
        eventName: 'AI Workshop Series',
        status: 'QUOTE_SENT',
        serviceDate: '2024-03-20',
        amount: 4200,
      },
      {
        id: '3',
        serviceName: 'Audio Visual Equipment',
        vendorName: 'TechSound Solutions',
        eventName: 'Startup Pitch Competition',
        status: 'IN_PROGRESS',
        serviceDate: '2024-02-28',
        amount: 1800,
      },
    ],
    topCategories: [
      { category: 'CATERING', count: 28, revenue: 45000 },
      { category: 'PHOTOGRAPHY', count: 22, revenue: 38000 },
      { category: 'VENUE', count: 18, revenue: 52000 },
      { category: 'AUDIO_VISUAL', count: 15, revenue: 22000 },
    ],
    quickActions: [
      {
        title: 'Comprehensive Marketplace',
        description: 'Access the full marketplace interface with all features',
        href: '/console/marketplace/marketplace',
        icon: '🏪',
        primary: true,
      },
      {
        title: 'Discover Services',
        description: 'Browse marketplace services for your events',
        href: '/console/marketplace/services',
        icon: '🔍',
      },
      {
        title: 'Vendor Dashboard',
        description: 'Comprehensive vendor management and analytics',
        href: '/console/marketplace/vendor',
        icon: '🏪',
      },
      {
        title: 'Manage Bookings',
        description: 'View and manage your service bookings',
        href: '/console/marketplace/bookings',
        icon: '📋',
      },
      {
        title: 'Analytics & Reports',
        description: 'View marketplace performance metrics',
        href: '/console/marketplace/analytics',
        icon: '📈',
      },
    ],
  };

  const pageActions = [
    {
      label: 'Browse Services',
      action: () => { window.location.href = '/console/marketplace/services'; },
      variant: 'primary' as const,
    },
    {
      label: 'Manage Bookings',
      action: () => { window.location.href = '/console/marketplace/bookings'; },
      variant: 'secondary' as const,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'QUOTE_SENT':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title="Marketplace"
          subtitle="Discover and book services from verified vendors"
          actions={pageActions}
        />

        {/* Welcome Message */}
        {user && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              Welcome to the marketplace, <span className="font-semibold">{user.name}</span>! 
              Explore services from our verified vendors.
            </p>
          </div>
        )}

        {/* Service Overview Metrics */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🛍️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Services</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.metrics.totalServices}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🏪</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboardData.metrics.activeVendors}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
                  <p className="text-2xl font-bold text-yellow-600">{dashboardData.metrics.pendingBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed Bookings</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardData.metrics.completedBookings}</p>
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
                  <p className="text-2xl font-bold text-purple-600">${dashboardData.metrics.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardData.quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className={`block p-6 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  action.primary
                    ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">{action.icon}</span>
                  <h4 className={`font-medium ${action.primary ? 'text-blue-900' : 'text-gray-900'}`}>
                    {action.title}
                  </h4>
                </div>
                <p className={`text-sm ${action.primary ? 'text-blue-700' : 'text-gray-600'}`}>
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Bookings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
              <Link
                to="/console/marketplace/bookings"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                View all bookings →
              </Link>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {dashboardData.recentBookings.map((booking) => (
                  <div key={booking.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{booking.serviceName}</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{booking.vendorName}</p>
                    <p className="text-sm text-gray-600 mb-1">Event: {booking.eventName}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {new Date(booking.serviceDate).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        ${booking.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Categories */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Top Service Categories</h3>
              <Link
                to="/console/marketplace/services"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Browse all services →
              </Link>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {dashboardData.topCategories.map((category, index) => (
                  <div key={category.category} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {category.category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                      <span className="text-sm text-gray-500">#{index + 1}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {category.count} services
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        ${category.revenue.toLocaleString()} revenue
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Service Information */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">About Marketplace Service</h3>
          <p className="text-blue-700 mb-4">
            The Marketplace Service connects event organizers with verified vendors offering professional services. 
            From venue booking to catering, photography, and technical support - find everything you need for successful events.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Service Discovery</h4>
              <p className="text-blue-700">Browse and filter services by category, location, and budget to find the perfect match.</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Booking Management</h4>
              <p className="text-blue-700">Request quotes, communicate with vendors, and manage bookings all in one place.</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Vendor Network</h4>
              <p className="text-blue-700">Access a curated network of verified vendors with ratings and reviews from other organizers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceServiceDashboard;