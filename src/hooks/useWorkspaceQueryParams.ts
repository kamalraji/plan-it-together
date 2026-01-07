import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { WorkspaceTab } from './useWorkspaceShell';
import { 
  buildWorkspaceUrl as buildUrl, 
  buildWorkspaceSettingsUrl,
  buildWorkspaceListUrl,
  getWorkspaceTypePath as getTypePath,
  toNameSlug,
  type WorkspaceTypePath,
  type WorkspaceUrlOptions,
} from '@/lib/workspaceNavigation';

export type { WorkspaceTypePath, WorkspaceUrlOptions };

export interface WorkspaceQueryParams {
  workspaceId?: string;
  name?: string; // workspace name/slug for human-readable URLs
  tab?: WorkspaceTab;
  taskId?: string;
  sectionId?: string;
}

/**
 * Lightweight hook for workspace URL query parameter management
 * Supports deep-linking for tabs, tasks, sections, and workspace type paths
 * 
 * URL Structure:
 * - /:orgSlug/workspaces/:eventId/department?name=content&workspaceId=xxx
 * - /:orgSlug/workspaces/:eventId/committee?name=marketing&workspaceId=xxx
 * - /:orgSlug/workspaces/:eventId/team?name=design-team&workspaceId=xxx
 * - /:orgSlug/workspaces/:eventId/root?workspaceId=xxx
 */
export function useWorkspaceQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParams = useParams<{ orgSlug?: string; eventId?: string; workspaceType?: string }>();
  const navigate = useNavigate();

  const params: WorkspaceQueryParams = {
    workspaceId: searchParams.get('workspaceId') || undefined,
    name: searchParams.get('name') || undefined,
    tab: (searchParams.get('tab') as WorkspaceTab) || undefined,
    taskId: searchParams.get('taskId') || undefined,
    sectionId: searchParams.get('sectionid') || undefined,
  };

  // Get workspace type from URL path
  const workspaceType = routeParams.workspaceType as WorkspaceTypePath | undefined;

  const setParam = (key: string, value: string | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        return next;
      },
      { replace: true }
    );
  };

  const setMultipleParams = (updates: Partial<Record<string, string | null>>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        });
        return next;
      },
      { replace: true }
    );
  };

  /**
   * Build a workspace URL with type-based path structure
   * Re-exported from workspaceNavigation for convenience
   */
  const buildWorkspaceUrl = buildUrl;

  /**
   * Navigate to a workspace with the new URL structure
   */
  const navigateToWorkspace = (options: {
    orgSlug: string;
    eventId: string;
    workspaceId: string;
    workspaceType: string;
    workspaceName?: string;
    tab?: WorkspaceTab;
  }) => {
    const url = buildUrl({
      ...options,
      tab: options.tab,
    });
    navigate(url);
  };

  /**
   * Map database workspace_type to URL path segment
   * Re-exported from workspaceNavigation for convenience
   */
  const getWorkspaceTypePath = getTypePath;

  /**
   * Legacy URL builder for backward compatibility
   */
  const buildLegacyWorkspaceUrl = (
    baseUrl: string,
    options: {
      workspaceId?: string;
      tab?: WorkspaceTab;
      taskId?: string;
      sectionId?: string;
    }
  ): string => {
    const urlParams = new URLSearchParams();
    if (options.workspaceId) urlParams.set('workspaceId', options.workspaceId);
    if (options.tab && options.tab !== 'overview') urlParams.set('tab', options.tab);
    if (options.taskId) urlParams.set('taskId', options.taskId);
    if (options.sectionId) urlParams.set('sectionid', options.sectionId);
    
    const queryString = urlParams.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  return {
    params,
    workspaceType,
    routeParams,
    setParam,
    setMultipleParams,
    buildWorkspaceUrl,
    buildLegacyWorkspaceUrl,
    navigateToWorkspace,
    getWorkspaceTypePath,
    buildWorkspaceSettingsUrl,
    buildWorkspaceListUrl,
    toNameSlug,
    searchParams,
    setSearchParams,
  };
}
