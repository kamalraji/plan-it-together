import { useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { useSeo } from '@/hooks/useSeo';
import { usePageViewTracking } from '@/hooks/usePageViewTracking';
import { Calendar, MapPin, Users, Clock, Globe, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { EventScrollSpy } from './EventScrollSpy';

/**
 * Public Event Page - accessible via /event/:slug
 * Uses the landing_page_slug field for SEO-friendly URLs
 * Supports UTM tracking (utm_source, utm_medium, utm_campaign) and section deep-linking (sectionid)
 */
export function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract UTM parameters
  const utmSource = searchParams.get('utm_source');
  const utmMedium = searchParams.get('utm_medium');
  const utmCampaign = searchParams.get('utm_campaign');

  // Extract section deep-link parameter
  const sectionId = searchParams.get('sectionid');

  // Fetch event by slug
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['public-event-by-slug', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizations:organization_id (
            id,
            name,
            slug,
            logo_url,
            verification_status
          )
        `)
        .eq('landing_page_slug', slug)
        .eq('visibility', 'PUBLIC')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // SEO
  useSeo({
    title: event ? `${event.name} | Thittam1Hub` : 'Event | Thittam1Hub',
    description: event?.description || 'Join this event on Thittam1Hub',
    canonicalPath: `/event/${slug || ''}`,
    ogType: 'website',
  });

  // Rate-limited page view tracking via edge function
  usePageViewTracking({
    eventId: event?.id || '',
    utmSource,
    utmMedium,
    utmCampaign,
  });

  // Section deep-linking - auto-scroll to section
  useEffect(() => {
    if (!sectionId || !event) return;
    
    // Delay to ensure DOM is rendered
    const timer = setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [sectionId, event]);

  // JSON-LD for events
  useEffect(() => {
    if (!event) return;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.name,
      description: event.description,
      startDate: event.start_date,
      endDate: event.end_date,
      eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode:
          event.mode === 'ONLINE'
            ? 'https://schema.org/OnlineEventAttendanceMode'
            : event.mode === 'HYBRID'
            ? 'https://schema.org/MixedEventAttendanceMode'
            : 'https://schema.org/OfflineEventAttendanceMode',
        url: window.location.href,
        organizer: event.organizations
          ? {
              '@type': 'Organization',
              name: event.organizations.name,
              url: `${window.location.origin}/${event.organizations.slug}`,
            }
          : undefined,
      };

    let script = document.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"][data-event-jsonld="true"]'
    );
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.eventJsonld = 'true';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    return () => {
      script?.remove();
    };
  }, [event]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Event not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              This event doesn't exist, is private, or the link may be incorrect.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/events')}>Browse Events</Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const org = event.organizations as any;
  const branding = (event.branding as any) || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Scroll-spy navigation */}
      <EventScrollSpy />
      {/* Hero Section */}
      <section
        id="hero"
        className="relative overflow-hidden"
        style={{
          background: branding.primaryColor
            ? `linear-gradient(135deg, ${branding.primaryColor}, ${branding.primaryColor}88)`
            : undefined,
        }}
      >
        {branding.bannerUrl && (
          <img
            src={branding.bannerUrl}
            alt={event.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="relative bg-gradient-to-b from-primary/90 to-primary/70 text-primary-foreground">
          <div className="container mx-auto px-4 py-12 sm:py-20">
            {/* Organization badge */}
            {org && (
              <Link
                to={`/${org.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-background/20 backdrop-blur px-3 py-1.5 text-sm mb-4 hover:bg-background/30 transition-colors"
              >
                {org.logo_url && (
                  <img src={org.logo_url} alt={org.name} className="h-5 w-5 rounded-full" />
                )}
                <span>Hosted by {org.name}</span>
                {org.verification_status === 'VERIFIED' && (
                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                )}
              </Link>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">{event.name}</h1>
            
            {event.description && (
              <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-3xl mb-6">
                {event.description}
              </p>
            )}

            {/* Quick info chips */}
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-background/20 backdrop-blur px-4 py-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(event.start_date), 'MMM d, yyyy')}</span>
              </div>
              
              <div className="inline-flex items-center gap-2 rounded-full bg-background/20 backdrop-blur px-4 py-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(event.start_date), 'h:mm a')}</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-background/20 backdrop-blur px-4 py-2 text-sm">
                {event.mode === 'ONLINE' ? (
                  <>
                    <Globe className="h-4 w-4" />
                    <span>Virtual Event</span>
                  </>
                ) : event.mode === 'HYBRID' ? (
                  <>
                    <Globe className="h-4 w-4" />
                    <span>Hybrid Event</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    <span>In-Person</span>
                  </>
                )}
              </div>

              {event.capacity && (
                <div className="inline-flex items-center gap-2 rounded-full bg-background/20 backdrop-blur px-4 py-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>{event.capacity} spots</span>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate(`/events/${event.id}`)}
                className="font-semibold"
              >
                {branding.primaryCtaLabel || 'Register Now'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
              >
                Share Event
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section id="details" className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card id="about">
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {event.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>

            {/* Render custom landing page if available */}
            {event.landing_page_data && (event.landing_page_data as any).html && (
              <Card id="custom-content">
                <CardContent className="pt-6">
                  {(event.landing_page_data as any).css && (
                    <style
                      dangerouslySetInnerHTML={{ __html: (event.landing_page_data as any).css }}
                    />
                  )}
                  <div
                    dangerouslySetInnerHTML={{ __html: (event.landing_page_data as any).html }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <Card id="register">
              <CardHeader>
                <CardTitle className="text-base">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-muted-foreground">
                      {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-muted-foreground">
                      {format(new Date(event.start_date), 'h:mm a')} -{' '}
                      {format(new Date(event.end_date), 'h:mm a')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-muted-foreground">
                      {event.mode === 'ONLINE'
                        ? 'Online Event'
                        : event.mode === 'HYBRID'
                        ? 'Hybrid (Online + In-Person)'
                        : 'In-Person Event'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Capacity</p>
                    <p className="text-muted-foreground">
                      {event.capacity ? `${event.capacity} attendees` : 'Unlimited'}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  View Full Details
                </Button>
              </CardContent>
            </Card>

            {/* Organizer Card */}
            {org && (
              <Card id="organizer">
                <CardHeader>
                  <CardTitle className="text-base">Organized by</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    to={`/${org.slug}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    {org.logo_url ? (
                      <img
                        src={org.logo_url}
                        alt={org.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-lg font-semibold">
                        {org.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium flex items-center gap-1">
                        {org.name}
                        {org.verification_status === 'VERIFIED' && (
                          <Badge variant="secondary" className="text-[10px]">✓</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        View profile
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

export default PublicEventPage;
