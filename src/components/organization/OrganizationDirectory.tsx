import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSearchOrganizations } from '@/hooks/useOrganization';
import { organizationService } from '@/services/organizationService';

// Keep a local view of categories in sync with backend enum
export type OrganizationCategory = 'COLLEGE' | 'COMPANY' | 'INDUSTRY' | 'NON_PROFIT';

// Infer organization type from service result
export type DirectoryOrganization = Awaited<
  ReturnType<typeof organizationService.searchOrganizations>
>[number];

interface OrganizationDirectoryProps {
  className?: string;
}

const categoryIcons: Record<OrganizationCategory, string> = {
  COLLEGE: 'COL',
  COMPANY: 'COM',
  INDUSTRY: 'IND',
  NON_PROFIT: 'NPO',
};

const categoryLabels: Record<OrganizationCategory, string> = {
  COLLEGE: 'College',
  COMPANY: 'Company',
  INDUSTRY: 'Industry',
  NON_PROFIT: 'Non-Profit',
};

const CATEGORIES: OrganizationCategory[] = ['COLLEGE', 'COMPANY', 'INDUSTRY', 'NON_PROFIT'];

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

  const { data: organizations, isLoading, error } = useSearchOrganizations({
    query: debouncedQuery.trim() || undefined,
    category: selectedCategory || undefined,
    verifiedOnly,
    limit: 50,
    offset: 0,
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
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Organization Directory</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Discover verified organizations and their upcoming events
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6 mb-6 sm:mb-8">
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-muted-foreground">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <span className="mr-2">🔽</span>
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                Active
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as OrganizationCategory | '')}
                  className="block w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {categoryLabels[category]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verification Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Verification Status
                </label>
                <div className="flex items-center">
                  <input
                    id="verified-only"
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <label htmlFor="verified-only" className="ml-2 block text-sm text-foreground">
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading organizations. Please try again.</p>
          </div>
        ) : !organizations || organizations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl text-muted-foreground mb-4">🏢</div>
            <h3 className="mt-2 text-sm font-medium text-foreground">No organizations found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasActiveFilters
                ? 'Try adjusting your search criteria or filters.'
                : 'No organizations are currently available.'}
            </p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-4 sm:mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
                {hasActiveFilters && ' matching your criteria'}
              </p>
            </div>

            {/* Organization Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
  organization: DirectoryOrganization;
}

function OrganizationCard({ organization }: OrganizationCardProps) {
  const categoryIcon = categoryIcons[organization.category as OrganizationCategory];

  return (
    <Link
      to={`/organizations/${organization.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-6">
        {/* Header with Logo and Verification */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {organization.logo_url ? (
              <img
                src={organization.logo_url}
                alt={`${organization.name} logo`}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                {categoryIcon}
              </div>
            )}
          </div>
          {organization.verification_status === 'VERIFIED' && (
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
            {categoryLabels[organization.category as OrganizationCategory]}
          </div>
          {organization.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {organization.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <span className="mr-1">Followers:</span>
            {organization.follower_count} follower{organization.follower_count !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </Link>
  );
}