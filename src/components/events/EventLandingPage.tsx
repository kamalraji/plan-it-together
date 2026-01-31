import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/looseClient';
import { Event, EventMode, EventVisibility, TimelineItem, PrizeInfo, SponsorInfo } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { usePrimaryOrganization } from '@/hooks/usePrimaryOrganization';
import { EventCanvasHero } from './EventCanvasHero';
import { sanitizeLandingPageHTML, sanitizeLandingPageCSS } from '@/utils/sanitize';
import { Badge } from '@/components/ui/badge';
import { Ticket } from 'lucide-react';
import type { TicketTier } from '@/types/ticketTier';
import { getTierSaleStatus, getTierStatusLabel, getTierStatusColor } from '@/types/ticketTier';
import { SkipLink } from '@/components/accessibility';
import { GlobalFooter } from '@/components/layout/GlobalFooter';
import { CookieConsentBanner } from '@/components/legal/CookieConsentBanner';
import { RichTextDisplay } from '@/components/ui/rich-text-display';

type TabType = 'overview' | 'schedule' | 'prizes' | 'sponsors';

interface EventLandingPageProps {
  eventId?: string;
}

export function EventLandingPage({ eventId: propEventId }: EventLandingPageProps) {
  const { eventId: paramEventId } = useParams<{ eventId: string }>();
  const eventId = propEventId || paramEventId;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { data: primaryOrg } = usePrimaryOrganization();
  
  // Parse tab from URL query param for deep linking
  const tabParam = searchParams.get('tab') as TabType | null;
  const validTabs: TabType[] = ['overview', 'schedule', 'prizes', 'sponsors'];
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'overview';
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  
  // Sync URL with active tab
  useEffect(() => {
    if (activeTab !== 'overview') {
      searchParams.set('tab', activeTab);
    } else {
      searchParams.delete('tab');
    }
    setSearchParams(searchParams, { replace: true });
  }, [activeTab]);

  // Fetch event details directly from Supabase
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId as string)
        .single();

      if (error) throw error;

      const landingPageData = (data as any).landing_page_data ?? null;

      // Map Supabase row to the existing Event type shape used in the UI
      const mappedEvent: Event = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        mode: data.mode as EventMode,
        startDate: data.start_date || '',
        endDate: data.end_date || '',
        capacity: data.capacity ?? undefined,
        registrationDeadline: (data as any).registration_deadline || undefined,
        organizerId: (data as any).organizer_id,
        organizationId: data.organization_id || undefined,
        visibility: data.visibility as EventVisibility,
        inviteLink: (data as any).invite_link || undefined,
        branding: (data.branding as any) || {},
        venue: (data as any).venue || undefined,
        virtualLinks: (data as any).virtual_links || undefined,
        status: data.status as any,
        landingPageUrl: (data as any).landing_page_url || '',
        timeline: [],
        agenda: [],
        prizes: [],
        sponsors: [],
        organization: undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        canvasState: (data as any).canvas_state ?? undefined,
        landingPageData: landingPageData,
      };

      return mappedEvent;
    },
    enabled: !!eventId,
  });

  // Fetch ticket tiers for pricing display
  const { data: ticketTiers = [] } = useQuery({
    queryKey: ['event-ticket-tiers', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_tiers')
        .select('*')
        .eq('event_id', eventId as string)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as TicketTier[];
    },
    enabled: !!eventId && !!event,
  });

  // Calculate minimum price for display
  const pricingInfo = useMemo(() => {
    if (!ticketTiers || ticketTiers.length === 0) return null;
    
    const onSaleTiers = ticketTiers.filter(t => getTierSaleStatus(t) === 'on_sale');
    if (onSaleTiers.length === 0) return null;
    
    const minPrice = Math.min(...onSaleTiers.map(t => t.price));
    const currency = onSaleTiers[0]?.currency || 'INR';
    
    return { minPrice, currency, tierCount: ticketTiers.length };
  }, [ticketTiers]);

  const formatPrice = (price: number, currency: string) => {
    const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    if (price === 0) return 'Free';
    return `${symbols[currency] || currency}${price.toLocaleString()}`;
  };

  // Check if event is private and redirect to access page (Requirements 24.2, 24.3)
  useEffect(() => {
    if (event && event.visibility === EventVisibility.PRIVATE) {
      // Check if user has access via invite token in URL
      const urlParams = new URLSearchParams(window.location.search);
      const inviteToken = urlParams.get('invite');

      if (inviteToken) {
        // Redirect to access page with invite token
        navigate(`/events/${eventId}/access?invite=${inviteToken}`);
      } else {
        // Redirect to access page without token
        navigate(`/events/${eventId}/access`);
      }
    }
  }, [event, eventId, navigate]);

  // Registration mutation - store registrations in Lovable Cloud
  const registrationMutation = useMutation({
    mutationFn: async () => {
      if (!eventId || !user) {
        throw new Error('You must be logged in to register for an event.');
      }

      const { error } = await supabase.from('registrations').insert({
        event_id: eventId,
        user_id: user.id,
        status: 'PENDING',
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      setShowRegistrationModal(false);
      navigate(primaryOrg?.slug ? `/${primaryOrg.slug}/dashboard` : '/dashboard');
    },
  });

  // Social sharing functionality (Requirements 10.5)
  const shareEvent = async (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    if (!event) return;

    const url = window.location.href;
    const text = `Check out ${event.name} - ${event.description.substring(0, 100)}...`;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        // You could add a toast notification here
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">Event not found</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            The event you're looking for doesn't exist, is private, or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground px-5 py-2.5 text-sm font-medium shadow-sm hover:shadow-md hover:from-primary hover:to-primary/80 transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Prefer GrapesJS-built landing page when available
  if (event.landingPageData && (event.landingPageData as any).html) {
    const lp = event.landingPageData as any as { html: string; css?: string | null; meta?: { title?: string; description?: string } };

    // Sanitize HTML and CSS to prevent XSS attacks
    const sanitizedHTML = sanitizeLandingPageHTML(lp.html);
    const sanitizedCSS = lp.css ? sanitizeLandingPageCSS(lp.css) : null;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SkipLink href="#main-content" />
        <main id="main-content" className="flex-1">
          <section className="border-b border-border bg-background">
            {/* Inject sanitized GrapesJS CSS into the page scope */}
            {sanitizedCSS && <style dangerouslySetInnerHTML={{ __html: sanitizedCSS }} />}
            <div
              className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
              dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
            />
          </section>
        </main>
        <GlobalFooter />
        <CookieConsentBanner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip link for keyboard navigation - WCAG 2.1 AA */}
      <SkipLink href="#main-content" />
      
      {/* Hero Section with Branding (Requirements 10.2, 10.3) */}
      <header
        className="relative text-primary-foreground bg-gradient-to-r from-primary to-accent overflow-hidden"
        style={{
          backgroundColor: event.branding.primaryColor || undefined,
          backgroundImage: event.branding.bannerUrl ? `url(${event.branding.bannerUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            {/* Organization or Event Branding (Requirements 19.2) */}
            {event.organization?.branding?.logoUrl ? (
              <div className="text-center mb-6">
                <img
                  src={event.organization.branding.logoUrl}
                  alt={event.organization.name}
                  className="h-16 w-auto mx-auto mb-2"
                />
                <p className="text-sm text-primary-foreground/80">
                  Hosted by {event.organization.name}
                  {event.organization.verificationStatus === 'VERIFIED' && (
                    <span className="ml-1 text-primary-foreground">✓</span>
                  )}
                </p>
              </div>
            ) : event.branding.logoUrl && (
              <img
                src={event.branding.logoUrl}
                alt={`${event.name} logo`}
                className="h-16 w-auto mx-auto mb-6"
              />
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4">{event.name}</h1>
            <RichTextDisplay 
              content={event.description} 
              className="text-lg md:text-xl mb-8 max-w-3xl mx-auto text-primary-foreground/90 [&_p]:text-primary-foreground/90"
            />

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8 text-sm sm:text-base">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/15 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(event.startDate)}</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/15 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  {event.mode === EventMode.OFFLINE && event.venue && `${event.venue.name}, ${event.venue.city}`}
                  {event.mode === EventMode.ONLINE && 'Virtual Event'}
                  {event.mode === EventMode.HYBRID && event.venue && `${event.venue.name} + Virtual`}
                </span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/15 backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{event.mode.charAt(0) + event.mode.slice(1).toLowerCase()}</span>
              </div>

              {/* Pricing Badge */}
              {pricingInfo && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/15 backdrop-blur-sm">
                  <Ticket className="h-5 w-5" />
                  <span>
                    {pricingInfo.minPrice === 0 
                      ? 'Free' 
                      : `From ${formatPrice(pricingInfo.minPrice, pricingInfo.currency)}`}
                  </span>
                </div>
              )}
            </div>

            {/* Registration Button (Requirements 10.3) */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              {isAuthenticated ? (
                <button
                  onClick={() => setShowRegistrationModal(true)}
                  disabled={registrationMutation.isPending}
                  className="bg-card text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {registrationMutation.isPending
                    ? 'Registering...'
                    : (event.branding?.primaryCtaLabel || 'Register Now')}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/register')}
                  className="bg-card text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-muted transition-colors"
                >
                  Sign Up to Register
                </button>
              )}

              {/* Social Sharing (Requirements 10.5) */}
              <div className="flex items-center space-x-2">
                <span className="text-sm">Share:</span>
                <button
                  onClick={() => shareEvent('twitter')}
                  className="p-2 bg-card bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                  title="Share on Twitter"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </button>
                <button
                  onClick={() => shareEvent('facebook')}
                  className="p-2 bg-card bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                  title="Share on Facebook"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
                <button
                  onClick={() => shareEvent('linkedin')}
                  className="p-2 bg-card bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                  title="Share on LinkedIn"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </button>
                <button
                  onClick={() => shareEvent('copy')}
                  className="p-2 bg-card bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                  title="Copy Link"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-card/80 border-b border-border/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex gap-4 overflow-x-auto py-2">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'schedule', label: 'Schedule' },
              { key: 'prizes', label: 'Prizes' },
              { key: 'sponsors', label: 'Sponsors' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">About This Event</h2>
                <p className="text-muted-foreground leading-relaxed">{event.description}</p>
              </div>

              {/* Canvas Hero - Custom designed visual */}
              {event.canvasState && (
                <div className="mb-6">
                  <EventCanvasHero snapshot={event.canvasState} />
                </div>
              )}

              {/* Event Details */}
              <div className="bg-card rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Event Details</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <svg className="h-5 w-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-medium text-foreground">Date & Time</p>
                      <p className="text-muted-foreground">
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <svg className="h-5 w-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-foreground">Location</p>
                      {event.mode === EventMode.OFFLINE && event.venue && (
                        <div className="text-muted-foreground">
                          <p>{event.venue.name}</p>
                          <p>{event.venue.address}</p>
                          <p>{event.venue.city}, {event.venue.state} {event.venue.postalCode}</p>
                          <p>{event.venue.country}</p>
                        </div>
                      )}
                      {event.mode === EventMode.ONLINE && (
                        <p className="text-muted-foreground">Virtual Event</p>
                      )}
                      {event.mode === EventMode.HYBRID && event.venue && (
                        <div className="text-muted-foreground">
                          <p>{event.venue.name} + Virtual</p>
                          <p>{event.venue.address}</p>
                          <p>{event.venue.city}, {event.venue.state}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {event.capacity && (
                    <div className="flex items-start space-x-3">
                      <svg className="h-5 w-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div>
                        <p className="font-medium text-foreground">Capacity</p>
                        <p className="text-muted-foreground">{event.capacity} participants</p>
                      </div>
                    </div>
                  )}

                  {event.registrationDeadline && (
                    <div className="flex items-start space-x-3">
                      <svg className="h-5 w-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-foreground">Registration Deadline</p>
                        <p className="text-muted-foreground">{formatDate(event.registrationDeadline)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <div className="bg-card rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Registration</h3>
                
                {/* Pricing display */}
                {pricingInfo && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      {pricingInfo.tierCount} ticket {pricingInfo.tierCount === 1 ? 'tier' : 'tiers'} available
                    </p>
                    <p className="text-lg font-semibold">
                      {pricingInfo.minPrice === 0 
                        ? 'Free' 
                        : `From ${formatPrice(pricingInfo.minPrice, pricingInfo.currency)}`}
                    </p>
                  </div>
                )}

                {isAuthenticated ? (
                  <button
                    onClick={() => setShowRegistrationModal(true)}
                    disabled={registrationMutation.isPending}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {registrationMutation.isPending ? 'Registering...' : 'Register Now'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/register')}
                      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Sign Up to Register
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full border border-indigo-600 text-indigo-600 py-3 px-4 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                    >
                      Already have an account?
                    </button>
                  </div>
                )}
              </div>

              {/* Ticket Tiers Card */}
              {ticketTiers.length > 0 && (
                <div className="bg-card rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Tickets
                  </h3>
                  <div className="space-y-3">
                    {ticketTiers.map((tier) => {
                      const status = getTierSaleStatus(tier);
                      const statusLabel = getTierStatusLabel(status);
                      const statusColor = getTierStatusColor(status);
                      
                      return (
                        <div key={tier.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-medium">{tier.name}</p>
                              <Badge variant="secondary" className={`text-xs mt-1 ${statusColor}`}>
                                {statusLabel}
                              </Badge>
                            </div>
                            <p className="font-semibold whitespace-nowrap">
                              {formatPrice(tier.price, tier.currency)}
                            </p>
                          </div>
                          {tier.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {tier.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="bg-card rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Event Type:</span>
                    <span className="font-medium">{event.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-medium capitalize ${event.status === 'PUBLISHED' ? 'text-green-600' :
                        event.status === 'DRAFT' ? 'text-yellow-600' : 'text-muted-foreground'
                      }`}>
                      {event.status.toLowerCase()}
                    </span>
                  </div>
                  {event.capacity && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capacity:</span>
                      <span className="font-medium">{event.capacity}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Tab (Requirements 10.3) */}
        {activeTab === 'schedule' && (
          <div className="bg-card rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Event Schedule</h2>
              {event.timeline && event.timeline.length > 0 ? (
                <div className="space-y-6">
                  {event.timeline.map((item: TimelineItem, index: number) => (
                    <div key={item.id || index} className="flex space-x-4">
                      <div className="flex-shrink-0 w-24 text-right">
                        <div className="text-sm font-medium text-foreground">
                          {formatTime(item.startTime)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(item.endTime)}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <div className="h-3 w-3 bg-indigo-600 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-medium text-foreground">{item.title}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.type === 'session' ? 'bg-blue-100 text-blue-800' :
                              item.type === 'break' ? 'bg-green-100 text-green-800' :
                                item.type === 'networking' ? 'bg-purple-100 text-purple-800' :
                                  'bg-muted text-foreground'
                            }`}>
                            {item.type}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-muted-foreground mb-2">{item.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {item.speaker && (
                            <div className="flex items-center space-x-1">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>{item.speaker}</span>
                            </div>
                          )}
                          {item.location && (
                            <div className="flex items-center space-x-1">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{item.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="h-12 w-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Schedule Available</h3>
                  <p className="text-muted-foreground">The event schedule will be updated soon.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prizes Tab (Requirements 10.3) */}
        {activeTab === 'prizes' && (
          <div className="bg-card rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Prizes & Awards</h2>
              {event.prizes && event.prizes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {event.prizes
                    .sort((a: PrizeInfo, b: PrizeInfo) => a.position - b.position)
                    .map((prize: PrizeInfo, index: number) => (
                      <div key={prize.id || index} className="border border-border rounded-lg p-6">
                        <div className="text-center">
                          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${prize.position === 1 ? 'bg-yellow-100 text-yellow-600' :
                              prize.position === 2 ? 'bg-muted text-muted-foreground' :
                                prize.position === 3 ? 'bg-orange-100 text-orange-600' :
                                  'bg-blue-100 text-blue-600'
                            }`}>
                            <span className="text-lg font-bold">#{prize.position}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">{prize.title}</h3>
                          {prize.value && (
                            <p className="text-2xl font-bold text-indigo-600 mb-3">{prize.value}</p>
                          )}
                          <p className="text-muted-foreground text-sm">{prize.description}</p>
                          {prize.category && (
                            <span className="inline-block mt-3 px-3 py-1 bg-muted text-foreground text-xs rounded-full">
                              {prize.category}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="h-12 w-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Prizes Listed</h3>
                  <p className="text-muted-foreground">Prize information will be announced soon.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sponsors Tab (Requirements 10.3) */}
        {activeTab === 'sponsors' && (
          <div className="bg-card rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Our Sponsors</h2>
              {event.sponsors && event.sponsors.length > 0 ? (
                <div className="space-y-8">
                  {['title', 'platinum', 'gold', 'silver', 'bronze'].map((tier) => {
                    const tierSponsors = event.sponsors?.filter((sponsor: SponsorInfo) => sponsor.tier === tier) || [];
                    if (tierSponsors.length === 0) return null;

                    return (
                      <div key={tier}>
                        <h3 className={`text-xl font-semibold mb-4 ${tier === 'title' ? 'text-purple-600' :
                            tier === 'platinum' ? 'text-muted-foreground' :
                              tier === 'gold' ? 'text-yellow-600' :
                                tier === 'silver' ? 'text-muted-foreground' :
                                  'text-orange-600'
                          }`}>
                          {tier.charAt(0).toUpperCase() + tier.slice(1)} Sponsors
                        </h3>
                        <div className={`grid gap-6 ${tier === 'title' ? 'grid-cols-1 md:grid-cols-2' :
                            tier === 'platinum' ? 'grid-cols-2 md:grid-cols-3' :
                              'grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
                          }`}>
                          {tierSponsors.map((sponsor: SponsorInfo, index: number) => (
                            <div key={sponsor.id || index} className="text-center">
                              <div className={`bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow ${tier === 'title' ? 'p-8' :
                                  tier === 'platinum' ? 'p-6' :
                                    'p-4'
                                }`}>
                                {sponsor.website ? (
                                  <a
                                    href={sponsor.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={sponsor.logoUrl}
                                      alt={sponsor.name}
                                      className={`mx-auto object-contain ${tier === 'title' ? 'h-20' :
                                          tier === 'platinum' ? 'h-16' :
                                            tier === 'gold' ? 'h-12' :
                                              'h-10'
                                        }`}
                                    />
                                    <p className="mt-2 text-sm font-medium text-foreground">{sponsor.name}</p>
                                  </a>
                                ) : (
                                  <>
                                    <img
                                      src={sponsor.logoUrl}
                                      alt={sponsor.name}
                                      className={`mx-auto object-contain ${tier === 'title' ? 'h-20' :
                                          tier === 'platinum' ? 'h-16' :
                                            tier === 'gold' ? 'h-12' :
                                              'h-10'
                                        }`}
                                    />
                                    <p className="mt-2 text-sm font-medium text-foreground">{sponsor.name}</p>
                                  </>
                                )}
                                {sponsor.description && (
                                  <p className="mt-1 text-xs text-muted-foreground">{sponsor.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="h-12 w-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Sponsors Listed</h3>
                  <p className="text-muted-foreground">Sponsor information will be updated soon.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Confirm Registration</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to register for "{event.name}"?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="flex-1 px-4 py-2 border border-input rounded-md text-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => registrationMutation.mutate()}
                disabled={registrationMutation.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {registrationMutation.isPending ? 'Registering...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <GlobalFooter />
      <CookieConsentBanner />
    </div>
  );
}