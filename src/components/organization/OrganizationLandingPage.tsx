import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { useSeo } from '@/hooks/useSeo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/looseClient';
import { OrganizationProductsSection } from './OrganizationProductsSection';
import { OrganizationProfile } from './OrganizationProfile';

interface OrganizationLandingPageProps {
  slug?: string;
}

export function OrganizationLandingPage({ slug }: OrganizationLandingPageProps) {
  const params = useParams();
  const orgSlug = slug ?? params.orgSlug;

  const {
    data: organization,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['public-organization', orgSlug],
    enabled: !!orgSlug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['public-organization-products', organization?.id],
    enabled: !!organization?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_products')
        .select('*')
        .eq('organization_id', organization!.id)
        .eq('status', 'ACTIVE')
        .order('position', { ascending: true, nullsLast: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  useSeo({
    title: organization
      ? `${organization.seo_title || organization.name} | Thittam1Hub`
      : 'Organization | Thittam1Hub',
    description:
      organization?.seo_description ||
      `Explore official events, products, and updates from ${organization?.name || 'this organization'} on Thittam1Hub.`,
    canonicalPath: orgSlug ? `/${orgSlug}` : window.location.pathname,
    ogImagePath: organization?.seo_image_url || organization?.logo_url || undefined,
    ogType: 'website',
  });

  useEffect(() => {
    if (!organization) return;

    try {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: organization.name,
        url: window.location.href,
        logo: organization.logo_url || undefined,
        description: organization.description || undefined,
        address:
          organization.city || organization.state || organization.country
            ? {
                '@type': 'PostalAddress',
                addressLocality: organization.city || undefined,
                addressRegion: organization.state || undefined,
                addressCountry: organization.country || undefined,
              }
            : undefined,
      };

      let script = document.querySelector<HTMLScriptElement>(
        'script[type="application/ld+json"][data-org-jsonld="true"]',
      );
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.dataset.orgJsonld = 'true';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } catch (_seoError) {
      // SEO metadata injection failed silently
    }
  }, [organization]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
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
              We couldn&apos;t find an organization for this URL. Please check the link or contact the
              organizer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen bg-background"
      style={
        organization.primary_color
          ? {
              backgroundImage: `linear-gradient(to bottom, ${organization.primary_color}, rgba(0,0,0,0))`,
            }
          : undefined
      }
    >
      {/* Hero */}
      <section className="container mx-auto px-4 pt-8 pb-4">
        <div className="relative overflow-hidden rounded-3xl bg-card/80 border border-border/60 shadow-xl backdrop-blur-xl px-4 py-5 sm:px-6 sm:py-6 animate-fade-in">
          {/* Soft banner strip */}
          <div className="absolute inset-x-4 -top-10 h-32 rounded-3xl bg-gradient-to-r from-primary/80 to-accent/80 opacity-90 blur-[1px]" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Logo tile */}
              <div className="relative shrink-0">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-background/90 border border-border/70 shadow-md flex items-center justify-center text-lg font-semibold text-primary">
                  {organization.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt={`${organization.name} logo`}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <span aria-hidden="true">{organization.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Organization
                </p>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                  Welcome to{' '}
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {organization.name}
                  </span>
                </h1>
                {organization.city && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Based in {organization.city}
                    {organization.state ? `, ${organization.state}` : ''}
                    {organization.country ? `, ${organization.country}` : ''}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                  {organization.category && (
                    <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-2.5 py-1 font-medium text-muted-foreground">
                      {organization.category}
                    </span>
                  )}
                  {products.length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-1 font-medium">
                      {products.length} product{products.length === 1 ? '' : 's'} available
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-stretch sm:items-end gap-2 sm:gap-3">
              <Link
                to={`/${organization.slug}/products`}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-px hover-scale"
              >
                <Package className="h-4 w-4 mr-1.5" aria-hidden="true" />
                View all products
              </Link>
              {organization.website && (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-[11px] sm:text-xs font-medium text-muted-foreground hover:bg-muted/70 transition-colors"
                >
                  Visit website
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products + profile & details */}
      <section className="container mx-auto px-4 pb-10">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-[0.2em]">
            Products
          </h2>
          <Link
            to={`/${organization.slug}/products`}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-px"
          >
            <Package className="h-3 w-3" aria-hidden="true" />
            <span>View all products</span>
          </Link>
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-8">
            <OrganizationProductsSection products={products} />
            <OrganizationProfile organizationId={organization.id} />

            <Card className="border-border/60 bg-background/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle>About {organization.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Category:</span>{' '}
                  <span>{organization.category}</span>
                </div>
                {organization.description && (
                  <div>
                    <span className="font-medium text-foreground">Summary:</span>{' '}
                    <span className="whitespace-pre-line">{organization.description}</span>
                  </div>
                )}
                {(organization.city || organization.state || organization.country) && (
                  <div>
                    <span className="font-medium text-foreground">Location:</span>{' '}
                    <span>
                      {[organization.city, organization.state, organization.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
                {(organization.website || organization.email || organization.phone) && (
                  <div className="flex flex-col gap-1">
                    {organization.website && (
                      <div>
                        <span className="font-medium text-foreground">Website:</span>{' '}
                        <a
                          href={organization.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline-offset-2 hover:underline text-primary"
                        >
                          {organization.website}
                        </a>
                      </div>
                    )}
                    {organization.email && (
                      <div>
                        <span className="font-medium text-foreground">Email:</span>{' '}
                        <a
                          href={`mailto:${organization.email}`}
                          className="underline-offset-2 hover:underline text-primary"
                        >
                          {organization.email}
                        </a>
                      </div>
                    )}
                    {organization.phone && (
                      <div>
                        <span className="font-medium text-foreground">Phone:</span>{' '}
                        <a
                          href={`tel:${organization.phone}`}
                          className="underline-offset-2 hover:underline text-primary"
                        >
                          {organization.phone}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                {(organization.gov_registration_id || organization.verification_status) && (
                  <div>
                    <span className="font-medium text-foreground">Verification:</span>{' '}
                    <span>
                      {organization.verification_status
                        ? `${organization.verification_status} via ${
                            organization.verification_source ?? 'self-reported'
                          }`
                        : 'Not provided'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            {/* Sponsors & testimonials sidebar moved to dedicated settings pages; keep layout simple here */}
          </aside>
        </div>
      </section>
    </main>
  );
}
