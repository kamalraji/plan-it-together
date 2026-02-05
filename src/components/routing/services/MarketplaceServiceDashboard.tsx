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
        title: 'Browse Public Marketplace',
        description: 'Visit the customer-facing marketplace to discover services',
        href: '/marketplace',
        icon: '🏪',
        primary: true,
      },
      {
        title: 'Vendor Dashboard',
        description: 'Comprehensive vendor management and analytics',
        href: '/marketplace/vendor',
        icon: '🏢',
      },
      {
        title: 'Manage Bookings',
        description: 'View and manage your service bookings',
        href: '/marketplace/bookings',
        icon: '📋',
      },
      {
        title: 'Analytics & Reports',
        description: 'View marketplace performance metrics',
        href: '/marketplace/analytics',
        icon: '📈',
      },
    ],
  };

  const pageActions = [
    {
      label: 'Visit Marketplace',
      action: () => { window.location.href = '/marketplace'; },
      variant: 'primary' as const,
    },
    {
      label: 'Manage Bookings',
      action: () => { window.location.href = '/marketplace/bookings'; },
      variant: 'secondary' as const,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-success/20 text-success';
      case 'QUOTE_SENT':
        return 'bg-info/20 text-info';
      case 'IN_PROGRESS':
        return 'bg-primary/20 text-primary';
      case 'PENDING':
        return 'bg-warning/20 text-warning';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Marketplace"
          subtitle="Discover and book services from verified vendors"
          actions={pageActions}
        />
 
        {/* Welcome Message */}
        {user && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm">
            <p className="text-emerald-800">
              Welcome to the marketplace, <span className="font-semibold">{user.name}</span>! Explore
              services from our verified vendors.
            </p>
          </div>
        )}
 
        {/* Service Overview Metrics */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">🛍️</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Services</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{dashboardData.metrics.totalServices}</p>
                </div>
              </div>
            </div>
 
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">🏪</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Vendors</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">{dashboardData.metrics.activeVendors}</p>
                </div>
              </div>
            </div>
 
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">⏳</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending Bookings</p>
                  <p className="text-xl sm:text-2xl font-bold text-warning">{dashboardData.metrics.pendingBookings}</p>
                </div>
              </div>
            </div>
 
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">✅</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Completed Bookings</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-500">{dashboardData.metrics.completedBookings}</p>
                </div>
              </div>
            </div>
 
            <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-xl sm:text-2xl">💰</span>
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">
                    ${dashboardData.metrics.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
 
        {/* Quick Actions */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-medium text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {dashboardData.quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className={`block p-4 sm:p-6 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  action.primary
                    ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                    : 'border-border bg-card hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                  <span className="text-xl sm:text-2xl">{action.icon}</span>
                  <h4
                    className={`text-sm sm:text-base font-medium ${
                      action.primary ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {action.title}
                  </h4>
                </div>
                <p
                  className={`text-xs sm:text-sm ${
                    action.primary ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Recent Bookings */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
              <h3 className="text-base sm:text-lg font-medium text-foreground">Recent Bookings</h3>
              <Link
                to="/marketplace/bookings"
                className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium"
              >
                View all bookings →
              </Link>
            </div>
 
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {dashboardData.recentBookings.map((booking) => (
                  <div key={booking.id} className="p-4 sm:p-5 hover:bg-muted/60">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <h4 className="text-sm font-medium text-foreground">{booking.serviceName}</h4>
                      <span
                        className={`inline-flex px-2 py-1 text-[11px] sm:text-xs font-semibold rounded-full ${getStatusColor(
                          booking.status,
                        )}`}
                      >
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                      {booking.vendorName}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                      Event: {booking.eventName}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(booking.serviceDate).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        ${booking.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
 
          {/* Top Categories */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
              <h3 className="text-base sm:text-lg font-medium text-foreground">Top Service Categories</h3>
              <Link
                to="/marketplace/services"
                className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium"
              >
                Browse all services →
              </Link>
            </div>
 
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {dashboardData.topCategories.map((category, index) => (
                  <div key={category.category} className="p-4 sm:p-5 hover:bg-muted/60">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <h4 className="text-sm font-medium text-foreground">
                        {category.category
                          .replace('_', ' ')
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </h4>
                      <span className="text-xs sm:text-sm text-muted-foreground">#{index + 1}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {category.count} services
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-foreground">
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
        <div className="bg-primary/5 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-primary mb-2">About Marketplace Service</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            The Marketplace Service connects event organizers with verified vendors offering professional services.
            From venue booking to catering, photography, and technical support - find everything you need for successful
            events.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-1">Service Discovery</h4>
              <p className="text-muted-foreground">
                Browse and filter services by category, location, and budget to find the perfect match.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Booking Management</h4>
              <p className="text-muted-foreground">
                Request quotes, communicate with vendors, and manage bookings all in one place.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Vendor Network</h4>
              <p className="text-muted-foreground">
                Access a curated network of verified vendors with ratings and reviews from other organizers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
