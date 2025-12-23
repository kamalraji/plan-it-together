import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

// Types for marketplace services
interface ServiceListing {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  category: ServiceCategory;
  pricing: PricingModel;
  serviceArea: string[];
  inclusions: string[];
  exclusions?: string[];
  media: MediaFile[];
  featured: boolean;
  vendor: {
    id: string;
    businessName: string;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    rating: number;
    reviewCount: number;
    responseTime: number;
  };
}

enum ServiceCategory {
  VENUE = 'VENUE',
  CATERING = 'CATERING',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  VIDEOGRAPHY = 'VIDEOGRAPHY',
  ENTERTAINMENT = 'ENTERTAINMENT',
  DECORATION = 'DECORATION',
  AUDIO_VISUAL = 'AUDIO_VISUAL',
  TRANSPORTATION = 'TRANSPORTATION',
  SECURITY = 'SECURITY',
  CLEANING = 'CLEANING',
  EQUIPMENT_RENTAL = 'EQUIPMENT_RENTAL',
  PRINTING = 'PRINTING',
  MARKETING = 'MARKETING',
  OTHER = 'OTHER'
}

interface PricingModel {
  type: 'FIXED' | 'HOURLY' | 'PER_PERSON' | 'CUSTOM_QUOTE';
  basePrice?: number;
  currency: string;
  minimumOrder?: number;
}

interface MediaFile {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  caption?: string;
}

interface SearchFilters {
  query?: string;
  category?: ServiceCategory;
  location?: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  verifiedOnly: boolean;
  sortBy: 'relevance' | 'price' | 'rating' | 'distance';
}

interface ServiceDiscoveryUIProps {
  eventId?: string;
}

// Utility function for formatting prices
const formatPrice = (pricing: PricingModel) => {
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

const ServiceDiscoveryUI: React.FC<ServiceDiscoveryUIProps> = ({ eventId }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    verifiedOnly: true,
    sortBy: 'relevance'
  });
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const { data: services, isLoading } = useQuery({
    queryKey: ['marketplace-services', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.query) params.append('query', filters.query);
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.budgetRange?.min) params.append('minBudget', filters.budgetRange.min.toString());
      if (filters.budgetRange?.max) params.append('maxBudget', filters.budgetRange.max.toString());
      if (filters.verifiedOnly) params.append('verifiedOnly', 'true');
      params.append('sortBy', filters.sortBy);

      const response = await api.get(`/marketplace/services/search?${params.toString()}`);
      return response.data.services as ServiceListing[];
    },
  });

  const handleSearch = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleBookService = (service: ServiceListing) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Query */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Services
            </label>
            <input
              type="text"
              placeholder="e.g., wedding photography, catering..."
              value={filters.query || ''}
              onChange={(e) => handleSearch({ query: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleSearch({ category: e.target.value as ServiceCategory || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {Object.values(ServiceCategory).map((category) => (
                <option key={category} value={category}>
                  {category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              placeholder="City, State"
              value={filters.location || ''}
              onChange={(e) => handleSearch({ location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleSearch({ sortBy: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="relevance">Relevance</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
              <option value="distance">Distance</option>
            </select>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="mt-4 flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => handleSearch({ verifiedOnly: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Verified vendors only</span>
          </label>
        </div>
      </div>

      {/* Service Listings */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : services && services.length > 0 ? (
          services.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-6">
                {/* Service Image */}
                <div className="flex-shrink-0 mb-4 lg:mb-0">
                  {service.media.length > 0 && service.media[0].type === 'IMAGE' ? (
                    <img
                      src={service.media[0].url}
                      alt={service.title}
                      className="w-full lg:w-48 h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full lg:w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>

                {/* Service Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {service.title}
                        {service.featured && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Featured
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">{service.description}</p>
                      
                      {/* Vendor Info */}
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {service.vendor.businessName}
                          </span>
                          {service.vendor.verificationStatus === 'VERIFIED' && (
                            <svg className="ml-1 w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        
                        <div className="flex items-center">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(service.vendor.rating)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-1 text-sm text-gray-600">
                            {service.vendor.rating.toFixed(1)} ({service.vendor.reviewCount} reviews)
                          </span>
                        </div>
                        
                        <span className="text-sm text-gray-500">
                          Responds in ~{service.vendor.responseTime}h
                        </span>
                      </div>

                      {/* Service Category and Location */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {service.category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span>Serves: {service.serviceArea.join(', ')}</span>
                      </div>

                      {/* Inclusions */}
                      {service.inclusions.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700">Includes: </span>
                          <span className="text-sm text-gray-600">
                            {service.inclusions.slice(0, 3).join(', ')}
                            {service.inclusions.length > 3 && ` +${service.inclusions.length - 3} more`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Pricing and Actions */}
                    <div className="text-right ml-4">
                      <div className="text-lg font-semibold text-gray-900 mb-2">
                        {formatPrice(service.pricing)}
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleBookService(service)}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          Request Quote
                        </button>
                        <button className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or browse all categories.</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedService && (
        <BookingModal
          service={selectedService}
          eventId={eventId}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
};

// Booking Modal Component
interface BookingModalProps {
  service: ServiceListing;
  eventId?: string;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ service, eventId, onClose }) => {
  const [bookingData, setBookingData] = useState({
    serviceDate: '',
    requirements: '',
    budgetMin: '',
    budgetMax: '',
    additionalNotes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    setIsSubmitting(true);
    try {
      await api.post('/marketplace/bookings', {
        eventId,
        serviceListingId: service.id,
        serviceDate: bookingData.serviceDate,
        requirements: bookingData.requirements,
        budgetRange: bookingData.budgetMin && bookingData.budgetMax ? {
          min: parseFloat(bookingData.budgetMin),
          max: parseFloat(bookingData.budgetMax)
        } : undefined,
        additionalNotes: bookingData.additionalNotes
      });

      // Show success message and close modal
      alert('Booking request sent successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to create booking request:', error);
      alert('Failed to send booking request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Request Quote</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Service Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{service.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{service.vendor.businessName}</p>
            <p className="text-sm text-gray-600">{formatPrice(service.pricing)}</p>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceDiscoveryUI;