import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/looseClient';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizationProfile } from '@/components/organization/OrganizationProfile';
import { Badge } from '@/components/ui/badge';
import { Calendar, Quote, Star } from 'lucide-react';


type OrganizationRow = Tables<'organizations'>;

export const OrganizationLandingPage: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [organization, setOrganization] = useState<OrganizationRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!orgSlug) {
        setError('Organization not found');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .maybeSingle();

      if (error) {
        console.error('Error loading organization by slug', error);
        setError('Unable to load organization');
      } else if (!data) {
        setError('Organization not found');
      } else {
        setOrganization(data as OrganizationRow);
        try {
          document.title = `${data.name} | Thittam1Hub`;

          const description =
            data.description ||
            `Discover events and updates from ${data.name} on Thittam1Hub.`;

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
            `${window.location.origin}/${data.slug}`,
          );
        } catch (seoError) {
          console.warn('Unable to set SEO metadata for organization page', seoError);
        }
      }

      setIsLoading(false);
    };

    fetchOrganization();
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

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${organization.slug}`
    : `/${organization.slug}`;

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Simple fallback toast-free feedback; integrate with toast system later if needed
      alert('Public link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  return (
    <main className="bg-gradient-to-b from-cream to-lavender/30 min-h-screen">
      <section className="container mx-auto px-4 pt-8 pb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Organization</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent">{organization.name}</span>
          </h1>
          {organization.city && (
            <p className="mt-2 text-sm text-muted-foreground">
              Based in {organization.city}
              {organization.state ? `, ${organization.state}` : ''}
              {organization.country ? `, ${organization.country}` : ''}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <button
            onClick={copyShareUrl}
            className="inline-flex items-center justify-center rounded-full border border-border bg-background/80 px-4 py-2 text-xs sm:text-sm font-medium text-foreground shadow-sm hover:bg-muted/80 transition-colors"
          >
            <span className="mr-2 text-xs">🔗</span>
            Copy public link
          </button>
          <a
            href={shareUrl}
            className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs sm:text-sm font-medium text-primary-foreground shadow-md hover:shadow-lg transition-shadow"
          >
            Open public page
          </a>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div>
            <OrganizationProfile organizationId={organization.id} />
          </div>

          <aside className="space-y-4">
            <Card className="border-dashed border-primary/30 bg-card/70 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Featured moments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Highlight key events or milestones here to give visitors a quick snapshot of what this
                  organization is known for.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">Flagship Event</Badge>
                  <Badge variant="outline">Annual Meetup</Badge>
                  <Badge variant="outline">Community Impact</Badge>
                </div>
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
                <p>
                  “This organization runs some of the most well-organized events I&apos;ve attended. The
                  team is thoughtful, responsive, and community-first.”
                </p>
                <p className="text-xs text-muted-foreground/80">— Happy participant (sample testimonial)</p>
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
                <div className="flex flex-wrap gap-3">
                  {['Partner One', 'Studio Two', 'Collective Three'].map((partner) => (
                    <div
                      key={partner}
                      className="flex h-10 items-center justify-center rounded-full border border-border bg-muted px-4 text-xs font-medium text-muted-foreground"
                    >
                      {partner}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
};
