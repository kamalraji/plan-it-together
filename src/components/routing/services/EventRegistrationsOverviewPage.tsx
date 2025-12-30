import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * EventRegistrationsOverviewPage
 *
 * Top-level screen for managing event registrations across events.
 * Initially a placeholder, this can later evolve into a full registrations
 * management console (filters, bulk actions, etc.).
 */
export const EventRegistrationsOverviewPage: React.FC = () => {
  useAuth();

  useEffect(() => {
    document.title = 'Event Registrations Overview | Thittam1Hub';

    const description =
      'Review and manage registrations across your events, including waitlists and participant status.';

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
    canonical.setAttribute('href', window.location.href);
  }, []);

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl mx-auto">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Event Registrations Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          A centralized view for tracking and managing registrations across your events. Detailed
          registration workflows will be introduced in future iterations.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">
          Registration management tooling is coming soon. In the meantime, you can continue to
          manage registrations from individual event detail pages.
        </p>
      </section>
    </main>
  );
};

export default EventRegistrationsOverviewPage;
