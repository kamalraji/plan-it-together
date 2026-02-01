import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LazyThumbnail } from '@/components/ui/lazy-image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  MapPin,
  CheckCircle2,
  Search,
  Filter,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

interface Vendor {
  id: string;
  business_name: string;
  business_type: string;
  description: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  categories: string[];
  portfolio_urls: string[];
  verification_status: string;
  verified_at: string | null;
}

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'VENUE', label: 'Venue & Location' },
  { value: 'CATERING', label: 'Catering' },
  { value: 'PHOTOGRAPHY', label: 'Photography' },
  { value: 'VIDEOGRAPHY', label: 'Videography' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'DECORATION', label: 'Decoration' },
  { value: 'AUDIO_VISUAL', label: 'Audio/Visual' },
  { value: 'TRANSPORTATION', label: 'Transportation' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'EQUIPMENT_RENTAL', label: 'Equipment Rental' },
  { value: 'PRINTING', label: 'Printing' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OTHER', label: 'Other' },
];

const CATEGORY_LABELS: Record<string, string> = CATEGORY_OPTIONS.reduce(
  (acc, opt) => ({ ...acc, [opt.value]: opt.label }),
  {}
);

export const VendorListingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('');

  // Fetch all verified vendors
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['verified-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('verification_status', 'VERIFIED')
        .order('business_name', { ascending: true });
      if (error) throw error;
      return data as Vendor[];
    },
  });

  // Filter vendors based on search, category, and location
  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        vendor.business_name.toLowerCase().includes(searchLower) ||
        vendor.description?.toLowerCase().includes(searchLower) ||
        vendor.categories?.some((cat) =>
          (CATEGORY_LABELS[cat] || cat).toLowerCase().includes(searchLower)
        );

      // Category filter
      const matchesCategory =
        categoryFilter === 'ALL' ||
        vendor.categories?.includes(categoryFilter);

      // Location filter
      const locationLower = locationFilter.toLowerCase();
      const matchesLocation =
        !locationFilter ||
        vendor.city?.toLowerCase().includes(locationLower) ||
        vendor.state?.toLowerCase().includes(locationLower) ||
        vendor.country?.toLowerCase().includes(locationLower);

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [vendors, searchQuery, categoryFilter, locationFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setLocationFilter('');
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'ALL' || locationFilter;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/marketplace">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Verified Vendors</h1>
          <p className="text-muted-foreground">
            Browse our network of trusted and verified event service providers
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Location Filter */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredVendors.length} of {vendors.length} vendors
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredVendors.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">No vendors found</h2>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters to find vendors.'
                  : 'There are no verified vendors available yet.'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Vendor Grid */}
        {!isLoading && filteredVendors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => {
              const location = [vendor.city, vendor.state, vendor.country]
                .filter(Boolean)
                .join(', ');

              return (
                <Card
                  key={vendor.id}
                  className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                >
                  {/* Portfolio Preview */}
                  <LazyThumbnail
                    src={vendor.portfolio_urls?.[0]}
                    alt={vendor.business_name}
                    aspectRatio="video"
                    className="rounded-t-lg"
                    fallbackIcon={<Building2 className="w-16 h-16 text-primary/30" />}
                  />

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1">
                        {vendor.business_name}
                      </CardTitle>
                      <Badge className="gap-1 shrink-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </Badge>
                    </div>
                    {location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {location}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {vendor.description && (
                      <CardDescription className="line-clamp-2">
                        {vendor.description}
                      </CardDescription>
                    )}

                    {/* Categories */}
                    {vendor.categories && vendor.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {vendor.categories.slice(0, 3).map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-xs">
                            {CATEGORY_LABELS[cat] || cat}
                          </Badge>
                        ))}
                        {vendor.categories.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{vendor.categories.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button asChild className="w-full mt-3" variant="outline">
                      <Link to={`/vendor/${vendor.id}`}>
                        View Profile
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && filteredVendors.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {filteredVendors.length} verified vendor
            {filteredVendors.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorListingPage;
