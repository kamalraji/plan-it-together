import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { ServiceFilters } from './ServiceFilters';
import { ServiceCard } from './ServiceCard';
import { ProductCard } from './ProductCard';
import { ServiceCardSkeleton } from './ServiceCardSkeleton';
import { BookingRequestModal } from './BookingRequestModal';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const ITEMS_PER_PAGE = 12;

export interface SearchFilters {
  query?: string;
  category?: string;
  location?: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  verifiedOnly: boolean;
  sortBy: 'relevance' | 'price' | 'rating' | 'distance';
}

export interface ServiceListingData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  base_price: number | null;
  pricing_type: string;
  price_unit: string | null;
  service_areas: string[] | null;
  inclusions: string[] | null;
  media_urls: string[] | null;
  tags: string[] | null;
  avg_rating?: number;
  review_count?: number;
  vendor: {
    id: string;
    business_name: string;
    verification_status: string | null;
    city: string | null;
    state: string | null;
  };
}

interface ServiceDiscoveryUIProps {
  eventId?: string;
  searchQuery?: string;
  categoryFilter?: string;
  displayMode?: 'list' | 'grid';
}

const ServiceDiscoveryUI: React.FC<ServiceDiscoveryUIProps> = ({ 
  eventId, 
  searchQuery,
  categoryFilter,
  displayMode = 'grid'
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    verifiedOnly: true,
    sortBy: 'relevance'
  });
  const [selectedService, setSelectedService] = useState<ServiceListingData | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [useInfiniteScroll] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(displayMode);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Sync external props with internal filters
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      query: searchQuery || prev.query,
      category: categoryFilter || prev.category,
    }));
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  const fetchServices = async (page: number) => {
    let query = supabase
      .from('vendor_services')
      .select(`
        id,
        name,
        description,
        category,
        base_price,
        pricing_type,
        price_unit,
        service_areas,
        inclusions,
        media_urls,
        tags,
        vendor:vendors!vendor_services_vendor_fk (
          id,
          business_name,
          verification_status,
          city,
          state
        )
      `, { count: 'exact' })
      .eq('status', 'ACTIVE');

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.query) {
      query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
    }

    if (filters.budgetRange?.min) {
      query = query.gte('base_price', filters.budgetRange.min);
    }

    if (filters.budgetRange?.max) {
      query = query.lte('base_price', filters.budgetRange.max);
    }

    switch (filters.sortBy) {
      case 'price':
        query = query.order('base_price', { ascending: true, nullsFirst: false });
        break;
      case 'relevance':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    let filteredData = data || [];
    if (filters.verifiedOnly) {
      filteredData = filteredData.filter(
        (service: any) => service.vendor?.verification_status === 'VERIFIED'
      );
    }

    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filteredData = filteredData.filter((service: any) => {
        const city = service.vendor?.city?.toLowerCase() || '';
        const state = service.vendor?.state?.toLowerCase() || '';
        const serviceAreas = service.service_areas || [];
        return (
          city.includes(locationLower) ||
          state.includes(locationLower) ||
          serviceAreas.some((area: string) => area.toLowerCase().includes(locationLower))
        );
      });
    }

    // Fetch aggregated ratings from vendor_reviews
    const vendorIds = filteredData
      .map((s: any) => s.vendor?.id)
      .filter((id: string | undefined): id is string => Boolean(id));

    let ratingMap: Record<string, { total: number; count: number }> = {};
    
    if (vendorIds.length > 0) {
      const { data: reviews } = await supabase
        .from('vendor_reviews')
        .select('vendor_id, rating')
        .in('vendor_id', vendorIds);

      if (reviews) {
        ratingMap = reviews.reduce((acc, r) => {
          if (!acc[r.vendor_id]) acc[r.vendor_id] = { total: 0, count: 0 };
          acc[r.vendor_id].total += r.rating;
          acc[r.vendor_id].count += 1;
          return acc;
        }, {} as Record<string, { total: number; count: number }>);
      }
    }

    // Add ratings to services
    const servicesWithRatings = filteredData.map((service: any) => {
      const vendorRating = ratingMap[service.vendor?.id];
      return {
        ...service,
        avg_rating: vendorRating ? vendorRating.total / vendorRating.count : 0,
        review_count: vendorRating?.count || 0,
      };
    });

    return {
      services: servicesWithRatings as ServiceListingData[],
      totalCount: count || 0,
    };
  };

  const paginatedQuery = useQuery({
    queryKey: ['marketplace-services', filters, currentPage],
    queryFn: () => fetchServices(currentPage),
    enabled: !useInfiniteScroll,
  });

  const infiniteQuery = useInfiniteQuery({
    queryKey: ['marketplace-services-infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await fetchServices(pageParam);
      return { ...result, nextPage: pageParam + 1 };
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((acc, page) => acc + page.services.length, 0);
      return totalLoaded < lastPage.totalCount ? lastPage.nextPage : undefined;
    },
    initialPageParam: 1,
    enabled: useInfiniteScroll,
  });

  useEffect(() => {
    if (!useInfiniteScroll) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
          infiniteQuery.fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [useInfiniteScroll, infiniteQuery.hasNextPage, infiniteQuery.isFetchingNextPage, infiniteQuery.fetchNextPage]);

  const isLoading = useInfiniteScroll ? infiniteQuery.isLoading : paginatedQuery.isLoading;
  const services = useInfiniteScroll
    ? infiniteQuery.data?.pages.flatMap(page => page.services) || []
    : paginatedQuery.data?.services || [];
  const totalCount = useInfiniteScroll
    ? infiniteQuery.data?.pages[0]?.totalCount || 0
    : paginatedQuery.data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleFilterChange = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleBookService = (service: ServiceListingData) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const renderGridSkeletons = (count: number) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg overflow-hidden border border-border">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderListSkeletons = (count: number) => (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-card rounded-lg p-3 shadow-sm border border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Results Count & Sort */}
          <div className="flex items-center gap-3">
            {!isLoading && (
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">{totalCount}</strong> results
              </span>
            )}
            
            <Select
              value={filters.sortBy}
              onValueChange={(value) => handleFilterChange({ sortBy: value as SearchFilters['sortBy'] })}
            >
              <SelectTrigger className="h-8 w-[140px] text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Newest First</SelectItem>
                <SelectItem value="price">Price: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle & Mobile Filters */}
          <div className="flex items-center gap-2">
            {/* Mobile Filter Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden gap-1.5">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <ServiceFilters filters={filters} onFilterChange={handleFilterChange} compact />
                </div>
              </SheetContent>
            </Sheet>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-border rounded-md">
              <Toggle
                pressed={viewMode === 'grid'}
                onPressedChange={() => setViewMode('grid')}
                size="sm"
                className="rounded-r-none border-0"
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Toggle>
              <Toggle
                pressed={viewMode === 'list'}
                onPressedChange={() => setViewMode('list')}
                size="sm"
                className="rounded-l-none border-0"
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Toggle>
            </div>
          </div>
        </div>
      </div>

      {/* Service Listings */}
      {isLoading ? (
        viewMode === 'grid' ? renderGridSkeletons(8) : renderListSkeletons(3)
      ) : services && services.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {services.map((service) => (
                <ProductCard
                  key={service.id}
                  service={service}
                  onBookService={handleBookService}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onBookService={handleBookService}
                />
              ))}
            </div>
          )}
          
          {useInfiniteScroll && (
            <div ref={loadMoreRef} className="py-4">
              {infiniteQuery.isFetchingNextPage && (
                viewMode === 'grid' ? renderGridSkeletons(4) : renderListSkeletons(2)
              )}
              {!infiniteQuery.hasNextPage && services.length > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  You've reached the end
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg border border-border">
          <Search className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No services found</h3>
          <p className="text-muted-foreground text-sm">Try adjusting your filters or search terms</p>
        </div>
      )}

      {/* Pagination */}
      {!useInfiniteScroll && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {getPageNumbers().map((page, idx) =>
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Booking Modal */}
      {selectedService && (
        <BookingRequestModal
          service={selectedService}
          eventId={eventId}
          open={showBookingModal}
          onOpenChange={(open) => {
            setShowBookingModal(open);
            if (!open) setSelectedService(null);
          }}
        />
      )}
    </div>
  );
};

export default ServiceDiscoveryUI;
