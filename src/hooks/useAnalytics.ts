/**
 * useAnalytics - React hook for analytics tracking
 */
import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';

export function useAnalytics() {
  const { user } = useAuth();
  const location = useLocation();
  const previousPath = useRef<string | null>(null);

  // Initialize analytics with user
  useEffect(() => {
    if (user) {
      analytics.init(user.id, {
        email: user.email || undefined,
      });
    }
  }, [user]);

  // Track page views
  useEffect(() => {
    const pageName = location.pathname.split('/').filter(Boolean)[0] || 'home';
    analytics.page(pageName, { path: location.pathname });

    // Track navigation
    if (previousPath.current && previousPath.current !== location.pathname) {
      analytics.trackNavigation(previousPath.current, location.pathname);
    }
    previousPath.current = location.pathname;
  }, [location.pathname]);

  // Tracking helpers
  const track = useCallback((name: string, properties?: Record<string, string | number | boolean | null>) => {
    analytics.track(name, properties);
  }, []);

  const trackClick = useCallback((buttonName: string, context?: string) => {
    analytics.trackButtonClick(buttonName, context);
  }, []);

  const trackFeature = useCallback((featureName: string, context?: string) => {
    analytics.trackFeatureUsed(featureName, context);
  }, []);

  const trackError = useCallback((errorType: string, errorMessage: string, context?: string) => {
    analytics.trackError(errorType, errorMessage, context);
  }, []);

  const trackTiming = useCallback((eventName: string, durationMs: number) => {
    analytics.trackTimingEvent(eventName, durationMs);
  }, []);

  return {
    track,
    trackClick,
    trackFeature,
    trackError,
    trackTiming,
    trackTaskCreated: analytics.trackTaskCreated.bind(analytics),
    trackTaskCompleted: analytics.trackTaskCompleted.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
  };
}

/**
 * Hook to measure component render time
 */
export function useRenderTiming(componentName: string) {
  const startTime = useRef(performance.now());

  useEffect(() => {
    const duration = performance.now() - startTime.current;
    analytics.trackTimingEvent(`render_${componentName}`, duration);
  }, [componentName]);
}

/**
 * Hook to track time spent on a page/component
 */
export function useTimeOnPage(pageName: string) {
  const startTime = useRef(Date.now());

  useEffect(() => {
    return () => {
      const duration = Date.now() - startTime.current;
      analytics.trackTimingEvent(`time_on_${pageName}`, duration);
    };
  }, [pageName]);
}
