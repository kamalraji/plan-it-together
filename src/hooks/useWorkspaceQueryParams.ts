import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { WorkspaceTab } from './useWorkspaceShell';

// Workspace type path segments
export type WorkspaceTypePath = 'root' | 'department' | 'committee' | 'team';

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
   * Example: /thittamonehub/workspaces/eventId/department?name=content&workspaceId=xxx
   */
  const buildWorkspaceUrl = (
    options: {
      orgSlug: string;
      eventId: string;
      workspaceType: WorkspaceTypePath;
      workspaceName?: string;
      workspaceId: string;
      tab?: WorkspaceTab;
      taskId?: string;
      sectionId?: string;
    }
  ): string => {
    const basePath = `/${options.orgSlug}/workspaces/${options.eventId}/${options.workspaceType}`;
    
    const queryParams = new URLSearchParams();
    if (options.workspaceName) queryParams.set('name', options.workspaceName.toLowerCase().replace(/\s+/g, '-'));
    queryParams.set('workspaceId', options.workspaceId);
    if (options.tab && options.tab !== 'overview') queryParams.set('tab', options.tab);
    if (options.taskId) queryParams.set('taskId', options.taskId);
    if (options.sectionId) queryParams.set('sectionid', options.sectionId);
    
    return `${basePath}?${queryParams.toString()}`;
  };

  /**
   * Navigate to a workspace with the new URL structure
   */
  const navigateToWorkspace = (options: {
    orgSlug: string;
    eventId: string;
    workspaceType: WorkspaceTypePath;
    workspaceName?: string;
    workspaceId: string;
    tab?: WorkspaceTab;
  }) => {
    const url = buildWorkspaceUrl(options);
    navigate(url);
  };

  /**
   * Map database workspace_type to URL path segment
   */
  const getWorkspaceTypePath = (dbType: string): WorkspaceTypePath => {
    const typeMap: Record<string, WorkspaceTypePath> = {
      'ROOT': 'root',
      'DEPARTMENT': 'department',
      'COMMITTEE': 'committee',
      'TEAM': 'team',
    };
    return typeMap[dbType] || 'root';
  };

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
    const params = new URLSearchParams();
    if (options.workspaceId) params.set('workspaceId', options.workspaceId);
    if (options.tab && options.tab !== 'overview') params.set('tab', options.tab);
    if (options.taskId) params.set('taskId', options.taskId);
    if (options.sectionId) params.set('sectionid', options.sectionId);
    
    const queryString = params.toString();
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
    searchParams,
    setSearchParams,
  };
}
