import { useSearchParams, useParams, useNavigate, useLocation } from 'react-router-dom';
import { WorkspaceTab } from './useWorkspaceShell';
import { 
  parseWorkspaceUrl, 
  buildWorkspaceUrl as buildHierarchicalUrl,
  WorkspacePathSegment,
  DeepLinkParams,
  WorkspaceLevel,
  slugify,
  dbTypeToLevel,
} from '@/lib/workspaceNavigation';

// Re-export for backward compatibility
export type WorkspaceTypePath = WorkspaceLevel;

export interface WorkspaceQueryParams {
  workspaceId?: string;
  eventId?: string;
  name?: string;
  tab?: WorkspaceTab;
  taskId?: string;
  sectionId?: string;
  roleSpace?: string;
}

export interface HierarchicalParams {
  orgSlug?: string;
  eventSlug?: string;
  rootSlug?: string;
  departmentSlug?: string;
  committeeSlug?: string;
  teamSlug?: string;
}

/**
 * Unified hook for workspace URL query parameter management
 * Supports both legacy and new hierarchical URL structures
 * 
 * New URL Structure:
 * - /:orgSlug/workspaces/:eventSlug/root/:rootSlug?eventId=xxx&workspaceId=xxx
 * - /:orgSlug/workspaces/:eventSlug/root/:rootSlug/department/:deptSlug?eventId=xxx&workspaceId=xxx
 * - /:orgSlug/workspaces/:eventSlug/root/:rootSlug/department/:deptSlug/committee/:committeeSlug?eventId=xxx&workspaceId=xxx
 */
export function useWorkspaceQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse hierarchical URL
  const parsed = parseWorkspaceUrl(location.pathname, location.search);
  
  // Route params for legacy compatibility
  const routeParams = useParams<{ 
    orgSlug?: string; 
    eventId?: string; 
    eventSlug?: string;
    workspaceType?: string;
    rootSlug?: string;
    deptSlug?: string;
    committeeSlug?: string;
    teamSlug?: string;
  }>();

  // Extract query params
  const params: WorkspaceQueryParams = {
    workspaceId: searchParams.get('workspaceId') || undefined,
    eventId: searchParams.get('eventId') || undefined,
    name: searchParams.get('name') || undefined,
    tab: (searchParams.get('tab') as WorkspaceTab) || undefined,
    taskId: searchParams.get('taskId') || undefined,
    sectionId: searchParams.get('sectionid') || undefined,
    roleSpace: searchParams.get('roleSpace') || undefined,
  };

  // Hierarchical path params
  const hierarchicalParams: HierarchicalParams = {
    orgSlug: parsed.orgSlug || routeParams.orgSlug,
    eventSlug: parsed.eventSlug || routeParams.eventSlug,
    rootSlug: parsed.rootSlug || routeParams.rootSlug,
    departmentSlug: parsed.departmentSlug || routeParams.deptSlug,
    committeeSlug: parsed.committeeSlug || routeParams.committeeSlug,
    teamSlug: parsed.teamSlug || routeParams.teamSlug,
  };

  // Determine current workspace level from URL
  const currentLevel: WorkspaceLevel | undefined = 
    hierarchicalParams.teamSlug ? 'team' :
    hierarchicalParams.committeeSlug ? 'committee' :
    hierarchicalParams.departmentSlug ? 'department' :
    hierarchicalParams.rootSlug ? 'root' : undefined;

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
   * Build a hierarchical workspace URL
   */
  const buildWorkspaceUrl = (options: {
    orgSlug: string;
    eventSlug: string;
    eventId: string;
    hierarchy: WorkspacePathSegment[];
    deepLink?: DeepLinkParams;
  }): string => {
    return buildHierarchicalUrl(
      {
        orgSlug: options.orgSlug,
        eventSlug: options.eventSlug,
        eventId: options.eventId,
        hierarchy: options.hierarchy,
      },
      options.deepLink
    );
  };

  /**
   * Navigate to a workspace with the hierarchical URL structure
   */
  const navigateToWorkspace = (options: {
    orgSlug: string;
    eventSlug: string;
    eventId: string;
    hierarchy: WorkspacePathSegment[];
    deepLink?: DeepLinkParams;
  }) => {
    const url = buildWorkspaceUrl(options);
    navigate(url);
  };

  /**
   * Build workspace URL from flat workspace data (for backward compatibility)
   */
  const buildSimpleWorkspaceUrl = (options: {
    orgSlug: string;
    eventSlug: string;
    eventId: string;
    workspaceType: string;
    workspaceName: string;
    workspaceId: string;
    tab?: WorkspaceTab;
    taskId?: string;
    sectionId?: string;
  }): string => {
    const level = dbTypeToLevel(options.workspaceType);
    const hierarchy: WorkspacePathSegment[] = [{
      level,
      slug: slugify(options.workspaceName),
      workspaceId: options.workspaceId,
    }];
    
    return buildHierarchicalUrl(
      {
        orgSlug: options.orgSlug,
        eventSlug: options.eventSlug,
        eventId: options.eventId,
        hierarchy,
      },
      {
        tab: options.tab,
        taskId: options.taskId,
        sectionId: options.sectionId,
      }
    );
  };

  /**
   * Map database workspace_type to URL path segment
   */
  const getWorkspaceTypePath = (dbType: string): WorkspaceTypePath => {
    return dbTypeToLevel(dbType);
  };

  return {
    params,
    hierarchicalParams,
    currentLevel,
    parsed,
    routeParams,
    setParam,
    setMultipleParams,
    buildWorkspaceUrl,
    buildSimpleWorkspaceUrl,
    navigateToWorkspace,
    getWorkspaceTypePath,
    searchParams,
    setSearchParams,
  };
}
