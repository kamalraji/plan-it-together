import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { preferenceStorage } from '@/lib/storage';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import { SearchEmptyState } from '@/components/ui/empty-state';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'event' | 'workspace' | 'organization' | 'service' | 'user' | 'marketplace';
  url: string;
  icon?: string;
  metadata?: Record<string, any>;
}

export interface SearchCategory {
  type: string;
  displayName: string;
  icon: React.ComponentType<{ className?: string }>;
  results: SearchResult[];
}

interface GlobalSearchProps {
  onSearch: (query: string) => void;
  className?: string;
  placeholder?: string;
  showShortcuts?: boolean;
}

// Mock search results - in a real app, this would come from an API
const mockSearchResults = (query: string): SearchResult[] => {
  if (!query.trim()) return [];

  const allResults: SearchResult[] = [
    {
      id: '1',
      title: 'Annual Conference 2024',
      description: 'Large-scale technology conference with 500+ attendees',
      type: 'event',
      url: '/dashboard/eventmanagement/1',
      icon: '',
      metadata: { status: 'active', attendees: 523 }
    },
    {
      id: '2',
      title: 'Marketing Team Workspace',
      description: 'Collaborative workspace for marketing campaign planning',
      type: 'workspace',
      url: '/dashboard/workspaces/2',
      icon: '',
      metadata: { members: 12, tasks: 34 }
    },
    {
      id: '3',
      title: 'TechCorp Organization',
      description: 'Technology company organizing multiple events',
      type: 'organization',
      url: '/dashboard/organizations/3',
      icon: '',
      metadata: { events: 15, members: 45 }
    },
    {
      id: '4',
      title: 'Event Photography Services',
      description: 'Professional photography for corporate events',
      type: 'marketplace',
      url: '/marketplace/services/4',
      icon: '',
      metadata: { rating: 4.8, bookings: 127 }
    },
    {
      id: '5',
      title: 'John Smith',
      description: 'Event Organizer at TechCorp',
      type: 'user',
      url: '/dashboard/users/5',
      icon: '',
      metadata: { role: 'organizer', events: 8 }
    }
  ];

  return allResults.filter(result =>
    result.title.toLowerCase().includes(query.toLowerCase()) ||
    result.description.toLowerCase().includes(query.toLowerCase())
  );
};

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onSearch,
  className = '',
  placeholder = 'Search services, resources...',
  showShortcuts = true,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load recent searches from centralized preference storage
  useEffect(() => {
    const saved = preferenceStorage.getJSON<string[]>('globalSearchRecent');
    if (saved) {
      setRecentSearches(saved);
    }
  }, []);

  // Debounced search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const searchResults = mockSearchResults(searchQuery);
      setResults(searchResults);
      setIsLoading(false);
    },
    []
  );

  // Handle input change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const categories: SearchCategory[] = Object.entries(groupedResults).map(([type, results]) => ({
    type,
    displayName: getDisplayName(type),
    icon: getTypeIcon(type),
    results,
  }));

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalResults = results.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < totalResults - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        } else if (query.trim()) {
          handleSearchSubmit();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSearchSubmit = () => {
    if (!query.trim()) return;

    // Add to recent searches
    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecent);
    preferenceStorage.setJSON('globalSearchRecent', newRecent);

    // Perform search
    onSearch(query);
    navigate(`/console/search?q=${encodeURIComponent(query)}`);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleResultClick = (result: SearchResult) => {
    // Add to recent searches
    const searchTerm = result.title;
    const newRecent = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(newRecent);
    preferenceStorage.setJSON('globalSearchRecent', newRecent);

    navigate(result.url);
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    onSearch(recentQuery);
    navigate(`/console/search?q=${encodeURIComponent(recentQuery)}`);
    setIsOpen(false);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    preferenceStorage.remove('globalSearchRecent');
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2 border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all ${
            isOpen ? 'bg-card' : 'bg-muted'
          }`}
          autoComplete="off"
        />
        {showShortcuts && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center space-x-1 text-xs text-muted-foreground">
            <CommandLineIcon className="h-3 w-3" />
            <span>⌘K</span>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-md shadow-lg ring-1 ring-border z-50 max-h-96 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            </div>
          )}

          {/* No Query State - Show Recent Searches */}
          {!query.trim() && !isLoading && (
            <div className="p-4">
              {recentSearches.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Recent Searches
                    </h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((recentQuery, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(recentQuery)}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-left hover:bg-muted rounded-md"
                      >
                        <ClockIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{recentQuery}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <MagnifyingGlassIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Start typing to search</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Search across events, workspaces, organizations, and more
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Search Results */}
          {query.trim() && !isLoading && (
            <div className="p-4">
              {results.length === 0 ? (
                <SearchEmptyState searchTerm={query} />
              ) : (
                <>
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground">
                      {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                    </p>
                  </div>
                  
                  {categories.map((category) => (
                    <div key={category.type} className="mb-4 last:mb-0">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center space-x-2">
                        <category.icon className="h-3 w-3" />
                        <span>{category.displayName}</span>
                      </h3>
                      <div className="space-y-1">
                        {category.results.map((result) => {
                          const globalIndex = results.indexOf(result);
                          return (
                            <button
                              key={result.id}
                              onClick={() => handleResultClick(result)}
                              className={`w-full flex items-center space-x-3 px-3 py-2 text-sm text-left rounded-md transition-colors ${
                                selectedIndex === globalIndex
                                  ? 'bg-primary/10 text-primary'
                                  : 'hover:bg-muted text-foreground'
                              }`}
                            >
                              <span className="text-lg flex-shrink-0">{result.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{result.title}</div>
                                <div className="text-xs text-muted-foreground truncate">{result.description}</div>
                                {result.metadata && (
                                  <div className="text-xs text-muted-foreground/70 mt-1">
                                    {getMetadataDisplay(result)}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper functions
function getDisplayName(type: string): string {
  const displayNames: Record<string, string> = {
    event: 'Events',
    workspace: 'Workspaces',
    organization: 'Organizations',
    service: 'Services',
    user: 'Users',
    marketplace: 'Marketplace',
  };
  return displayNames[type] || type;
}

function getTypeIcon(type: string): React.ComponentType<{ className?: string }> {
  const IconComponent: React.FC<{ className?: string }> = ({ className }) => (
    <span className={className}></span>
  );
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    event: IconComponent,
    workspace: IconComponent,
    organization: IconComponent,
    service: IconComponent,
    user: IconComponent,
    marketplace: IconComponent,
  };
  return icons[type] || IconComponent;
}

function getMetadataDisplay(result: SearchResult): string {
  if (!result.metadata) return '';
  
  switch (result.type) {
    case 'event':
      return `${result.metadata.attendees} attendees • ${result.metadata.status}`;
    case 'workspace':
      return `${result.metadata.members} members • ${result.metadata.tasks} tasks`;
    case 'organization':
      return `${result.metadata.events} events • ${result.metadata.members} members`;
    case 'marketplace':
      return `${result.metadata.rating}★ • ${result.metadata.bookings} bookings`;
    case 'user':
      return `${result.metadata.role} • ${result.metadata.events} events`;
    default:
      return '';
  }
}

export default GlobalSearch;