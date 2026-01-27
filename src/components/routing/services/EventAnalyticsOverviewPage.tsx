import React, { useEffect } from 'react';
import { AnalyticsPage } from '@/components/analytics/AnalyticsPage';
import { useAuth } from '@/hooks/useAuth';

/**
 * EventAnalyticsOverviewPage
 *
 * Provides a global event analytics overview screen within the Event Management
 * service, reusing the existing AnalyticsPage component.
 */
export const EventAnalyticsOverviewPage: React.FC = () => {
  useAuth();

  useEffect(() => {
    document.title = 'Event Analytics Overview | Thittam1Hub';

    const description =
      'View aggregated analytics across all events, including registrations, attendance, and performance metrics.';

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

  return <AnalyticsPage scope="global" />;
};

export default EventAnalyticsOverviewPage;
