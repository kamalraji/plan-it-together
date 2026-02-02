import { WorkspaceTab } from '@/hooks/useWorkspaceShell';

// ============================================
// URL Logging & Debugging Configuration
// ============================================

const URL_DEBUG_ENABLED = import.meta.env.DEV || localStorage.getItem('DEBUG_WORKSPACE_URLS') === 'true';

interface UrlLogEntry {
  timestamp: string;
  component: string;
  action: 'generate' | 'validate' | 'navigate' | 'parse';
  url: string;
  isValid: boolean;
  context?: Record<string, unknown>;
  error?: string;
}

const urlLogHistory: UrlLogEntry[] = [];
const MAX_LOG_HISTORY = 100;

/**
 * Log URL generation/validation for debugging
 */
export function logWorkspaceUrl(entry: Omit<UrlLogEntry, 'timestamp'>): void {
  const fullEntry: UrlLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  
  // Store in history
  urlLogHistory.push(fullEntry);
  if (urlLogHistory.length > MAX_LOG_HISTORY) {
    urlLogHistory.shift();
  }
  
  if (URL_DEBUG_ENABLED) {
    // Debug logging disabled in production for zero console output
  }
}

/**
 * Get URL log history for debugging
 */
export function getUrlLogHistory(): UrlLogEntry[] {
  return [...urlLogHistory];
}

/**
 * Clear URL log history
 */
export function clearUrlLogHistory(): void {
  urlLogHistory.length = 0;
}

/**
 * Enable/disable URL debugging at runtime
 */
export function setUrlDebugEnabled(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem('DEBUG_WORKSPACE_URLS', 'true');
  } else {
    localStorage.removeItem('DEBUG_WORKSPACE_URLS');
  }
}

// ============================================
// URL Validation Utilities
// ============================================

export interface UrlValidationResult {
  isValid: boolean;
  isHierarchical: boolean;
  isLegacy: boolean;
  errors: string[];
  warnings: string[];
  parsed?: ParsedWorkspaceUrl;
}

/**
 * Comprehensive validation of workspace URLs
 * Checks for hierarchical format compliance and common issues
 */
export function validateWorkspaceUrl(url: string): UrlValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Parse URL
  let pathname: string;
  let search: string;
  
  try {
    // Handle both full URLs and paths
    if (url.startsWith('http')) {
      const parsed = new URL(url);
      pathname = parsed.pathname;
      search = parsed.search;
    } else {
      const [path, query = ''] = url.split('?');
      pathname = path;
      search = query ? `?${query}` : '';
    }
  } catch (e) {
    return {
      isValid: false,
      isHierarchical: false,
      isLegacy: false,
      errors: ['Invalid URL format'],
      warnings: [],
    };
  }
  
  const segments = pathname.split('/').filter(Boolean);
  
  // Must have at least orgSlug/workspaces/eventSlug
  if (segments.length < 3) {
    errors.push('URL too short: missing org, workspaces, or event slug');
    return { isValid: false, isHierarchical: false, isLegacy: false, errors, warnings };
  }
  
  if (segments[1] !== 'workspaces') {
    errors.push(`Expected 'workspaces' as second segment, got '${segments[1]}'`);
    return { isValid: false, isHierarchical: false, isLegacy: false, errors, warnings };
  }
  
  const eventSlugOrId = segments[2];
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isEventUuid = uuidPattern.test(eventSlugOrId);
  
  // Check for legacy URL pattern
  if (isEventUuid) {
    warnings.push('Using legacy UUID format for event instead of slug');
    return {
      isValid: false,
      isHierarchical: false,
      isLegacy: true,
      errors: ['Legacy URL format detected - should use hierarchical format'],
      warnings,
    };
  }
  
  // Check for hierarchical structure
  if (segments.length < 5) {
    // Just the workspace list URL (/:org/workspaces/:event)
    if (segments.length === 3) {
      return {
        isValid: true,
        isHierarchical: false,
        isLegacy: false,
        errors: [],
        warnings: ['URL is workspace list, not specific workspace'],
      };
    }
    errors.push('Missing hierarchical path segments (root/:slug/...)');
    return { isValid: false, isHierarchical: false, isLegacy: false, errors, warnings };
  }
  
  // Validate hierarchical structure
  const validLevels = ['root', 'department', 'committee', 'team'];
  const levelOrder = { root: 0, department: 1, committee: 2, team: 3 };
  let lastLevelOrder = -1;
  
  for (let i = 3; i < segments.length; i += 2) {
    const level = segments[i];
    const slug = segments[i + 1];
    
    if (!validLevels.includes(level)) {
      errors.push(`Invalid level '${level}' at position ${i}. Expected one of: ${validLevels.join(', ')}`);
      continue;
    }
    
    if (!slug) {
      errors.push(`Missing slug after level '${level}'`);
      continue;
    }
    
    // Check level order
    const currentOrder = levelOrder[level as keyof typeof levelOrder];
    if (currentOrder <= lastLevelOrder) {
      errors.push(`Invalid level order: '${level}' should not follow previous level`);
    }
    lastLevelOrder = currentOrder;
    
    // Validate slug format
    if (slug !== slugify(slug)) {
      warnings.push(`Slug '${slug}' may not be properly formatted`);
    }
    
    // Check for UUID in slug position
    if (uuidPattern.test(slug)) {
      errors.push(`UUID found in slug position for '${level}': should use human-readable slug`);
    }
  }
  
  // Validate query params
  const searchParams = new URLSearchParams(search);
  if (!searchParams.has('eventId')) {
    warnings.push('Missing eventId query parameter');
  }
  if (!searchParams.has('workspaceId')) {
    warnings.push('Missing workspaceId query parameter');
  }
  
  // Parse the URL if valid enough
  let parsed: ParsedWorkspaceUrl | undefined;
  if (errors.length === 0) {
    try {
      parsed = parseWorkspaceUrl(pathname, search);
    } catch (e) {
      errors.push('Failed to parse URL structure');
    }
  }
  
  return {
    isValid: errors.length === 0,
    isHierarchical: errors.length === 0 && segments.length >= 5,
    isLegacy: false,
    errors,
    warnings,
    parsed,
  };
}

/**
 * Batch validate multiple URLs
 */
export function validateWorkspaceUrls(urls: string[]): Map<string, UrlValidationResult> {
  const results = new Map<string, UrlValidationResult>();
  
  for (const url of urls) {
    results.set(url, validateWorkspaceUrl(url));
  }
  
  // Log summary
  const validCount = Array.from(results.values()).filter(r => r.isValid).length;
  const hierarchicalCount = Array.from(results.values()).filter(r => r.isHierarchical).length;
  const legacyCount = Array.from(results.values()).filter(r => r.isLegacy).length;
  
  logWorkspaceUrl({
    component: 'BatchValidator',
    action: 'validate',
    url: `[${urls.length} URLs]`,
    isValid: validCount === urls.length,
    context: {
      total: urls.length,
      valid: validCount,
      hierarchical: hierarchicalCount,
      legacy: legacyCount,
    },
  });
  
  return results;
}

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
// URL Building Functions (with logging)
// ============================================

/**
 * Build a hierarchical workspace URL with full ancestry path
 */
export function buildWorkspaceUrl(
  context: WorkspaceUrlContext,
  deepLink?: DeepLinkParams,
  logSource?: string
): string {
  const { orgSlug, eventSlug, eventId, hierarchy } = context;
  
  if (!hierarchy.length) {
    const url = `/${orgSlug}/workspaces/${eventSlug}`;
    logWorkspaceUrl({
      component: logSource || 'buildWorkspaceUrl',
      action: 'generate',
      url,
      isValid: true,
      context: { type: 'workspace-list', orgSlug, eventSlug },
    });
    return url;
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
  
  const url = `${basePath}?${queryParams.toString()}`;
  
  // Validate and log
  const validation = validateWorkspaceUrl(url);
  logWorkspaceUrl({
    component: logSource || 'buildWorkspaceUrl',
    action: 'generate',
    url,
    isValid: validation.isValid,
    context: {
      orgSlug,
      eventSlug,
      hierarchyDepth: hierarchy.length,
      targetLevel: lastSegment.level,
      hasDeepLink: !!deepLink,
    },
    ...(validation.errors.length > 0 && { error: validation.errors.join('; ') }),
  });
  
  return url;
}

/**
 * Build a simple workspace URL for a single workspace (when you don't have full hierarchy)
 */
export function buildSimpleWorkspaceUrl(options: {
  orgSlug: string;
  eventSlug: string;
  eventId: string;
  workspaceType: WorkspaceLevel;
  workspaceSlug: string;
  workspaceId: string;
  deepLink?: DeepLinkParams;
}, logSource?: string): string {
  const { orgSlug, eventSlug, eventId, workspaceType, workspaceSlug, workspaceId, deepLink } = options;
  
  // For simple URLs, we just use the current workspace level
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
  
  const url = `${basePath}?${queryParams.toString()}`;
  
  logWorkspaceUrl({
    component: logSource || 'buildSimpleWorkspaceUrl',
    action: 'generate',
    url,
    isValid: true,
    context: {
      type: 'simple',
      orgSlug,
      eventSlug,
      workspaceType,
      note: 'Simple URL - may not include full hierarchy',
    },
  });
  
  return url;
}

// ============================================
// URL Parsing Functions
// ============================================

/**
 * Parse a hierarchical workspace URL into its components
 */
export function parseWorkspaceUrl(pathname: string, search: string, logSource?: string): ParsedWorkspaceUrl {
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
  
  logWorkspaceUrl({
    component: logSource || 'parseWorkspaceUrl',
    action: 'parse',
    url: `${pathname}${search}`,
    isValid: true,
    context: {
      orgSlug: result.orgSlug,
      eventSlug: result.eventSlug,
      hasRoot: !!result.rootSlug,
      hasDepartment: !!result.departmentSlug,
      hasCommittee: !!result.committeeSlug,
      hasTeam: !!result.teamSlug,
    },
  });
  
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
 */
export function isLegacyWorkspaceUrl(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length >= 4 && segments[1] === 'workspaces') {
    const potentialEventId = segments[2];
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(potentialEventId);
  }
  return false;
}

/**
 * Check if a URL matches the new hierarchical format
 */
export function isHierarchicalWorkspaceUrl(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length >= 5 && segments[1] === 'workspaces') {
    const potentialEventSlug = segments[2];
    const potentialLevel = segments[3];
    
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
 * Build full hierarchical URL from workspace data (with logging)
 */
export function buildFullHierarchicalUrl(options: {
  orgSlug: string;
  eventSlug: string;
  eventId: string;
  currentWorkspaceId: string;
  workspaces: WorkspaceData[];
  deepLink?: DeepLinkParams;
}, logSource?: string): string {
  const { orgSlug, eventSlug, eventId, currentWorkspaceId, workspaces, deepLink } = options;
  
  const hierarchy = buildHierarchyChain(currentWorkspaceId, workspaces);
  
  const url = buildWorkspaceUrl(
    { orgSlug, eventSlug, eventId, hierarchy },
    deepLink,
    logSource || 'buildFullHierarchicalUrl'
  );
  
  return url;
}

// ============================================
// Debug Utilities (expose to window in dev)
// ============================================

if (typeof window !== 'undefined' && (import.meta.env.DEV || localStorage.getItem('DEBUG_WORKSPACE_URLS') === 'true')) {
  (window as any).__workspaceUrlDebug = {
    getLogHistory: getUrlLogHistory,
    clearLogHistory: clearUrlLogHistory,
    validateUrl: validateWorkspaceUrl,
    validateUrls: validateWorkspaceUrls,
    setDebugEnabled: setUrlDebugEnabled,
    isLegacy: isLegacyWorkspaceUrl,
    isHierarchical: isHierarchicalWorkspaceUrl,
  };
  
  // Debug utilities registered at window.__workspaceUrlDebug
}
