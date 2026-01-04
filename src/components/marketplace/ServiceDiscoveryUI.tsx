import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Star, Clock, CheckCircle, Loader2, Image as ImageIcon } from 'lucide-react';

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
      <Card className="border-border/60">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Query */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium text-foreground">
                Search Services
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="e.g., wedding photography..."
                  value={filters.query || ''}
                  onChange={(e) => handleSearch({ query: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Category</Label>
              <Select
                value={filters.category || 'all'}
                onValueChange={(value) => handleSearch({ category: value === 'all' ? undefined : value as ServiceCategory })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.values(ServiceCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-foreground">
                Location
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  type="text"
                  placeholder="City, State"
                  value={filters.location || ''}
                  onChange={(e) => handleSearch({ location: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Sort By</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleSearch({ sortBy: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="mt-4 flex items-center space-x-2">
            <Checkbox
              id="verified"
              checked={filters.verifiedOnly}
              onCheckedChange={(checked) => handleSearch({ verifiedOnly: checked === true })}
            />
            <Label htmlFor="verified" className="text-sm text-muted-foreground cursor-pointer">
              Verified vendors only
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Service Listings */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : services && services.length > 0 ? (
          services.map((service) => (
            <Card key={service.id} className="border-border/60 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Service Image */}
                  <div className="flex-shrink-0 lg:w-52">
                    {service.media.length > 0 && service.media[0].type === 'IMAGE' ? (
                      <img
                        src={service.media[0].url}
                        alt={service.title}
                        className="w-full h-40 lg:h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 lg:h-full bg-muted flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Service Details */}
                  <div className="flex-1 p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {service.title}
                          </h3>
                          {service.featured && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                              <Star className="h-3 w-3 mr-1 fill-current" /> Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{service.description}</p>
                        
                        {/* Vendor Info */}
                        <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-foreground">
                              {service.vendor.businessName}
                            </span>
                            {service.vendor.verificationStatus === 'VERIFIED' && (
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < Math.floor(service.vendor.rating)
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-muted-foreground/30'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-1">
                              {service.vendor.rating.toFixed(1)} ({service.vendor.reviewCount})
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>~{service.vendor.responseTime}h</span>
                          </div>
                        </div>

                        {/* Service Category and Location */}
                        <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
                          <Badge variant="outline" className="text-xs">
                            {service.category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          <span className="text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 inline mr-1" />
                            {service.serviceArea.join(', ')}
                          </span>
                        </div>

                        {/* Inclusions */}
                        {service.inclusions.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Includes:</span>{' '}
                            {service.inclusions.slice(0, 3).join(', ')}
                            {service.inclusions.length > 3 && ` +${service.inclusions.length - 3} more`}
                          </p>
                        )}
                      </div>

                      {/* Pricing and Actions */}
                      <div className="lg:text-right shrink-0">
                        <div className="text-lg font-semibold text-foreground mb-3">
                          {formatPrice(service.pricing)}
                        </div>
                        <div className="flex lg:flex-col gap-2">
                          <Button
                            onClick={() => handleBookService(service)}
                            size="sm"
                            className="flex-1 lg:w-full"
                          >
                            Request Quote
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 lg:w-full">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No services found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria or browse all categories.</p>
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