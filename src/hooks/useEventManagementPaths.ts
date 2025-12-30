import { useEventCreatePath } from './useEventCreatePath';

/**
 * useEventManagementPaths
 *
 * Centralizes commonly used Event Management console routes based on the
 * existing create-path logic. This ensures that list and create URLs stay
 * in sync for both dashboard and org-scoped contexts.
 */
export const useEventManagementPaths = () => {
  const createPath = useEventCreatePath();

  // Our Event Management service uses `/eventmanagement/list` and
  // `/eventmanagement/create` under either `/dashboard` or `/:orgSlug`.
  const listPath = createPath.replace(/\/create$/, '/list');

  const eventDetailPath = (eventId: string) =>
    listPath.replace(/\/list$/, `/${eventId}`);

  const eventEditPath = (eventId: string) =>
    listPath.replace(/\/list$/, `/${eventId}/edit`);

  return {
    createPath,
    listPath,
    eventDetailPath,
    eventEditPath,
  } as const;
};
