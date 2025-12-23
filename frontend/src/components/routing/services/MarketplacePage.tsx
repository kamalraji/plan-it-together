import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { ServiceDashboard } from '../ServiceDashboard';
import { useAuth } from '../../../hooks/useAuth';
import { UserRole } from '../../../types';

// Import existing marketplace components
import ServiceDiscoveryUI from '../../marketplace/ServiceDiscoveryUI';
import BookingManagementUI from '../../marketplace/BookingManagementUI';
import ReviewRatingUI from '../../marketplace/ReviewRatingUI';
import VendorCoordination from '../../marketplace/VendorCoordination';
import EventMarketplaceIntegration from '../../marketplace/EventMarketplaceIntegration';

/**
 * MarketplacePage provides a comprehensive marketplace interface integrating existing components
 * with AWS Console-style navigation and layout patterns.
 * 
 * Features:
 * - Service discovery with advanced filtering
 * - Booking management and vendor coordination
 * - Event-specific marketplace integration
 * - Review and rating system
 * - Role-based interface customization
 */
export const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeView, setActiveView] = useState<'discover' | 'bookings' | 'vendors' | 'reviews' | 'integration'>('discover');

  // Extract eventId from URL params if present
  const urlParams = new URLSearchParams(location.search);
  const eventId = urlParams.get('eventId');
  const eventName = urlParams.get('eventName');

  const isVendor = user?.role === UserRole.ORGANIZER; // Using ORGANIZER as vendor role since VENDOR doesn't exist
  const isOrganizer = user?.role === UserRole.ORGANIZER;

  // Dashboard widgets configuration
  const dashboardWidgets = [
    {
      id: 'marketplace-metrics',
      type: 'metric' as const,
      title: 'Marketplace Overview',
      size: 'large' as const,
      data: {
        totalServices: 156,
        activeVendors: 42,
        pendingBookings: 8,
        completedBookings: 234,
      },
    },
    {
      id: 'recent-bookings',
      type: 'list' as const,
      title: 'Recent Bookings',
      size: 'medium' as const,
      data: {
        items: [
          { id: '1', title: 'Photography Package', vendor: 'Capture Moments', status: 'CONFIRMED' },
          { id: '2', title: 'Catering Service', vendor: 'Gourmet Events', status: 'QUOTE_SENT' },
          { id: '3', title: 'Audio Visual', vendor: 'TechSound', status: 'IN_PROGRESS' },
        ],
      },
    },
    {
      id: 'top-categories',
      type: 'chart' as const,
      title: 'Popular Service Categories',
      size: 'medium' as const,
      data: {
        categories: ['Catering', 'Photography', 'Venue', 'Audio/Visual'],
        values: [28, 22, 18, 15],
      },
    },
  ];

  const pageActions = [
    {
      label: 'Browse Services',
      action: () => setActiveView('discover'),
      variant: 'primary' as const,
    },
    {
      label: 'My Bookings',
      action: () => setActiveView('bookings'),
      variant: 'secondary' as const,
    },
    ...(isVendor ? [{
      label: 'Vendor Dashboard',
      action: () => window.location.href = '/console/marketplace/vendors',
      variant: 'secondary' as const,
    }] : []),
  ];

  const tabs = [
    { id: 'discover', label: 'Discover Services', icon: '🔍' },
    { id: 'bookings', label: 'My Bookings', icon: '📋' },
    { id: 'reviews', label: 'Reviews & Ratings', icon: '⭐' },
    ...(eventId ? [{ id: 'integration', label: 'Event Planning', icon: '🎯' }] : []),
    ...(isOrganizer ? [{ id: 'vendors', label: 'Vendor Coordination', icon: '🤝' }] : []),
  ];

  const breadcrumbs = [
    { label: 'Console', href: '/console' },
    { label: 'Marketplace', href: '/console/marketplace' },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'discover':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ServiceDiscoveryUI eventId={eventId || undefined} />
            </div>
          </div>
        );

      case 'bookings':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <BookingManagementUI eventId={eventId || undefined} />
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ReviewRatingUI eventId={eventId || undefined} />
            </div>
          </div>
        );

      case 'integration':
        return eventId ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <EventMarketplaceIntegration 
                eventId={eventId} 
                eventName={eventName || 'Your Event'} 
              />
            </div>
          </div>
        ) : null;

      case 'vendors':
        return eventId ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <VendorCoordination eventId={eventId} />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Select an event to coordinate with vendors</p>
          </div>
        );

      default:
        return (
          <ServiceDashboard
            service="marketplace"
            widgets={dashboardWidgets}
            layout={{
              columns: 3,
              rows: [
                { id: 'row-1', widgets: ['marketplace-metrics'] },
                { id: 'row-2', widgets: ['recent-bookings', 'top-categories'] },
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
          title={eventId ? `Marketplace - ${eventName || 'Event'}` : 'Marketplace'}
          subtitle={eventId 
            ? `Discover and book services for ${eventName || 'your event'} from verified vendors`
            : 'Discover and book services from verified vendors'
          }
          breadcrumbs={breadcrumbs}
          actions={pageActions}
          tabs={tabs.map(tab => ({
            id: tab.id,
            label: tab.label,
            current: activeView === tab.id,
            onClick: () => setActiveView(tab.id as any),
          }))}
        />

        {/* Service Categories Quick Navigation */}
        {activeView === 'discover' && (
          <div className="mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Popular Categories</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'VENUE', name: 'Venues', icon: '🏢' },
                  { id: 'CATERING', name: 'Catering', icon: '🍽️' },
                  { id: 'PHOTOGRAPHY', name: 'Photography', icon: '📸' },
                  { id: 'VIDEOGRAPHY', name: 'Videography', icon: '🎥' },
                  { id: 'ENTERTAINMENT', name: 'Entertainment', icon: '🎭' },
                  { id: 'AUDIO_VISUAL', name: 'Audio/Visual', icon: '🔊' },
                ].map((category) => (
                  <button
                    key={category.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    <span className="mr-1">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {renderContent()}
        </div>

        {/* Help and Information */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Marketplace Features</h3>
          <p className="text-blue-700 mb-4">
            Connect with verified vendors and streamline your event planning process with our comprehensive marketplace.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">🔍 Smart Discovery</h4>
              <p className="text-blue-700">Find services using intelligent filters, categories, and location-based search.</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">📋 Booking Management</h4>
              <p className="text-blue-700">Track requests, manage communications, and coordinate service delivery.</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">⭐ Quality Assurance</h4>
              <p className="text-blue-700">Access verified vendors with transparent ratings and detailed reviews.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;