import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PageViewParams {
  eventId: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

/**
 * Hook for tracking page views with rate limiting via edge function
 */
export function usePageViewTracking({
  eventId,
  utmSource,
  utmMedium,
  utmCampaign,
}: PageViewParams) {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    const trackPageView = async () => {
      if (!eventId || hasTrackedRef.current) return;
      hasTrackedRef.current = true;

      // Generate anonymous session ID for this visit
      const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      try {
        const { error } = await supabase.functions.invoke('track-page-view', {
          body: {
            event_id: eventId,
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
            session_id: sessionId,
          },
        });

        if (error) {
          console.warn('[Analytics] Failed to record page view:', error.message);
        }
      } catch (err) {
        console.warn('[Analytics] Page view tracking error:', err);
      }
    };

    trackPageView();
  }, [eventId, utmSource, utmMedium, utmCampaign]);
}
