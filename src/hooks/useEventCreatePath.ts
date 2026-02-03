import { useLocation } from 'react-router-dom';

/**
 * useEventCreatePath
 *
 * Centralizes the logic for building the correct "create event" path
 * based on whether the user is currently inside an organization context
 * (/:orgSlug/...) or using the global dashboard (/dashboard/...).
 *
 * This keeps navigation behavior consistent across buttons, links, and
 * tutorials that open the event creation flow.
 */
export const useEventCreatePath = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  // orgSlug is the first non-empty segment, e.g. /:orgSlug/eventmanagement
  const orgSlugCandidate = segments[0];
  const isOrgContext = !!orgSlugCandidate && orgSlugCandidate !== 'dashboard';

  const path = isOrgContext
    ? `/${orgSlugCandidate}/eventmanagement/create`
    : '/dashboard/eventmanagement/create';

  return path;
};
