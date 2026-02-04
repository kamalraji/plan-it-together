import { useRouteAnnouncement } from '@/hooks/useRouteAnnouncement';

/**
 * Component that announces route changes to screen readers.
 * Place once inside BrowserRouter to enable route announcements.
 */
export function RouteAnnouncer() {
  useRouteAnnouncement();
  return null;
}
