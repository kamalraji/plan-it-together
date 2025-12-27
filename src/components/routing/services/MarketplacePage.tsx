import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { useAuth } from '../../../hooks/useAuth';
import { UserRole } from '../../../types';
import { Button } from '@/components/ui/button';

// Import existing marketplace components
import ServiceDiscoveryUI from '../../marketplace/ServiceDiscoveryUI';
import BookingManagementUI from '../../marketplace/BookingManagementUI';
import ReviewRatingUI from '../../marketplace/ReviewRatingUI';
import VendorCoordination from '../../marketplace/VendorCoordination';
import EventMarketplaceIntegration from '../../marketplace/EventMarketplaceIntegration';

/**
 * MarketplacePage provides a customer-facing marketplace interface for browsing and booking services.
 * 
 * Features:
 * - Service discovery with advanced filtering
 * - Booking management
 * - Event-specific marketplace integration
 * - Review and rating system
 * - Role-based interface customization
 */
export const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'discover' | 'bookings' | 'vendors' | 'reviews' | 'integration'>('discover');

  // Extract eventId from URL params if present
  const urlParams = new URLSearchParams(location.search);
  const eventId = urlParams.get('eventId');
  const eventName = urlParams.get('eventName');

  const isOrganizer = user?.role === UserRole.ORGANIZER;


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
  ];

  const tabs = [
    { id: 'discover', label: 'Discover Services' },
    { id: 'bookings', label: 'My Bookings' },
    { id: 'reviews', label: 'Reviews & Ratings' },
    ...(eventId ? [{ id: 'integration', label: 'Event Planning' }] : []),
    ...(isOrganizer ? [{ id: 'vendors', label: 'Vendor Coordination' }] : []),
  ];

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Marketplace', href: '/marketplace' },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'discover':
        return (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 border">
              <h2 className="text-2xl font-bold mb-2">Are you a vendor?</h2>
              <p className="text-muted-foreground mb-4">
                Join our marketplace and connect with event organizers looking for quality services.
              </p>
              <Button onClick={() => navigate('/marketplace/vendor/register')}>
                Become a Vendor
              </Button>
            </div>
            
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
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">Select an event to coordinate with vendors</p>
            <button
              onClick={() => setActiveView('discover')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Services Instead
            </button>
          </div>
        );
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title={eventId ? `Marketplace - ${eventName || 'Event'}` : 'Service Marketplace'}
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
                  { id: 'VENUE', name: 'Venues' },
                  { id: 'CATERING', name: 'Catering' },
                  { id: 'PHOTOGRAPHY', name: 'Photography' },
                  { id: 'VIDEOGRAPHY', name: 'Videography' },
                  { id: 'ENTERTAINMENT', name: 'Entertainment' },
                  { id: 'AUDIO_VISUAL', name: 'Audio/Visual' },
                ].map((category) => (
                  <button
                    key={category.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
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
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Discover Professional Services for Your Events</h3>
          <p className="text-gray-700 mb-6">
            Browse our curated marketplace of verified vendors offering everything you need to make your events successful.
          </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
                <div className="text-2xl mb-2">🔍</div>
                <h4 className="font-semibold text-gray-900 mb-2">Smart Search</h4>
                <p className="text-sm text-gray-600">Find exactly what you need with intelligent filters for category, location, budget, and availability.</p>
              </div>
              <div className="bg-white/80 rounded-lg p-4 border border-purple-100">
                <div className="text-2xl mb-2">✅</div>
                <h4 className="font-semibold text-gray-900 mb-2">Verified Vendors</h4>
                <p className="text-sm text-gray-600">All vendors are verified and rated by previous customers for quality assurance.</p>
              </div>
              <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
                <div className="text-2xl mb-2">💬</div>
                <h4 className="font-semibold text-gray-900 mb-2">Direct Communication</h4>
                <p className="text-sm text-gray-600">Connect directly with vendors, request quotes, and coordinate service delivery.</p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;