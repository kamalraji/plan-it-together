import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StarIcon, MapPinIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { SearchEmptyState } from '@/components/ui/empty-state';

interface SearchFilters {
  query?: string;
  category?: string;
  location?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  minRating?: number;
  sortBy: 'rating' | 'price_asc' | 'price_desc' | 'newest';
}

const SERVICE_CATEGORIES = [
  'VENUE',
  'CATERING',
  'PHOTOGRAPHY',
  'VIDEOGRAPHY',
  'ENTERTAINMENT',
  'DECORATION',
  'AUDIO_VISUAL',
  'TRANSPORTATION',
  'SECURITY',
  'CLEANING',
  'EQUIPMENT_RENTAL',
  'PRINTING',
  'MARKETING',
  'OTHER'
];

export const ServiceDiscoveryEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'rating'
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['marketplace-services', filters],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select(`
          *,
          vendors!inner (
            id,
            business_name,
            verification_status,
            rating,
            review_count,
            response_time_hours
          )
        `)
        .eq('is_active', true);

      // Apply filters
      if (filters.query) {
        query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.priceRange) {
        if (filters.priceRange.min) {
          query = query.gte('base_price', filters.priceRange.min);
        }
        if (filters.priceRange.max) {
          query = query.lte('base_price', filters.priceRange.max);
        }
      }

      if (filters.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'price_asc':
          query = query.order('base_price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('base_price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const formatPrice = (service: any) => {
    const price = service.base_price;
    
    switch (service.pricing_type) {
      case 'FIXED':
        return `$${price.toLocaleString()}`;
      case 'HOURLY':
        return `$${price.toLocaleString()}/hour`;
      case 'PER_PERSON':
        return `$${price.toLocaleString()}/person`;
      case 'CUSTOM_QUOTE':
        return 'Custom Quote';
      default:
        return 'Contact for pricing';
    }
  };

  const handleServiceClick = (serviceId: string) => {
    navigate(`/marketplace/services/detail/${serviceId}`);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover Services</h1>
          <p className="text-muted-foreground">
            Find the perfect vendors for your event
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <Input
                  placeholder="Service or vendor..."
                  value={filters.query || ''}
                  onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select
                  value={filters.category || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, category: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  placeholder="City or state..."
                  value={filters.location || ''}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                />
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Min Rating</label>
                <Select
                  value={filters.minRating?.toString() || 'any'}
                  onValueChange={(value) => setFilters({ ...filters, minRating: value === 'any' ? undefined : parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Rating</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="4.0">4.0+ Stars</SelectItem>
                    <SelectItem value="3.5">3.5+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Min Price</label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange?.min || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    priceRange: { ...filters.priceRange, min: parseInt(e.target.value) || 0, max: filters.priceRange?.max || 0 }
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Max Price</label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange?.max || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    priceRange: { min: filters.priceRange?.min || 0, max: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {services?.length || 0} services found
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services?.map((service: any) => (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleServiceClick(service.id)}
                >
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={service.photos?.[0] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline">{service.category}</Badge>
                      {service.is_featured && <Badge>Featured</Badge>}
                    </div>
                    <CardTitle className="line-clamp-2">{service.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{service.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">{service.rating?.toFixed(1) || '0.0'}</span>
                          <span className="text-muted-foreground">({service.review_count || 0})</span>
                        </div>
                      </div>

                      {service.vendors && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{service.vendors.business_name}</span>
                          {service.vendors.verification_status === 'VERIFIED' && (
                            <ShieldCheckIcon className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-lg font-bold text-primary">{formatPrice(service)}</span>
                        <Button size="sm">View Details</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {services && services.length === 0 && (
              <SearchEmptyState
                searchTerm={filters.query}
                onClear={() => setFilters({ sortBy: 'rating' })}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};