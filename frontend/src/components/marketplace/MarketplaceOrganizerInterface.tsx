import React, { useState } from 'react';
import ServiceDiscoveryUI from './ServiceDiscoveryUI';
import BookingManagementUI from './BookingManagementUI';
import ReviewRatingUI from './ReviewRatingUI';
import EventMarketplaceIntegration from './EventMarketplaceIntegration';

interface MarketplaceOrganizerInterfaceProps {
  eventId?: string;
  eventName?: string;
}

const MarketplaceOrganizerInterface: React.FC<MarketplaceOrganizerInterfaceProps> = ({ 
  eventId, 
  eventName 
}) => {

  // If we have an eventId, show the integrated event-specific interface by default
  const defaultTab = eventId ? 'integrated' : 'discover';
  const [currentTab, setCurrentTab] = useState(defaultTab);

  React.useEffect(() => {
    setCurrentTab(eventId ? 'integrated' : 'discover');
  }, [eventId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Event Marketplace</h1>
        <p className="mt-2 text-gray-600">
          {eventId 
            ? `Discover and book services for ${eventName || 'your event'} from verified vendors`
            : 'Discover and book services for your events from verified vendors'
          }
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {eventId && (
            <button
              onClick={() => setCurrentTab('integrated')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentTab === 'integrated'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">🎯</span>
              Event Planning
            </button>
          )}
          {[
            { id: 'discover', name: 'Discover Services', icon: '🔍' },
            { id: 'bookings', name: 'My Bookings', icon: '📋' },
            { id: 'reviews', name: 'Reviews', icon: '⭐' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {currentTab === 'integrated' && eventId && (
        <EventMarketplaceIntegration 
          eventId={eventId} 
          eventName={eventName || 'Your Event'} 
        />
      )}
      {currentTab === 'discover' && <ServiceDiscoveryUI eventId={eventId} />}
      {currentTab === 'bookings' && <BookingManagementUI eventId={eventId} />}
      {currentTab === 'reviews' && <ReviewRatingUI eventId={eventId} />}
    </div>
  );
};

export default MarketplaceOrganizerInterface;