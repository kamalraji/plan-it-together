import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
// Using simple text/emoji icons instead of heroicons for now
import api from '../../lib/api';
import { Organization, OrganizationCategory } from '../../types';

interface SearchOrganizationsParams {
  query?: string;
  category?: OrganizationCategory;
  verifiedOnly?: boolean;
  limit?: number;
  offset?: number;
}

interface OrganizationDirectoryProps {
  className?: string;
}

const categoryIcons = {
  [OrganizationCategory.COLLEGE]: '🎓',
  [OrganizationCategory.COMPANY]: '🏢',
  [OrganizationCategory.INDUSTRY]: '🏭',
  [OrganizationCategory.NON_PROFIT]: '❤️',
};

const categoryLabels = {
  [OrganizationCategory.COLLEGE]: 'College',
  [OrganizationCategory.COMPANY]: 'Company',
  [OrganizationCategory.INDUSTRY]: 'Industry',
  [OrganizationCategory.NON_PROFIT]: 'Non-Profit',
};

export default function OrganizationDirectory({ className = '' }: OrganizationDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<OrganizationCategory | ''>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: organizations, isLoading, error } = useQuery({
    queryKey: ['organizations', debouncedQuery, selectedCategory, verifiedOnly],
    queryFn: async () => {
      const params: SearchOrganizationsParams = {
        limit: 50,
        offset: 0,
      };

      if (debouncedQuery.trim()) {
        params.query = debouncedQuery.trim();
      }

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      if (verifiedOnly) {
        params.verifiedOnly = true;
      }

      const response = await api.get('/discovery/organizations', { params });
      return response.data.data as Organization[];
    },
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setVerifiedOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedCategory || verifiedOnly;

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Directory</h1>
        <p className="text-gray-600">
          Discover verified organizations and their upcoming events
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span className="mr-2">🔽</span>
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Active
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as OrganizationCategory | '')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Categories</option>
                  {Object.values(OrganizationCategory).map((category) => (
                    <option key={category} value={category}>
                      {categoryLabels[category]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verification Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Status
                </label>
                <div className="flex items-center">
                  <input
                    id="verified-only"
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="verified-only" className="ml-2 block text-sm text-gray-900">
                    Show only verified organizations
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Error loading organizations. Please try again.</p>
          </div>
        ) : !organizations || organizations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl text-gray-400 mb-4">🏢</div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {hasActiveFilters 
                ? 'Try adjusting your search criteria or filters.'
                : 'No organizations are currently available.'}
            </p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Showing {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
                {hasActiveFilters && ' matching your criteria'}
              </p>
            </div>

            {/* Organization Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map((organization) => (
                <OrganizationCard key={organization.id} organization={organization} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface OrganizationCardProps {
  organization: Organization;
}

function OrganizationCard({ organization }: OrganizationCardProps) {
  const categoryIcon = categoryIcons[organization.category];

  return (
    <Link
      to={`/organizations/${organization.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-6">
        {/* Header with Logo and Verification */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {organization.branding?.logoUrl ? (
              <img
                src={organization.branding.logoUrl}
                alt={`${organization.name} logo`}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                {categoryIcon}
              </div>
            )}
          </div>
          {organization.verificationStatus === 'VERIFIED' && (
            <span className="text-blue-500 text-xl" title="Verified Organization">✓</span>
          )}
        </div>

        {/* Organization Info */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {organization.name}
          </h3>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span className="mr-1">{categoryIcon}</span>
            {categoryLabels[organization.category]}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {organization.description}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <span className="mr-1">👥</span>
            {organization.followerCount} follower{organization.followerCount !== 1 ? 's' : ''}
          </div>
          <div>
            {organization.eventCount} event{organization.eventCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </Link>
  );
}