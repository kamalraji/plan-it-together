import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/looseClient';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizationProductsSection } from '@/components/organization/OrganizationProductsSection';


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
        console.error('Error loading organization products', productsError);
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
    } catch (seoError) {
      console.warn(
        'Unable to set SEO metadata for organization products page',
        seoError,
      );
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
    } catch (rpcError) {
      console.error('Error recording product metrics', rpcError);
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

  return (
    <main className="bg-gradient-to-b from-background to-accent/20 min-h-screen">
      <section className="container mx-auto px-4 pt-8 pb-4 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Products
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Products from{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {organization.name}
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Browse products, programs, and resources offered by this organization.
        </p>
      </section>

      <section className="container mx-auto px-4 pb-10">
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
      </section>
    </main>
  );
};
