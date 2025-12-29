import React from 'react';
import {
  FunnelIcon,
  ClockIcon,
  BookmarkIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface SearchFilter {
  type: string;
  label: string;
  options: Array<{
    value: string;
    label: string;
    count?: number;
  }>;
}

interface SearchFiltersProps {
  filters: SearchFilter[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (filterType: string, value: string, checked: boolean) => void;
  onClearFilters: () => void;
  recentSearches: string[];
  savedSearches: string[];
  onRecentSearchClick: (query: string) => void;
  onSavedSearchClick: (query: string) => void;
  onRemoveSavedSearch: (query: string) => void;
  className?: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  recentSearches,
  savedSearches,
  onRecentSearchClick,
  onSavedSearchClick,
  onRemoveSavedSearch,
  className = '',
}) => {
  const activeFilterCount = Object.values(activeFilters).flat().length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </h3>
            {activeFilterCount > 0 && (
              <button
                onClick={onClearFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {filters.map((filter) => (
            <div key={filter.type}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">{filter.label}</h4>
              <div className="space-y-2">
                {filter.options.map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(activeFilters[filter.type] || []).includes(option.value)}
                      onChange={(e) => onFilterChange(filter.type, option.value, e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-600 flex-1 group-hover:text-gray-900">
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        {option.count}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
          
          {filters.length === 0 && (
            <div className="text-center py-4">
              <FunnelIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No filters available</p>
              <p className="text-xs text-gray-400">Perform a search to see filter options</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <ClockIcon className="h-4 w-4" />
            <span>Recent Searches</span>
          </h3>
          <div className="space-y-1">
            {recentSearches.slice(0, 5).map((recentQuery, index) => (
              <button
                key={index}
                onClick={() => onRecentSearchClick(recentQuery)}
                className="w-full text-left text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 py-2 px-3 rounded-md transition-colors"
              >
                {recentQuery}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
            <BookmarkIcon className="h-4 w-4" />
            <span>Saved Searches</span>
          </h3>
          <div className="space-y-1">
            {savedSearches.map((savedQuery, index) => (
              <div key={index} className="flex items-center justify-between group">
                <button
                  onClick={() => onSavedSearchClick(savedQuery)}
                  className="flex-1 text-left text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 py-2 px-3 rounded-md transition-colors"
                >
                  {savedQuery}
                </button>
                <button
                  onClick={() => onRemoveSavedSearch(savedQuery)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 p-1 rounded transition-all"
                  title="Remove saved search"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Tips */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Search Tips</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Use quotes for exact phrases: "tech conference"</li>
          <li>• Search by location: events in "San Francisco"</li>
          <li>• Filter by type to narrow results</li>
          <li>• Save frequent searches for quick access</li>
        </ul>
      </div>
    </div>
  );
};

export default SearchFilters;