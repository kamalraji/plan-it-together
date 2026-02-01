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
    <div className="w-full overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Event Marketplace</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            {eventId 
              ? `Discover and book services for ${eventName || 'your event'} from verified vendors`
              : 'Discover and book services for your events from verified vendors'
            }
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-border mb-6 sm:mb-8 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            {eventId && (
              <button
                onClick={() => setCurrentTab('integrated')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentTab === 'integrated'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-input'
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
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-input'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {currentTab === 'integrated' && eventId && (
            <div className="animate-fade-in">
              <EventMarketplaceIntegration 
                eventId={eventId} 
                eventName={eventName || 'Your Event'} 
              />
            </div>
          )}
          {currentTab === 'discover' && (
            <div className="animate-fade-in">
              <ServiceDiscoveryUI eventId={eventId} />
            </div>
          )}
          {currentTab === 'bookings' && (
            <div className="animate-fade-in">
              <BookingManagementUI eventId={eventId} />
            </div>
          )}
          {currentTab === 'reviews' && (
            <div className="animate-fade-in">
              <ReviewRatingUI eventId={eventId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceOrganizerInterface;