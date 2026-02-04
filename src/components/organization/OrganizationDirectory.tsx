import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/looseClient';
import { Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';


type OrganizationRow = Tables<'organizations'>;

export interface DirectoryOrganization extends OrganizationRow {
  follower_count: number;
}

const categoryLabels: Record<string, string> = {
  COLLEGE: 'College',
  COMPANY: 'Company',
  INDUSTRY: 'Industry Association',
  NON_PROFIT: 'Non-Profit',
};

const categoryIcons: Record<string, string> = {
  COLLEGE: '🎓',
  COMPANY: '🏢',
  INDUSTRY: '🏭',
  NON_PROFIT: '🤝',
};

const sortOptions = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'followers_desc', label: 'Most followers' },
  { value: 'recent', label: 'Recently added' },
];

export const OrganizationDirectory: React.FC = () => {
  const [organizations, setOrganizations] = useState<DirectoryOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sort, setSort] = useState('followers_desc');

  useEffect(() => {
    const loadOrganizations = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading organizations directory', error);
        setOrganizations([]);
      } else {
        const withFollowers: DirectoryOrganization[] = (data ?? []).map((org: any) => ({
          ...org,
          follower_count: org.follower_count ?? 0,
        }));
        setOrganizations(withFollowers);
      }

      setIsLoading(false);
    };

    loadOrganizations();
  }, []);

  useEffect(() => {
    document.title = 'Organizations | Thittam1Hub';

    const description =
      'Discover and follow organizations on Thittam1Hub to stay updated on their latest events.';

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/organizations`);
  }, []);

  const filtered = organizations
    .filter((org) => {
      const matchesSearch =
        !search ||
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        (org.description ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || org.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sort) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'followers_desc':
          return (b.follower_count ?? 0) - (a.follower_count ?? 0);
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const hasActiveFilters = !!search || !!categoryFilter;

  return (
    <div className="bg-gradient-to-b from-cream to-lavender/30 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Discover
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Explore organizations on{' '}
              <span className="bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent">
                Thittam1Hub
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Find colleges, companies, industry groups, and non-profits running events and programs on
              Thittam1Hub.
            </p>
          </div>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <Input
            placeholder="Search by name or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/80 border-border/60"
          />
          <Select
            value={categoryFilter ?? 'all'}
            onValueChange={(value) => setCategoryFilter(value === 'all' ? null : value)}
          >
            <SelectTrigger className="bg-white/80 border-border/60">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="COLLEGE">College</SelectItem>
              <SelectItem value="COMPANY">Company</SelectItem>
              <SelectItem value="INDUSTRY">Industry Association</SelectItem>
              <SelectItem value="NON_PROFIT">Non-Profit</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="bg-white/80 border-border/60">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-border/60 p-4 sm:p-6 shadow-sm">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-base font-semibold mb-2">No organizations found</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {hasActiveFilters
                  ? 'Try adjusting your search criteria or filters.'
                  : 'No organizations are currently available.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 sm:mb-6">
                <p className="text-sm text-muted-foreground">
                  Showing {filtered.length} organization
                  {filtered.length !== 1 ? 's' : ''}
                  {hasActiveFilters && ' matching your criteria'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filtered.map((organization) => (
                  <OrganizationCard key={organization.id} organization={organization} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface OrganizationCardProps {
  organization: DirectoryOrganization;
}

function OrganizationCard({ organization }: OrganizationCardProps) {
  const categoryIcon = categoryIcons[organization.category as keyof typeof categoryIcons];

  return (
    <Link
      to={`/${organization.slug}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-6">
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
            <span className="text-blue-500 text-xl" title="Verified Organization">
              ✓
            </span>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {organization.name}
          </h3>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span className="mr-1">{categoryIcon}</span>
            {categoryLabels[organization.category as keyof typeof categoryLabels]}
          </div>
          {organization.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{organization.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <span className="mr-1">Followers:</span>
            {organization.follower_count} follower
            {organization.follower_count !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default OrganizationDirectory;
