/**
 * Centralized Route Constants
 * 
 * Use these constants throughout the application to prevent path mismatches
 * and ensure consistent navigation patterns.
 * 
 * Pattern:
 * - Static routes are string constants
 * - Dynamic routes are functions that return strings
 * - Org-scoped routes take orgSlug as first parameter
 */

// =============================================================================
// PUBLIC ROUTES (accessible without authentication)
// =============================================================================

export const PUBLIC_ROUTES = {
  // Landing & Marketing
  HOME: '/',
  PRICING: '/pricing',
  
  // Legal
  PRIVACY: '/privacy',
  TERMS: '/terms',
  COOKIES: '/cookies',
  SECURITY: '/security',
  
  // Help (public)
  HELP: '/help',
  
  // Authentication
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Events (public browsing)
  EVENTS: '/events',
  EVENT_DETAIL: (eventId: string) => `/events/${eventId}`,
  EVENT_BY_SLUG: (slug: string) => `/event/${slug}`,
  EVENT_CHANNELS: (eventId: string) => `/event/${eventId}/channels`,
  
  // Certificate verification
  VERIFY_CERTIFICATE: '/verify',
  VERIFY_CERTIFICATE_BY_ID: (certificateId: string) => `/verify/${certificateId}`,
  
  // Public profiles
  PORTFOLIO: (userId: string) => `/portfolio/${userId}`,
  EMBED_PORTFOLIO: (userId: string) => `/embed/portfolio/${userId}`,
  VENDOR_PROFILE: (vendorId: string) => `/vendor/${vendorId}`,
  
  // Organization public pages
  ORG_LANDING: (orgSlug: string) => `/${orgSlug}`,
  ORG_PRODUCTS: (orgSlug: string) => `/${orgSlug}/products`,
} as const;

// =============================================================================
// AUTHENTICATED ROUTES (require login)
// =============================================================================

export const AUTH_ROUTES = {
  // Onboarding
  ONBOARDING_WELCOME: '/onboarding/welcome',
  ONBOARDING_ORGANIZATION: '/onboarding/organization',
  ORGANIZER_ONBOARDING: '/dashboard/onboarding/organizer',
  
  // Payment callbacks
  PAYMENT_SUCCESS: '/payment-success',
  REGISTRATION_SUCCESS: '/registration-success',
  
  // Organization creation
  CREATE_ORGANIZATION: '/organizations/create',
} as const;

// =============================================================================
// ADMIN ROUTES (require SUPER_ADMIN role)
// =============================================================================

export const ADMIN_ROUTES = {
  GENERATE_BACKGROUNDS: '/admin/generate-backgrounds',
  ROLES_DIAGRAM: '/admin/roles-diagram',
  USER_ROLES: '/admin/user-roles',
} as const;

// =============================================================================
// DASHBOARD ROUTES (authenticated participant/user dashboard)
// =============================================================================

export const DASHBOARD_ROUTES = {
  // Main dashboard
  ROOT: '/dashboard',
  HOME: '/dashboard/home',
  
  // Profile
  PROFILE: '/dashboard/profile',
  PROFILE_SETTINGS: '/dashboard/profile/settings',
  
  // Participant-specific
  PARTICIPANT_EVENTS: '/dashboard/participant-events',
  FOLLOWED_ORGANIZATIONS: '/dashboard/followed-organizations',
  
  // Organization discovery
  JOIN_ORGANIZATION: '/dashboard/organizations/join',
  
  // Support & Help
  SUPPORT: '/dashboard/support',
  HELP: '/help', // Redirects to public help
  
  // Notifications & Communications
  NOTIFICATIONS: '/dashboard/notifications',
  COMMUNICATIONS: '/dashboard/communications',
  
  // Search
  SEARCH: '/dashboard/search',
  
  // Settings
  SETTINGS: '/dashboard/settings',
  
  // Analytics
  ANALYTICS: '/dashboard/analytics',
  
  // Data Lab
  DATA_LAB: '/dashboard/data-lab',
} as const;

// =============================================================================
// ORGANIZATION-SCOPED ROUTES (require org context)
// =============================================================================

export const ORG_ROUTES = {
  // Dashboard
  DASHBOARD: (orgSlug: string) => `/${orgSlug}/dashboard`,
  
  // Event Management
  EVENT_MANAGEMENT: (orgSlug: string) => `/${orgSlug}/eventmanagement`,
  EVENT_CREATE: (orgSlug: string) => `/${orgSlug}/eventmanagement/create`,
  EVENT_DETAIL: (orgSlug: string, eventId: string) => `/${orgSlug}/eventmanagement/${eventId}`,
  EVENT_TEMPLATES: (orgSlug: string) => `/${orgSlug}/eventmanagement/templates`,
  EVENT_REGISTRATIONS: (orgSlug: string) => `/${orgSlug}/eventmanagement/registrations`,
  
  // Workspaces
  WORKSPACES: (orgSlug: string) => `/${orgSlug}/workspaces`,
  WORKSPACE_DETAIL: (orgSlug: string, workspaceId: string) => `/${orgSlug}/workspaces/${workspaceId}`,
  
  // Team
  TEAM: (orgSlug: string) => `/${orgSlug}/team`,
  
  // Marketplace
  MARKETPLACE: (orgSlug: string) => `/${orgSlug}/marketplace`,
  MARKETPLACE_DISCOVER: (orgSlug: string) => `/${orgSlug}/marketplace?tab=discover`,
  
  // Organization settings
  SETTINGS: (orgSlug: string) => `/${orgSlug}/settings`,
  
  // Admin
  ADMIN: (orgSlug: string) => `/${orgSlug}/admin`,
} as const;

// =============================================================================
// STANDALONE SERVICE ROUTES
// =============================================================================

export const SERVICE_ROUTES = {
  // Marketplace (standalone)
  MARKETPLACE: '/marketplace',
  
  // Organizer dashboard (org-agnostic)
  ORGANIZER_DASHBOARD: '/organizer/dashboard',
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the base path for the current context (org-scoped or global dashboard)
 */
export function getBasePath(orgSlug?: string | null): string {
  return orgSlug ? `/${orgSlug}` : '/dashboard';
}

/**
 * Build an event management path with optional org context
 */
export function getEventManagementPath(orgSlug?: string | null): string {
  return orgSlug 
    ? ORG_ROUTES.EVENT_MANAGEMENT(orgSlug)
    : '/dashboard/eventmanagement';
}

/**
 * Build a workspaces path with optional org context
 */
export function getWorkspacesPath(orgSlug?: string | null): string {
  return orgSlug
    ? ORG_ROUTES.WORKSPACES(orgSlug)
    : '/dashboard/workspaces';
}

/**
 * Build a team path - only available for org-scoped contexts
 */
export function getTeamPath(orgSlug?: string | null): string | null {
  return orgSlug ? ORG_ROUTES.TEAM(orgSlug) : null;
}

/**
 * Check if a route requires organization context
 */
export function requiresOrgContext(path: string): boolean {
  const orgOnlyPatterns = [
    /^\/[^/]+\/team/,
    /^\/[^/]+\/admin/,
    /^\/[^/]+\/eventmanagement/,
    /^\/[^/]+\/workspaces/,
  ];
  
  return orgOnlyPatterns.some(pattern => pattern.test(path));
}

/**
 * Check if a user role can access a given route
 * Returns true if access is allowed, false if the route is restricted
 */
export function canAccessRoute(route: string, userRole: string): boolean {
  const organizerOnlyPatterns = [
    '/organizer',
    '/eventmanagement',
    '/workspaces',
    '/admin',
  ];
  
  if (userRole === 'PARTICIPANT') {
    return !organizerOnlyPatterns.some(pattern => route.includes(pattern));
  }
  return true;
}

// =============================================================================
// ROUTE VALIDATION
// =============================================================================

/**
 * All valid route prefixes for validation
 */
export const VALID_ROUTE_PREFIXES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/pricing',
  '/privacy',
  '/terms',
  '/cookies',
  '/security',
  '/help',
  '/events',
  '/event/',
  '/verify',
  '/portfolio/',
  '/embed/',
  '/vendor/',
  '/marketplace',
  '/dashboard',
  '/organizer',
  '/onboarding',
  '/organizations',
  '/payment-success',
  '/registration-success',
  '/admin',
  '/dev/',
] as const;

export default {
  PUBLIC: PUBLIC_ROUTES,
  AUTH: AUTH_ROUTES,
  ADMIN: ADMIN_ROUTES,
  DASHBOARD: DASHBOARD_ROUTES,
  ORG: ORG_ROUTES,
  SERVICE: SERVICE_ROUTES,
};
