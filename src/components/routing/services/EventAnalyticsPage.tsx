import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AnalyticsPage } from '@/components/analytics/AnalyticsPage';
import { useAuth } from '@/hooks/useAuth';

/**
 * EventAnalyticsPage
 *
 * Provides per-event analytics scoped to a single event, reusing the
 * generic AnalyticsPage component with `scope="event"`.
 */
export const EventAnalyticsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  useAuth();

  useEffect(() => {
    document.title = 'Event Analytics | Thittam1Hub';

    const description =
      'View detailed analytics for this event, including registrations, attendance, and engagement.';

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

  if (!eventId) {
    return null;
  }

  return <AnalyticsPage scope="event" eventId={eventId} />;
};

export default EventAnalyticsPage;
