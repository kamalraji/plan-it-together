import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import ServiceRecommendations from './ServiceRecommendations';
import VendorShortlist from './VendorShortlist';
import VendorCoordination from './VendorCoordination';
import ServiceDiscoveryUI from './ServiceDiscoveryUI';

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
}

interface EventMarketplaceIntegrationProps {
  eventId: string;
  eventName: string;
}

const EventMarketplaceIntegration: React.FC<EventMarketplaceIntegrationProps> = ({
  eventId,
  eventName,
}) => {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'discover' | 'shortlist' | 'coordination'>('recommendations');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null);
  const [bookingData, setBookingData] = useState({
    serviceDate: '',
    requirements: '',
    budgetMin: '',
    budgetMax: '',
    additionalNotes: ''
  });
  const queryClient = useQueryClient();

  // Add to shortlist mutation
  const addToShortlistMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      await api.post('/marketplace/shortlist', {
        eventId,
        serviceListingId: serviceId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-shortlist', eventId] });
    },
  });

  // Create booking request mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/marketplace/bookings', {
        eventId,
        serviceListingId: selectedService?.id,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings', eventId] });
      setShowBookingModal(false);
      setSelectedService(null);
      setBookingData({
        serviceDate: '',
        requirements: '',
        budgetMin: '',
        budgetMax: '',
        additionalNotes: ''
      });
    },
  });

  const handleAddToShortlist = (serviceId: string) => {
    addToShortlistMutation.mutate(serviceId);
  };

  const handleRequestQuote = (service: ServiceListing) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    
    const bookingRequest = {
      serviceDate: bookingData.serviceDate,
      requirements: bookingData.requirements,
      budgetRange: bookingData.budgetMin && bookingData.budgetMax ? {
        min: parseFloat(bookingData.budgetMin),
        max: parseFloat(bookingData.budgetMax)
      } : undefined,
      additionalNotes: bookingData.additionalNotes
    };

    createBookingMutation.mutate(bookingRequest);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Marketplace for {eventName}
        </h2>
        <p className="text-blue-100">
          Discover, book, and coordinate with vendors for your event
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">🔍</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Recommendations</p>
              <p className="text-xs text-gray-600">AI-powered suggestions</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">⭐</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Shortlist</p>
              <p className="text-xs text-gray-600">Saved vendors</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm">📋</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Coordination</p>
              <p className="text-xs text-gray-600">Timeline & communication</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm">🛍️</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Browse All</p>
              <p className="text-xs text-gray-600">Full marketplace</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'recommendations', name: 'Recommendations', icon: '🎯', description: 'AI-suggested services' },
            { id: 'discover', name: 'Browse All', icon: '🔍', description: 'Full marketplace search' },
            { id: 'shortlist', name: 'Shortlist', icon: '⭐', description: 'Saved vendors' },
            { id: 'coordination', name: 'Coordination', icon: '📋', description: 'Vendor management' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </div>
              <div className={`text-xs mt-1 ${
                activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'
              }`}>
                {tab.description}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'recommendations' && (
          <ServiceRecommendations
            eventId={eventId}
            onAddToShortlist={handleAddToShortlist}
            onRequestQuote={handleRequestQuote}
          />
        )}

        {activeTab === 'discover' && (
          <ServiceDiscoveryUI
            eventId={eventId}
          />
        )}

        {activeTab === 'shortlist' && (
          <VendorShortlist
            eventId={eventId}
            onRequestQuote={(service) => handleRequestQuote({ ...service, vendorId: service.vendor.id })}
          />
        )}

        {activeTab === 'coordination' && (
          <VendorCoordination
            eventId={eventId}
          />
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Request Quote</h2>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedService(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Service Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">{selectedService.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{selectedService.vendor.businessName}</p>
                <p className="text-sm text-gray-600">
                  {selectedService.pricing.type === 'CUSTOM_QUOTE' 
                    ? 'Custom Quote' 
                    : `${selectedService.pricing.currency} ${selectedService.pricing.basePrice?.toLocaleString()}`
                  }
                </p>
              </div>

              {/* Booking Form */}
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingData.serviceDate}
                    onChange={(e) => setBookingData(prev => ({ ...prev, serviceDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your specific requirements for this service..."
                    value={bookingData.requirements}
                    onChange={(e) => setBookingData(prev => ({ ...prev, requirements: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Range (Min)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={bookingData.budgetMin}
                      onChange={(e) => setBookingData(prev => ({ ...prev, budgetMin: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Range (Max)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={bookingData.budgetMax}
                      onChange={(e) => setBookingData(prev => ({ ...prev, budgetMax: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any additional information or special requests..."
                    value={bookingData.additionalNotes}
                    onChange={(e) => setBookingData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingModal(false);
                      setSelectedService(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createBookingMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {createBookingMutation.isPending ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventMarketplaceIntegration;