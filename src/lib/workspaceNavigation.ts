import { WorkspaceType } from '@/types';

export type WorkspaceTypePath = 'root' | 'department' | 'committee' | 'team';

export interface WorkspaceUrlOptions {
  orgSlug: string;
  eventId: string;
  workspaceId: string;
  workspaceType: WorkspaceType | string;
  workspaceName?: string;
  tab?: string;
  taskId?: string;
  sectionId?: string;
}

/**
 * Map database workspace_type to URL path segment
 */
export function getWorkspaceTypePath(dbType: WorkspaceType | string): WorkspaceTypePath {
  const typeMap: Record<string, WorkspaceTypePath> = {
    'ROOT': 'root',
    'DEPARTMENT': 'department',
    'COMMITTEE': 'committee',
    'TEAM': 'team',
  };
  return typeMap[dbType] || 'root';
}

/**
 * Convert workspace name to URL-safe slug
 */
export function toNameSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Build a workspace URL with the new type-based path structure
 * 
 * URL Pattern:
 * - L1 Root: /:orgSlug/workspaces/:eventId/root?workspaceId=xxx
 * - L2 Department: /:orgSlug/workspaces/:eventId/department?name=content&workspaceId=xxx
 * - L3 Committee: /:orgSlug/workspaces/:eventId/committee?name=marketing&workspaceId=xxx
 * - L4 Team: /:orgSlug/workspaces/:eventId/team?name=design-team&workspaceId=xxx
 */
export function buildWorkspaceUrl(options: WorkspaceUrlOptions): string {
  const {
    orgSlug,
    eventId,
    workspaceId,
    workspaceType,
    workspaceName,
    tab,
    taskId,
    sectionId,
  } = options;

  const typePath = getWorkspaceTypePath(workspaceType);
  const basePath = `/${orgSlug}/workspaces/${eventId}/${typePath}`;

  const queryParams = new URLSearchParams();
  
  // Add name slug for human-readable URLs (except for root which typically has no name disambiguation)
  if (workspaceName && typePath !== 'root') {
    queryParams.set('name', toNameSlug(workspaceName));
  }
  
  // Always include workspaceId for reliable routing
  queryParams.set('workspaceId', workspaceId);
  
  // Add optional deep-linking params
  if (tab && tab !== 'overview') {
    queryParams.set('tab', tab);
  }
  if (taskId) {
    queryParams.set('taskId', taskId);
  }
  if (sectionId) {
    queryParams.set('sectionid', sectionId);
  }

  return `${basePath}?${queryParams.toString()}`;
}

/**
 * Build workspace settings URL with type-based path
 */
export function buildWorkspaceSettingsUrl(options: Omit<WorkspaceUrlOptions, 'tab' | 'taskId' | 'sectionId'>): string {
  const { orgSlug, eventId, workspaceType, workspaceName, workspaceId } = options;
  const typePath = getWorkspaceTypePath(workspaceType);
  
  const queryParams = new URLSearchParams();
  if (workspaceName && typePath !== 'root') {
    queryParams.set('name', toNameSlug(workspaceName));
  }
  queryParams.set('workspaceId', workspaceId);
  
  return `/${orgSlug}/workspaces/${eventId}/${typePath}/settings?${queryParams.toString()}`;
}

/**
 * Build workspace list URL for an event
 */
export function buildWorkspaceListUrl(orgSlug: string, eventId?: string): string {
  if (eventId) {
    return `/${orgSlug}/workspaces/${eventId}`;
  }
  return `/${orgSlug}/workspaces`;
}
