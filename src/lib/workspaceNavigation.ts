import { WorkspaceTab } from '@/hooks/useWorkspaceShell';

// ============================================
// Types
// ============================================

export type WorkspaceLevel = 'root' | 'department' | 'committee' | 'team';

export interface WorkspacePathSegment {
  level: WorkspaceLevel;
  slug: string;
  workspaceId?: string;
}

export interface WorkspaceUrlContext {
  orgSlug: string;
  eventSlug: string;
  eventId: string;
  hierarchy: WorkspacePathSegment[];
}

export interface DeepLinkParams {
  tab?: WorkspaceTab;
  taskId?: string;
  sectionId?: string;
  roleSpace?: string;
}

export interface ParsedWorkspaceUrl {
  orgSlug: string;
  eventSlug: string;
  rootSlug?: string;
  departmentSlug?: string;
  committeeSlug?: string;
  teamSlug?: string;
  eventId?: string;
  workspaceId?: string;
  deepLink: DeepLinkParams;
}

// ============================================
// Slugification Utility
// ============================================

/**
 * Convert a string to a URL-friendly slug
 * @example slugify("Marketing Team") -> "marketing-team"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// ============================================
// URL Building Functions
// ============================================

/**
 * Build a hierarchical workspace URL with full ancestry path
 * 
 * @example L1 Root:
 *   buildWorkspaceUrl({ orgSlug: 'acme', eventSlug: 'conference-2024', eventId: 'uuid', hierarchy: [{ level: 'root', slug: 'main-operations' }] })
 *   -> /acme/workspaces/conference-2024/root/main-operations?eventId=uuid&workspaceId=xxx
 * 
 * @example L3 Committee:
 *   buildWorkspaceUrl({ orgSlug: 'acme', eventSlug: 'conf', eventId: 'uuid', hierarchy: [
 *     { level: 'root', slug: 'symposium' },
 *     { level: 'department', slug: 'content' },
 *     { level: 'committee', slug: 'marketing' }
 *   ]})
 *   -> /acme/workspaces/conf/root/symposium/department/content/committee/marketing?eventId=uuid&workspaceId=xxx
 */
export function buildWorkspaceUrl(
  context: WorkspaceUrlContext,
  deepLink?: DeepLinkParams
): string {
  const { orgSlug, eventSlug, eventId, hierarchy } = context;
  
  if (!hierarchy.length) {
    return `/${orgSlug}/workspaces/${eventSlug}`;
  }

  // Build path segments: /root/:rootSlug/department/:deptSlug/committee/:committeeSlug
  const pathSegments = hierarchy.map(seg => `${seg.level}/${seg.slug}`).join('/');
  const basePath = `/${orgSlug}/workspaces/${eventSlug}/${pathSegments}`;
  
  // Build query params
  const queryParams = new URLSearchParams();
  queryParams.set('eventId', eventId);
  
  // Use the last workspace's ID as the current workspaceId
  const lastSegment = hierarchy[hierarchy.length - 1];
  if (lastSegment.workspaceId) {
    queryParams.set('workspaceId', lastSegment.workspaceId);
  }
  
  // Add deep link params
  if (deepLink) {
    if (deepLink.tab && deepLink.tab !== 'overview') {
      queryParams.set('tab', deepLink.tab);
    }
    if (deepLink.taskId) {
      queryParams.set('taskId', deepLink.taskId);
    }
    if (deepLink.sectionId) {
      queryParams.set('sectionid', deepLink.sectionId);
    }
    if (deepLink.roleSpace && deepLink.roleSpace !== 'ALL') {
      queryParams.set('roleSpace', deepLink.roleSpace);
    }
  }
  
  return `${basePath}?${queryParams.toString()}`;
}

/**
 * Build a simple workspace URL for a single workspace (when you don't have full hierarchy)
 * This creates the type-based URL with query params for context
 */
export function buildSimpleWorkspaceUrl(options: {
  orgSlug: string;
  eventSlug: string;
  eventId: string;
  workspaceType: WorkspaceLevel;
  workspaceSlug: string;
  workspaceId: string;
  deepLink?: DeepLinkParams;
}): string {
  const { orgSlug, eventSlug, eventId, workspaceType, workspaceSlug, workspaceId, deepLink } = options;
  
  // For simple URLs, we just use the current workspace level
  // Full hierarchy building requires fetching ancestor data
  const basePath = `/${orgSlug}/workspaces/${eventSlug}/${workspaceType}/${workspaceSlug}`;
  
  const queryParams = new URLSearchParams();
  queryParams.set('eventId', eventId);
  queryParams.set('workspaceId', workspaceId);
  
  if (deepLink) {
    if (deepLink.tab && deepLink.tab !== 'overview') {
      queryParams.set('tab', deepLink.tab);
    }
    if (deepLink.taskId) {
      queryParams.set('taskId', deepLink.taskId);
    }
    if (deepLink.sectionId) {
      queryParams.set('sectionid', deepLink.sectionId);
    }
    if (deepLink.roleSpace && deepLink.roleSpace !== 'ALL') {
      queryParams.set('roleSpace', deepLink.roleSpace);
    }
  }
  
  return `${basePath}?${queryParams.toString()}`;
}

// ============================================
// URL Parsing Functions
// ============================================

/**
 * Parse a hierarchical workspace URL into its components
 * 
 * Supports patterns:
 * - /:orgSlug/workspaces/:eventSlug/root/:rootSlug
 * - /:orgSlug/workspaces/:eventSlug/root/:rootSlug/department/:deptSlug
 * - /:orgSlug/workspaces/:eventSlug/root/:rootSlug/department/:deptSlug/committee/:committeeSlug
 * - /:orgSlug/workspaces/:eventSlug/root/:rootSlug/department/:deptSlug/committee/:committeeSlug/team/:teamSlug
 */
export function parseWorkspaceUrl(pathname: string, search: string): ParsedWorkspaceUrl {
  const searchParams = new URLSearchParams(search);
  
  // Parse path segments
  const segments = pathname.split('/').filter(Boolean);
  
  const result: ParsedWorkspaceUrl = {
    orgSlug: segments[0] || '',
    eventSlug: segments[2] || '', // segments[1] is 'workspaces'
    deepLink: {
      tab: (searchParams.get('tab') as WorkspaceTab) || undefined,
      taskId: searchParams.get('taskId') || undefined,
      sectionId: searchParams.get('sectionid') || undefined,
      roleSpace: searchParams.get('roleSpace') || undefined,
    },
    eventId: searchParams.get('eventId') || undefined,
    workspaceId: searchParams.get('workspaceId') || undefined,
  };
  
  // Parse hierarchy from path: root/:rootSlug/department/:deptSlug/...
  const hierarchyStart = 3; // Start after orgSlug/workspaces/eventSlug
  
  for (let i = hierarchyStart; i < segments.length; i += 2) {
    const level = segments[i];
    const slug = segments[i + 1];
    
    if (!slug) break;
    
    switch (level) {
      case 'root':
        result.rootSlug = slug;
        break;
      case 'department':
        result.departmentSlug = slug;
        break;
      case 'committee':
        result.committeeSlug = slug;
        break;
      case 'team':
        result.teamSlug = slug;
        break;
    }
  }
  
  return result;
}

/**
 * Detect current workspace level from parsed URL
 */
export function getWorkspaceLevelFromUrl(parsed: ParsedWorkspaceUrl): WorkspaceLevel | null {
  if (parsed.teamSlug) return 'team';
  if (parsed.committeeSlug) return 'committee';
  if (parsed.departmentSlug) return 'department';
  if (parsed.rootSlug) return 'root';
  return null;
}

// ============================================
// Workspace Type Mapping
// ============================================

const DB_TYPE_TO_LEVEL: Record<string, WorkspaceLevel> = {
  'ROOT': 'root',
  'DEPARTMENT': 'department',
  'COMMITTEE': 'committee',
  'TEAM': 'team',
};

const LEVEL_TO_DB_TYPE: Record<WorkspaceLevel, string> = {
  'root': 'ROOT',
  'department': 'DEPARTMENT',
  'committee': 'COMMITTEE',
  'team': 'TEAM',
};

/**
 * Convert database workspace_type to URL level
 */
export function dbTypeToLevel(dbType: string | null | undefined): WorkspaceLevel {
  return DB_TYPE_TO_LEVEL[dbType || ''] || 'root';
}

/**
 * Convert URL level to database workspace_type
 */
export function levelToDbType(level: WorkspaceLevel): string {
  return LEVEL_TO_DB_TYPE[level];
}

// ============================================
// Legacy URL Detection & Redirect Helpers
// ============================================

/**
 * Check if a URL matches the legacy format
 * Legacy: /:orgSlug/workspaces/:eventId/:workspaceType?name=xxx&workspaceId=xxx
 * Where eventId is a UUID
 */
export function isLegacyWorkspaceUrl(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  
  // Pattern: orgSlug/workspaces/eventId/workspaceType
  if (segments.length >= 4 && segments[1] === 'workspaces') {
    const potentialEventId = segments[2];
    // Check if it looks like a UUID (legacy) vs a slug (new)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(potentialEventId);
  }
  return false;
}

/**
 * Check if a URL matches the new hierarchical format
 * New: /:orgSlug/workspaces/:eventSlug/root/:rootSlug/...
 */
export function isHierarchicalWorkspaceUrl(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  
  // Must have at least: orgSlug/workspaces/eventSlug/root/rootSlug
  if (segments.length >= 5 && segments[1] === 'workspaces') {
    const potentialEventSlug = segments[2];
    const potentialLevel = segments[3];
    
    // Check if eventSlug is NOT a UUID (new format uses slugs)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isSlug = !uuidPattern.test(potentialEventSlug);
    const isValidLevel = ['root', 'department', 'committee', 'team'].includes(potentialLevel);
    
    return isSlug && isValidLevel;
  }
  return false;
}

// ============================================
// Hierarchy Building Helpers
// ============================================

interface WorkspaceData {
  id: string;
  slug: string;
  name: string;
  workspaceType: string | null;
  parentWorkspaceId: string | null;
}

/**
 * Build hierarchy chain from current workspace to root
 * Returns array ordered from root -> current
 */
export function buildHierarchyChain(
  currentWorkspaceId: string,
  workspaces: WorkspaceData[]
): WorkspacePathSegment[] {
  const workspaceMap = new Map(workspaces.map(ws => [ws.id, ws]));
  const chain: WorkspacePathSegment[] = [];
  
  let currentId: string | null = currentWorkspaceId;
  
  while (currentId) {
    const workspace = workspaceMap.get(currentId);
    if (!workspace) break;
    
    chain.unshift({
      level: dbTypeToLevel(workspace.workspaceType),
      slug: workspace.slug || slugify(workspace.name),
      workspaceId: workspace.id,
    });
    
    currentId = workspace.parentWorkspaceId;
  }
  
  return chain;
}

/**
 * Build full hierarchical URL from workspace data
 */
export function buildFullHierarchicalUrl(options: {
  orgSlug: string;
  eventSlug: string;
  eventId: string;
  currentWorkspaceId: string;
  workspaces: WorkspaceData[];
  deepLink?: DeepLinkParams;
}): string {
  const { orgSlug, eventSlug, eventId, currentWorkspaceId, workspaces, deepLink } = options;
  
  const hierarchy = buildHierarchyChain(currentWorkspaceId, workspaces);
  
  return buildWorkspaceUrl(
    { orgSlug, eventSlug, eventId, hierarchy },
    deepLink
  );
}
