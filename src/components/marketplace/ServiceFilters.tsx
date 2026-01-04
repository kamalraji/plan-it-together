import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, X } from 'lucide-react';
import { SearchFilters } from './ServiceDiscoveryUI';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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

const formatCategory = (category: string) => {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

interface ServiceFiltersProps {
  filters: SearchFilters;
  onFilterChange: (newFilters: Partial<SearchFilters>) => void;
}

export const ServiceFilters: React.FC<ServiceFiltersProps> = ({ filters, onFilterChange }) => {
  const [locationInput, setLocationInput] = useState(filters.location || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch unique locations from verified vendors
  const { data: locations } = useQuery({
    queryKey: ['vendor-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('city, state')
        .eq('verification_status', 'VERIFIED')
        .not('city', 'is', null);

      if (error) throw error;

      // Create unique location combinations
      const locationSet = new Set<string>();
      const citySet = new Set<string>();
      const stateSet = new Set<string>();

      data?.forEach((vendor) => {
        if (vendor.city) {
          citySet.add(vendor.city);
          if (vendor.state) {
            locationSet.add(`${vendor.city}, ${vendor.state}`);
            stateSet.add(vendor.state);
          } else {
            locationSet.add(vendor.city);
          }
        } else if (vendor.state) {
          stateSet.add(vendor.state);
        }
      });

      return {
        combined: Array.from(locationSet).sort(),
        cities: Array.from(citySet).sort(),
        states: Array.from(stateSet).sort(),
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Filter suggestions based on input
  const filteredSuggestions = React.useMemo(() => {
    if (!locationInput.trim() || !locations) return [];

    const input = locationInput.toLowerCase();
    const suggestions: string[] = [];

    // Add combined locations
    locations.combined.forEach((loc) => {
      if (loc.toLowerCase().includes(input)) {
        suggestions.push(loc);
      }
    });

    // Add cities not already in combined
    locations.cities.forEach((city) => {
      if (city.toLowerCase().includes(input) && !suggestions.some(s => s.startsWith(city))) {
        suggestions.push(city);
      }
    });

    // Add states
    locations.states.forEach((state) => {
      if (state.toLowerCase().includes(input) && !suggestions.includes(state)) {
        suggestions.push(state);
      }
    });

    return suggestions.slice(0, 8);
  }, [locationInput, locations]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (location: string) => {
    setLocationInput(location);
    onFilterChange({ location });
    setShowSuggestions(false);
  };

  const handleLocationInputChange = (value: string) => {
    setLocationInput(value);
    setShowSuggestions(true);
    // Debounce the filter change
    onFilterChange({ location: value || undefined });
  };

  const clearLocation = () => {
    setLocationInput('');
    onFilterChange({ location: undefined });
    setShowSuggestions(false);
  };

  return (
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
                onChange={(e) => onFilterChange({ query: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Category</Label>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => onFilterChange({ category: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {SERVICE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {formatCategory(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter with Autocomplete */}
          <div className="space-y-2 relative">
            <Label htmlFor="location" className="text-sm font-medium text-foreground">
              Location
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                ref={inputRef}
                id="location"
                type="text"
                placeholder="City or State"
                value={locationInput}
                onChange={(e) => handleLocationInputChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className="pl-9 pr-8"
              />
              {locationInput && (
                <button
                  type="button"
                  onClick={clearLocation}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Location Suggestions Dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
              >
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion}-${index}`}
                    type="button"
                    onClick={() => handleLocationSelect(suggestion)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                      "flex items-center gap-2"
                    )}
                  >
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Sort By</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => onFilterChange({ sortBy: value as SearchFilters['sortBy'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Newest First</SelectItem>
                <SelectItem value="price">Price: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="mt-4 flex items-center space-x-2">
          <Checkbox
            id="verified"
            checked={filters.verifiedOnly}
            onCheckedChange={(checked) => onFilterChange({ verifiedOnly: checked === true })}
          />
          <Label htmlFor="verified" className="text-sm text-muted-foreground cursor-pointer">
            Verified vendors only
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};
