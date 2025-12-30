import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/looseClient';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizationProfile } from '@/components/organization/OrganizationProfile';
import { Calendar, Quote, Star, Package } from 'lucide-react';
import { OrganizationProductsSection } from '@/components/organization/OrganizationProductsSection';


type OrganizationRow = Tables<'organizations'>;

type TestimonialRow = Tables<'organization_testimonials'>;
type SponsorRow = Tables<'organization_sponsors'>;
type EventRow = Tables<'events'>;
type ProductRow = Tables<'organization_products'>;

export const OrganizationLandingPage: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [organization, setOrganization] = useState<OrganizationRow | null>(null);
  const [featuredEvents, setFeaturedEvents] = useState<EventRow[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [sponsors, setSponsors] = useState<SponsorRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizationAndContent = async () => {
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

      if (orgError) {
        console.error('Error loading organization by slug', orgError);
        setError('Unable to load organization');
        setIsLoading(false);
        return;
      }

      if (!org) {
        setError('Organization not found');
        setIsLoading(false);
        return;
      }

      setOrganization(org as OrganizationRow);

      try {
        document.title = `${org.name} | Thittam1Hub`;

        const description =
          org.description ||
          `Discover events and updates from ${org.name} on Thittam1Hub.`;

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
          `${window.location.origin}/${org.slug}`,
        );
      } catch (seoError) {
        console.warn('Unable to set SEO metadata for organization page', seoError);
      }

      try {
        const [
          eventsResult,
          testimonialsResult,
          sponsorsResult,
          productsResult,
        ] = await Promise.all([
          supabase
            .from('events')
            .select('*')
            .eq('organization_id', org.id)
            .eq('visibility', 'PUBLIC')
            .eq('status', 'PUBLISHED')
            .order('start_date', { ascending: false })
            .limit(3),
          supabase
            .from('organization_testimonials')
            .select('*')
            .eq('organization_id', org.id)
            .order('highlight', { ascending: false })
            .order('position', { ascending: true })
            .limit(4),
          supabase
            .from('organization_sponsors')
            .select('*')
            .eq('organization_id', org.id)
            .order('position', { ascending: true })
            .limit(8),
          supabase
            .from('organization_products')
            .select('*')
            .eq('organization_id', org.id)
            .eq('status', 'ACTIVE')
            .order('position', { ascending: true })
            .order('created_at', { ascending: false }),
        ]);

        if (eventsResult.data) {
          setFeaturedEvents(eventsResult.data as EventRow[]);
        }

        if (testimonialsResult.data) {
          setTestimonials(testimonialsResult.data as TestimonialRow[]);
        }

        if (sponsorsResult.data) {
          setSponsors(sponsorsResult.data as SponsorRow[]);
        }

        if (productsResult.data) {
          setProducts(productsResult.data as ProductRow[]);
        }
      } catch (sidebarError) {
        console.error('Failed to load organization sidebar content', sidebarError);
      }

      setIsLoading(false);
    };

    fetchOrganizationAndContent();
  }, [orgSlug]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-48 w-full mb-6" />
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
              We couldn&apos;t find an organization for this URL. Please check the link or
              contact the organizer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="bg-gradient-to-b from-background to-accent/20 min-h-screen">
      <section className="container mx-auto px-4 pt-8 pb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Organization</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{organization.name}</span>
          </h1>
          {organization.city && (
            <p className="mt-2 text-sm text-muted-foreground">
              Based in {organization.city}
              {organization.state ? `, ${organization.state}` : ''}
              {organization.country ? `, ${organization.country}` : ''}
            </p>
          )}
        </div>
      </section>

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
          </div>


          <aside className="space-y-4">
            <Card className="border-dashed border-primary/30 bg-card/70 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Featured events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {featuredEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground/80">
                    Once this organization has public events, the most recent ones will be highlighted here.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {featuredEvents.map((event) => (
                      <li key={event.id} className="flex flex-col rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                        <span className="text-xs font-semibold text-foreground line-clamp-1">{event.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(event.start_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Quote className="h-4 w-4 text-primary" />
                  What people say
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {testimonials.length === 0 ? (
                  <p className="text-xs text-muted-foreground/80">
                    Testimonials from participants, partners, and collaborators will appear here.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {testimonials.map((testimonial) => (
                      <li key={testimonial.id} className="rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                        <p className="text-sm leading-snug">“{testimonial.quote}”</p>
                        <p className="mt-1 text-xs text-muted-foreground/80">
                          — {testimonial.author_name}
                          {testimonial.author_role ? `, ${testimonial.author_role}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Sponsors & partners
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sponsors.length === 0 ? (
                  <p className="text-xs text-muted-foreground/80">
                    Sponsors and partners for this organization will be showcased here.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {sponsors.map((sponsor) => (
                      <a
                        key={sponsor.id}
                        href={sponsor.website_url || undefined}
                        target={sponsor.website_url ? '_blank' : undefined}
                        rel={sponsor.website_url ? 'noopener noreferrer' : undefined}
                        className="flex h-10 items-center justify-center rounded-full border border-border bg-muted px-4 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        {sponsor.name}
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
};
