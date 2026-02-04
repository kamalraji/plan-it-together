import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Announces route changes to screen readers for accessibility.
 * Should be used once at the router level.
 */
export function useRouteAnnouncement() {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create the live region if it doesn't exist
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.id = 'route-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'assertive');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    // Only announce if path actually changed (not just query params)
    if (previousPathRef.current === location.pathname) {
      return;
    }
    previousPathRef.current = location.pathname;

    // Extract page title from document or derive from path
    const getPageTitle = (): string => {
      // Use document title if available and meaningful
      const docTitle = document.title;
      if (docTitle && !docTitle.includes('Thittam1Hub') && docTitle.length < 50) {
        return docTitle;
      }

      // Derive readable title from pathname
      const segments = location.pathname.split('/').filter(Boolean);
      if (segments.length === 0) return 'Home page';

      // Handle common patterns
      const lastSegment = segments[segments.length - 1];
      
      // Format the segment into readable text
      const readable = lastSegment
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase());

      return `${readable} page`;
    };

    // Delay announcement slightly to allow page title to update
    const timeoutId = setTimeout(() => {
      if (announcerRef.current) {
        const title = getPageTitle();
        announcerRef.current.textContent = `Navigated to ${title}`;
        
        // Clear after announcement to allow re-announcement
        setTimeout(() => {
          if (announcerRef.current) {
            announcerRef.current.textContent = '';
          }
        }, 1000);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (announcerRef.current && document.body.contains(announcerRef.current)) {
        document.body.removeChild(announcerRef.current);
      }
    };
  }, []);
}

/**
 * Hook for workspace tab change announcements.
 * More specific than route announcements - use in workspace contexts.
 */
export function useTabAnnouncement() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  const announceTab = (tabName: string) => {
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.id = 'tab-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    // Format tab name for announcement
    const readable = tabName
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());

    announcerRef.current.textContent = `${readable} tab selected`;

    // Clear after announcement
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = '';
      }
    }, 1000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (announcerRef.current && document.body.contains(announcerRef.current)) {
        document.body.removeChild(announcerRef.current);
      }
    };
  }, []);

  return { announceTab };
}
