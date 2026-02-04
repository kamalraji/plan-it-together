import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/looseClient';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizationProductsSection } from '@/components/organization/OrganizationProductsSection';
import { OrganizationBreadcrumbs } from '@/components/organization/OrganizationBreadcrumbs';


type OrganizationRow = Tables<'organizations'>;

export const OrganizationProductsLandingPage: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [organization, setOrganization] = useState<OrganizationRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Tables<'organization_products'>[]>([]);

  useEffect(() => {
    const fetchOrgAndProducts = async () => {
      if (!orgSlug) {
        setError('Organization not found');
        setIsLoading(false);
        return;
      }

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .maybeSingle();

      if (orgError || !org) {
        setError('Organization not found');
        setIsLoading(false);
        return;
      }

      setOrganization(org as OrganizationRow);

      const { data: productsData, error: productsError } = await supabase
        .from('organization_products')
        .select('*')
        .eq('organization_id', org.id)
        .eq('status', 'ACTIVE')
        .order('is_featured', { ascending: false })
        .order('featured_position', { ascending: true, nullsFirst: false })
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (productsError) {
        // Silent fail - UI will show empty state
      } else {
        setProducts(productsData ?? []);
      }

      setIsLoading(false);
    };

    fetchOrgAndProducts();
  }, [orgSlug]);

  useEffect(() => {
    if (!organization) return;

    try {
      document.title = `${organization.name} products | Thittam1Hub`;

      const description =
        organization.description ||
        `Explore products and resources from ${organization.name} on Thittam1Hub.`;

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
      canonical.setAttribute(
        'href',
        `${window.location.origin}/${organization.slug}/products`,
      );
    } catch {
      // SEO metadata failed - non-critical
    }
  }, [organization]);

  const initialSearch = searchParams.get('q') ?? '';
  const initialCategory = searchParams.get('category') ?? 'all';
  const initialOnlyFree = searchParams.get('free') === '1';

  const handleFiltersChange = (filters: {
    search: string;
    category: string;
    onlyFree: boolean;
  }) => {
    const next = new URLSearchParams(searchParams.toString());
    if (filters.search) next.set('q', filters.search);
    else next.delete('q');
    if (filters.category && filters.category !== 'all')
      next.set('category', filters.category);
    else next.delete('category');
    if (filters.onlyFree) next.set('free', '1');
    else next.delete('free');
    setSearchParams(next, { replace: true });
  };

  const recordProductMetrics = async (
    eventType: 'impression' | 'click',
    productIds: string[],
  ) => {
    try {
      await supabase.rpc('record_organization_product_metrics', {
        _event_type: eventType,
        _product_ids: productIds,
      });
    } catch {
      // Metrics recording failed - non-critical
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Organization not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              We couldn&apos;t find an organization for this URL. Please check the
              link or contact the organizer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleScrollToProducts = () => {
    const el = document.getElementById('org-products-list');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="bg-gradient-to-b from-background to-accent/20 min-h-screen">
      <section className="container mx-auto px-4 pt-8 pb-4 space-y-3 animate-fade-in">
        <OrganizationBreadcrumbs
          className="mb-1"
          items={[
            {
              label: organization.name,
              href: `/${organization.slug}`,
              icon: (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {organization.name.charAt(0).toUpperCase()}
                </span>
              ),
            },
            {
              label: 'Products',
              isCurrent: true,
            },
          ]}
        />
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Products
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Products from{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {organization.name}
              </span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Browse products, programs, and resources offered by this organization.
            </p>
          </div>
          <button
            type="button"
            onClick={handleScrollToProducts}
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs sm:text-sm font-medium text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg hover-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-px mt-1 sm:mt-0 self-start sm:self-auto"
          >
            Explore featured products
          </button>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-10" id="org-products-list">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1.2fr)]">
          <div className="animate-fade-in">
            <OrganizationProductsSection
              products={products}
              initialSearch={initialSearch}
              initialCategory={initialCategory}
              initialOnlyFree={initialOnlyFree}
              onFiltersChange={handleFiltersChange}
              onProductClick={(productId) =>
                recordProductMetrics('click', [productId])
              }
              onVisible={(ids) => recordProductMetrics('impression', ids)}
            />
          </div>

          <aside className="space-y-4 lg:space-y-5">
            <Card className="border-dashed border-primary/30 bg-card/80 backdrop-blur-sm animate-fade-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center justify-between gap-2">
                  <span>Products overview</span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {products.length} active
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <p>
                  Use search, categories, and the free-only filter to quickly find the most relevant
                  resources for your participants.
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground/80">
                  Organizers can track engagement with each product via the management dashboard.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-border/70 animate-fade-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base">Tips for exploring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <ul className="space-y-1 list-disc list-inside">
                  <li>Start with featured or top-positioned products.</li>
                  <li>Use tags and categories to narrow down by theme.</li>
                  <li>Look for "free" offerings to try things out quickly.</li>
                </ul>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
};
