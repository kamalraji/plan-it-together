import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from './PageHeader';
import { SkeletonList } from './LoadingStates';
import { SearchResultCard } from './SearchResultCard';
import { SearchFilters } from './SearchFilters';
import { SearchEmptyState } from '@/components/ui/empty-state';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'event' | 'workspace' | 'organization' | 'service' | 'user' | 'marketplace';
  url: string;
  icon?: string;
  metadata?: Record<string, any>;
  relevanceScore?: number;
  lastUpdated?: string;
}

export interface SearchFilter {
  type: string;
  label: string;
  options: Array<{
    value: string;
    label: string;
    count?: number;
  }>;
}

export interface SearchSuggestion {
  query: string;
  type: 'recent' | 'popular' | 'autocomplete';
  count?: number;
}

interface SearchPageProps {
  className?: string;
}

// Mock search API - in a real app, this would be an actual API call
const mockSearchAPI = async (
  query: string,
  filters: Record<string, string[]>,
  page: number = 1,
  limit: number = 20
): Promise<{
  results: SearchResult[];
  total: number;
  suggestions: SearchSuggestion[];
  filters: SearchFilter[];
}> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const allResults: SearchResult[] = [
    {
      id: '1',
      title: 'Annual Tech Conference 2024',
      description: 'Large-scale technology conference with 500+ attendees, featuring keynotes from industry leaders',
      type: 'event',
      url: '/dashboard/eventmanagement/1',
      icon: '📅',
      metadata: { 
        status: 'active', 
        attendees: 523, 
        date: '2024-03-15',
        location: 'San Francisco, CA',
        organizer: 'TechCorp'
      },
      relevanceScore: 0.95,
      lastUpdated: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      title: 'Marketing Team Workspace',
      description: 'Collaborative workspace for marketing campaign planning and execution',
      type: 'workspace',
      url: '/dashboard/workspaces/2',
      icon: '👥',
      metadata: { 
        members: 12, 
        tasks: 34, 
        status: 'active',
        event: 'Annual Tech Conference 2024'
      },
      relevanceScore: 0.87,
      lastUpdated: '2024-01-14T15:45:00Z'
    },
    {
      id: '3',
      title: 'TechCorp Organization',
      description: 'Technology company organizing multiple events and conferences',
      type: 'organization',
      url: '/dashboard/organizations/3',
      icon: '🏢',
      metadata: { 
        events: 15, 
        members: 45, 
        verified: true,
        category: 'Technology'
      },
      relevanceScore: 0.82,
      lastUpdated: '2024-01-13T09:20:00Z'
    },
    {
      id: '4',
      title: 'Event Photography Services',
      description: 'Professional photography services for corporate events and conferences',
      type: 'marketplace',
      url: '/marketplace/services/4',
      icon: '📸',
      metadata: { 
        rating: 4.8, 
        bookings: 127, 
        price: '$500-2000',
        category: 'Photography'
      },
      relevanceScore: 0.78,
      lastUpdated: '2024-01-12T14:10:00Z'
    },
    {
      id: '5',
      title: 'John Smith',
      description: 'Senior Event Organizer at TechCorp with 8+ years of experience',
      type: 'user',
      url: '/dashboard/users/5',
      icon: '👤',
      metadata: { 
        role: 'organizer', 
        events: 8, 
        organization: 'TechCorp',
        verified: true
      },
      relevanceScore: 0.65,
      lastUpdated: '2024-01-11T11:30:00Z'
    },
    {
      id: '6',
      title: 'Startup Pitch Competition',
      description: 'Annual startup pitch competition for emerging technology companies',
      type: 'event',
      url: '/dashboard/events/6',
      icon: '🚀',
      metadata: { 
        status: 'upcoming', 
        attendees: 200, 
        date: '2024-04-20',
        location: 'Austin, TX',
        organizer: 'StartupHub'
      },
      relevanceScore: 0.72,
      lastUpdated: '2024-01-10T16:20:00Z'
    }
  ];

  // Filter results based on query and filters
  let filteredResults = allResults;
  
  if (query.trim()) {
    filteredResults = allResults.filter(result =>
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.description.toLowerCase().includes(query.toLowerCase()) ||
      (result.metadata?.organizer && result.metadata.organizer.toLowerCase().includes(query.toLowerCase()))
    );
  }

  // Apply filters
  Object.entries(filters).forEach(([filterType, values]) => {
    if (values.length > 0) {
      filteredResults = filteredResults.filter(result => {
        switch (filterType) {
          case 'type':
            return values.includes(result.type);
          case 'status':
            return values.includes(result.metadata?.status || '');
          case 'location':
            return values.some(value => 
              result.metadata?.location?.toLowerCase().includes(value.toLowerCase())
            );
          default:
            return true;
        }
      });
    }
  });

  // Sort by relevance score
  filteredResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  // Pagination
  const startIndex = (page - 1) * limit;
  const paginatedResults = filteredResults.slice(startIndex, startIndex + limit);

  // Generate suggestions
  const suggestions: SearchSuggestion[] = [
    { query: 'tech conference', type: 'popular', count: 45 },
    { query: 'marketing workspace', type: 'popular', count: 23 },
    { query: 'photography services', type: 'popular', count: 18 },
    { query: 'startup events', type: 'autocomplete', count: 12 },
  ];

  // Generate filters based on results
  const searchFilters: SearchFilter[] = [
    {
      type: 'type',
      label: 'Content Type',
      options: [
        { value: 'event', label: 'Events', count: filteredResults.filter(r => r.type === 'event').length },
        { value: 'workspace', label: 'Workspaces', count: filteredResults.filter(r => r.type === 'workspace').length },
        { value: 'organization', label: 'Organizations', count: filteredResults.filter(r => r.type === 'organization').length },
        { value: 'marketplace', label: 'Services', count: filteredResults.filter(r => r.type === 'marketplace').length },
        { value: 'user', label: 'Users', count: filteredResults.filter(r => r.type === 'user').length },
      ].filter(option => option.count > 0)
    },
    {
      type: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active', count: filteredResults.filter(r => r.metadata?.status === 'active').length },
        { value: 'upcoming', label: 'Upcoming', count: filteredResults.filter(r => r.metadata?.status === 'upcoming').length },
        { value: 'completed', label: 'Completed', count: filteredResults.filter(r => r.metadata?.status === 'completed').length },
      ].filter(option => option.count > 0)
    }
  ];

  return {
    results: paginatedResults,
    total: filteredResults.length,
    suggestions,
    filters: searchFilters
  };
};

export const SearchPage: React.FC<SearchPageProps> = ({ className = '' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);

  // Load saved data from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('searchRecent');
    const saved = localStorage.getItem('searchSaved');
    
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
    
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved searches:', error);
      }
    }
  }, []);

  // Perform search when query or filters change
  const performSearch = useCallback(async () => {
    if (!query.trim() && Object.keys(activeFilters).length === 0) {
      setResults([]);
      setTotal(0);
      return;
    }

    setIsLoading(true);
    try {
      const response = await mockSearchAPI(query, activeFilters, currentPage);
      setResults(response.results);
      setTotal(response.total);
      setSuggestions(response.suggestions);
      setFilters(response.filters);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [query, activeFilters, currentPage]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Update URL when query changes
  useEffect(() => {
    if (query.trim()) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setCurrentPage(1);
    
    // Add to recent searches
    if (searchQuery.trim()) {
      const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
      setRecentSearches(newRecent);
      localStorage.setItem('searchRecent', JSON.stringify(newRecent));
    }
  };

  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    setActiveFilters(prev => {
      const current = prev[filterType] || [];
      const updated = checked
        ? [...current, value]
        : current.filter(v => v !== value);
      
      return {
        ...prev,
        [filterType]: updated
      };
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setCurrentPage(1);
  };

  const saveSearch = () => {
    if (query.trim() && !savedSearches.includes(query)) {
      const newSaved = [...savedSearches, query];
      setSavedSearches(newSaved);
      localStorage.setItem('searchSaved', JSON.stringify(newSaved));
    }
  };

  const removeSavedSearch = (searchQuery: string) => {
    const newSaved = savedSearches.filter(s => s !== searchQuery);
    setSavedSearches(newSaved);
    localStorage.setItem('searchSaved', JSON.stringify(newSaved));
  };

  const activeFilterCount = Object.values(activeFilters).flat().length;

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <PageHeader
        title="Search"
        subtitle={query ? `Results for "${query}"` : 'Search across all content'}
        actions={[
          {
            label: 'Save Search',
            action: saveSearch,
            icon: BookmarkIcon,
            variant: 'secondary',
            disabled: !query.trim() || savedSearches.includes(query)
          }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Search Input */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                  placeholder="Search events, workspaces, organizations..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={() => handleSearch(query)}
                className="w-full mt-3 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                Search
              </button>
            </div>

            {/* Filters and Search History */}
            <SearchFilters
              filters={filters}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              recentSearches={recentSearches}
              savedSearches={savedSearches}
              onRecentSearchClick={handleSearch}
              onSavedSearchClick={handleSearch}
              onRemoveSavedSearch={removeSavedSearch}
            />
          </div>

          {/* Search Results */}
          <div className="flex-1">
            {isLoading ? (
              <SkeletonList />
            ) : (
              <div className="space-y-4">
                {/* Results Header */}
                {(query.trim() || activeFilterCount > 0) && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          {total} result{total !== 1 ? 's' : ''} 
                          {query && ` for "${query}"`}
                          {activeFilterCount > 0 && ` with ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1">
                          <AdjustmentsHorizontalIcon className="h-4 w-4" />
                          <span>Sort</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* No Results */}
                {!isLoading && (query.trim() || activeFilterCount > 0) && results.length === 0 && (
                  <div className="bg-card rounded-lg shadow-sm border border-border p-8">
                    <SearchEmptyState
                      searchTerm={query}
                      onClear={() => {
                        setActiveFilters({});
                        handleSearch('');
                      }}
                    />
                    {suggestions.length > 0 && (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-muted-foreground mb-2">Popular searches:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {suggestions.slice(0, 4).map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearch(suggestion.query)}
                              className="text-sm text-primary hover:text-primary/80 bg-primary/10 px-3 py-1 rounded-full"
                            >
                              {suggestion.query}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Search Results */}
                {results.map((result) => (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    showRelevanceScore={true}
                  />
                ))}

                {/* Pagination */}
                {total > 20 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, total)} of {total} results
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={currentPage * 20 >= total}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;