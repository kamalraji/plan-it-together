import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, MapPin, X, SlidersHorizontal } from 'lucide-react';
import { SearchFilters } from './ServiceDiscoveryUI';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
  compact?: boolean;
}

export const ServiceFilters: React.FC<ServiceFiltersProps> = ({ 
  filters, 
  onFilterChange,
  compact = false 
}) => {
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
    staleTime: 5 * 60 * 1000,
  });

  const filteredSuggestions = React.useMemo(() => {
    if (!locationInput.trim() || !locations) return [];

    const input = locationInput.toLowerCase();
    const suggestions: string[] = [];

    locations.combined.forEach((loc) => {
      if (loc.toLowerCase().includes(input)) {
        suggestions.push(loc);
      }
    });

    locations.cities.forEach((city) => {
      if (city.toLowerCase().includes(input) && !suggestions.some(s => s.startsWith(city))) {
        suggestions.push(city);
      }
    });

    locations.states.forEach((state) => {
      if (state.toLowerCase().includes(input) && !suggestions.includes(state)) {
        suggestions.push(state);
      }
    });

    return suggestions.slice(0, 6);
  }, [locationInput, locations]);

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
    onFilterChange({ location: value || undefined });
  };

  const clearLocation = () => {
    setLocationInput('');
    onFilterChange({ location: undefined });
    setShowSuggestions(false);
  };

  const activeFiltersCount = [
    filters.category,
    filters.location,
    filters.verifiedOnly,
  ].filter(Boolean).length;

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-2",
      compact ? "p-0" : "p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border/40"
    )}>
      {/* Search Input */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search..."
          value={filters.query || ''}
          onChange={(e) => onFilterChange({ query: e.target.value })}
          className="h-8 pl-8 pr-3 text-sm bg-background/80 border-border/50 focus:border-primary/50"
        />
      </div>

      {/* Category Select */}
      <Select
        value={filters.category || 'all'}
        onValueChange={(value) => onFilterChange({ category: value === 'all' ? undefined : value })}
      >
        <SelectTrigger className="h-8 w-auto min-w-[120px] text-sm bg-background/80 border-border/50">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {SERVICE_CATEGORIES.map((category) => (
            <SelectItem key={category} value={category} className="text-sm">
              {formatCategory(category)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Location with autocomplete */}
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Location"
            value={locationInput}
            onChange={(e) => handleLocationInputChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="h-8 w-[140px] pl-8 pr-7 text-sm bg-background/80 border-border/50"
          />
          {locationInput && (
            <button
              type="button"
              onClick={clearLocation}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-48 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-auto"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion}-${index}`}
                type="button"
                onClick={() => handleLocationSelect(suggestion)}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent flex items-center gap-2"
              >
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort */}
      <Select
        value={filters.sortBy}
        onValueChange={(value) => onFilterChange({ sortBy: value as SearchFilters['sortBy'] })}
      >
        <SelectTrigger className="h-8 w-auto min-w-[100px] text-sm bg-background/80 border-border/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relevance" className="text-sm">Newest</SelectItem>
          <SelectItem value="price" className="text-sm">Price ↑</SelectItem>
        </SelectContent>
      </Select>

      {/* More Filters Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-8 gap-1.5 text-sm border-border/50 bg-background/80",
              activeFiltersCount > 0 && "border-primary/50 text-primary"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="end">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="verified"
                checked={filters.verifiedOnly}
                onCheckedChange={(checked) => onFilterChange({ verifiedOnly: checked === true })}
              />
              <Label htmlFor="verified" className="text-sm cursor-pointer">
                Verified only
              </Label>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
