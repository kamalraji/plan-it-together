import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

interface ServiceListing {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  category: string;
  pricing: {
    type: 'FIXED' | 'HOURLY' | 'PER_PERSON' | 'CUSTOM_QUOTE';
    basePrice?: number;
    currency: string;
  };
  vendor: {
    id: string;
    businessName: string;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    rating: number;
    reviewCount: number;
  };
  featured: boolean;
}

interface Event {
  id: string;
  name: string;
  mode: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  startDate: string;
  endDate: string;
  capacity?: number;
  venue?: {
    address: string;
    city: string;
    state: string;
  };
}

interface ServiceRecommendationsProps {
  eventId: string;
  onAddToShortlist: (serviceId: string) => void;
  onRequestQuote: (service: ServiceListing) => void;
}

const ServiceRecommendations: React.FC<ServiceRecommendationsProps> = ({
  eventId,
  onAddToShortlist,
  onRequestQuote,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch event details for context
  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await api.get(`/events/${eventId}`);
      return response.data.event as Event;
    },
  });

  // Fetch recommended services based on event details
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['service-recommendations', eventId, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('eventId', eventId);
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      
      const response = await api.get(`/marketplace/services/recommendations?${params.toString()}`);
      return response.data.services as ServiceListing[];
    },
  });

  const formatPrice = (pricing: ServiceListing['pricing']) => {
    if (pricing.type === 'CUSTOM_QUOTE') {
      return 'Custom Quote';
    }
    
    const price = pricing.basePrice || 0;
    const currency = pricing.currency || 'USD';
    
    switch (pricing.type) {
      case 'FIXED':
        return `${currency} ${price.toLocaleString()}`;
      case 'HOURLY':
        return `${currency} ${price.toLocaleString()}/hour`;
      case 'PER_PERSON':
        return `${currency} ${price.toLocaleString()}/person`;
      default:
        return 'Contact for pricing';
    }
  };

  const getEventTypeCategories = () => {
    if (!event) return [];
    
    // Suggest categories based on event type and mode
    const baseCategories = ['VENUE', 'CATERING', 'AUDIO_VISUAL'];
    
    if (event.mode === 'OFFLINE' || event.mode === 'HYBRID') {
      baseCategories.push('DECORATION', 'SECURITY', 'CLEANING');
    }
    
    if (event.capacity && event.capacity > 100) {
      baseCategories.push('TRANSPORTATION', 'EQUIPMENT_RENTAL');
    }
    
    baseCategories.push('PHOTOGRAPHY', 'VIDEOGRAPHY', 'MARKETING');
    
    return baseCategories;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Recommended Services
          </h3>
          <p className="text-sm text-muted-foreground">
            Services suggested for your event: {event?.name}
          </p>
        </div>
        
        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-foreground">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Categories</option>
            {getEventTypeCategories().map((category) => (
              <option key={category} value={category}>
                {category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Event Context Card */}
      {event && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900">
                Event Context
              </p>
              <div className="mt-1 text-sm text-blue-700 space-y-1">
                <p>Mode: {event.mode} • Date: {new Date(event.startDate).toLocaleDateString()}</p>
                {event.capacity && <p>Expected Attendees: {event.capacity}</p>}
                {event.venue && <p>Location: {event.venue.city}, {event.venue.state}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      {recommendations && recommendations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((service) => (
            <div key={service.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm">
                    {service.title}
                    {service.featured && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {service.description}
                  </p>
                </div>
              </div>

              {/* Vendor Info */}
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xs font-medium text-foreground">
                  {service.vendor.businessName}
                </span>
                {service.vendor.verificationStatus === 'VERIFIED' && (
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(service.vendor.rating)
                            ? 'text-yellow-400'
                            : 'text-muted-foreground/70'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {service.vendor.rating.toFixed(1)} ({service.vendor.reviewCount})
                  </span>
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-3">
                <span className="text-sm font-semibold text-foreground">
                  {formatPrice(service.pricing)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => onAddToShortlist(service.id)}
                  className="flex-1 text-xs bg-muted text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
                >
                  Add to Shortlist
                </button>
                <button
                  onClick={() => onRequestQuote(service)}
                  className="flex-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  Request Quote
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No recommendations found</h3>
          <p className="text-muted-foreground">
            We couldn't find any services matching your event requirements. Try browsing all services.
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceRecommendations;