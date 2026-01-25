/**
 * Route Configuration
 * 
 * Centralized route definitions with metadata for consistent navigation,
 * preloading strategies, and access control.
 */

import { UserRole } from '@/types';

// ============= Route Types =============

export type RoutePreloadStrategy = 'eager' | 'onHover' | 'onVisible' | 'lazy';

export interface RouteConfig {
  path: string;
  title: string;
  description?: string;
  /** Required roles for access. Empty array = any authenticated user */
  requiredRoles?: UserRole[];
  /** Whether route requires email verification */
  requireEmailVerification?: boolean;
  /** Preload strategy for code splitting */
  preload?: RoutePreloadStrategy;
  /** Route is publicly accessible without authentication */
  isPublic?: boolean;
  /** Child routes */
  children?: RouteConfig[];
  /** Icon name for navigation */
  icon?: string;
  /** Hide from navigation menus */
  hidden?: boolean;
}

// ============= Public Routes =============

export const PUBLIC_ROUTES: RouteConfig[] = [
  {
    path: '/',
    title: 'Home',
    description: 'Thittam1Hub - Event Management Platform',
    isPublic: true,
    preload: 'eager',
  },
  {
    path: '/pricing',
    title: 'Pricing',
    description: 'Thittam1Hub pricing and plans',
    isPublic: true,
    preload: 'onHover',
  },
  {
    path: '/login',
    title: 'Sign In',
    description: 'Sign in to your Thittam1Hub account',
    isPublic: true,
    preload: 'eager',
  },
  {
    path: '/register',
    title: 'Create Account',
    description: 'Create your Thittam1Hub account',
    isPublic: true,
    preload: 'eager',
  },
  {
    path: '/forgot-password',
    title: 'Forgot Password',
    isPublic: true,
    preload: 'lazy',
  },
  {
    path: '/reset-password',
    title: 'Reset Password',
    isPublic: true,
    preload: 'lazy',
  },
  {
    path: '/verify',
    title: 'Certificate Verification',
    description: 'Verify certificate authenticity',
    isPublic: true,
    preload: 'lazy',
  },
  {
    path: '/events',
    title: 'Events',
    description: 'Browse upcoming events',
    isPublic: true,
    preload: 'onHover',
  },
  {
    path: '/event/:slug',
    title: 'Event Details',
    isPublic: true,
    preload: 'lazy',
  },
  {
    path: '/portfolio/:userId',
    title: 'Portfolio',
    isPublic: true,
    preload: 'lazy',
  },
  {
    path: '/vendor/:vendorId',
    title: 'Vendor Profile',
    isPublic: true,
    preload: 'lazy',
  },
];

// ============= Dashboard Routes =============

export const DASHBOARD_ROUTES: RouteConfig[] = [
  {
    path: '/dashboard',
    title: 'Dashboard',
    description: 'Your Thittam1Hub dashboard',
    preload: 'eager',
    icon: 'Home',
    children: [
      {
        path: 'home',
        title: 'Home',
        preload: 'eager',
        icon: 'Home',
      },
      {
        path: 'followed-organizations',
        title: 'Followed Organizations',
        requireEmailVerification: false,
        icon: 'Building2',
      },
      {
        path: 'participant-events',
        title: 'My Events',
        requireEmailVerification: false,
        icon: 'Calendar',
      },
      {
        path: 'organizations/join',
        title: 'Join Organization',
        requireEmailVerification: false,
        icon: 'UserPlus',
      },
      {
        path: 'organizations/*',
        title: 'Organizations',
        requiredRoles: [UserRole.ORGANIZER, UserRole.SUPER_ADMIN],
        icon: 'Building',
      },
      {
        path: 'profile/*',
        title: 'Profile',
        requireEmailVerification: false,
        icon: 'User',
      },
      {
        path: 'support/*',
        title: 'Help & Support',
        requireEmailVerification: false,
        icon: 'HelpCircle',
      },
      {
        path: 'notifications/*',
        title: 'Notifications',
        requireEmailVerification: false,
        icon: 'Bell',
      },
      {
        path: 'communications/*',
        title: 'Communications',
        requireEmailVerification: false,
        icon: 'MessageSquare',
      },
      {
        path: 'search',
        title: 'Search',
        requireEmailVerification: false,
        icon: 'Search',
      },
      {
        path: 'data-lab',
        title: 'Data Lab',
        hidden: true,
        icon: 'FlaskConical',
      },
    ],
  },
];

// ============= Organizer Routes =============

export const ORGANIZER_ROUTES: RouteConfig[] = [
  {
    path: '/organizer/dashboard',
    title: 'Organizer Dashboard',
    requiredRoles: [UserRole.ORGANIZER, UserRole.SUPER_ADMIN],
    preload: 'eager',
  },
  {
    path: '/dashboard/onboarding/organizer',
    title: 'Organizer Onboarding',
    requiredRoles: [UserRole.ORGANIZER, UserRole.SUPER_ADMIN],
    hidden: true,
  },
  {
    path: '/organizations/create',
    title: 'Create Organization',
    requireEmailVerification: false,
    preload: 'lazy',
  },
];

// ============= Organization-Scoped Routes =============

export const ORG_SCOPED_ROUTES: RouteConfig[] = [
  {
    path: '/:orgSlug/dashboard',
    title: 'Organization Dashboard',
    requiredRoles: [UserRole.ORGANIZER, UserRole.SUPER_ADMIN],
    preload: 'eager',
    icon: 'LayoutDashboard',
  },
  {
    path: '/:orgSlug/eventmanagement/*',
    title: 'Event Management',
    requiredRoles: [UserRole.ORGANIZER, UserRole.SUPER_ADMIN],
    preload: 'onHover',
    icon: 'Calendar',
  },
  {
    path: '/:orgSlug/workspaces/*',
    title: 'Workspaces',
    requiredRoles: [UserRole.ORGANIZER, UserRole.SUPER_ADMIN],
    preload: 'onHover',
    icon: 'Boxes',
  },
  {
    path: '/:orgSlug/organizations/*',
    title: 'Organization Settings',
    requiredRoles: [UserRole.ORGANIZER, UserRole.SUPER_ADMIN],
    preload: 'lazy',
    icon: 'Settings',
  },
  {
    path: '/:orgSlug/admin/*',
    title: 'Admin',
    requiredRoles: [UserRole.SUPER_ADMIN],
    preload: 'lazy',
    icon: 'Shield',
  },
];

// ============= Marketplace Routes =============

export const MARKETPLACE_ROUTES: RouteConfig[] = [
  {
    path: '/marketplace',
    title: 'Marketplace',
    description: 'Browse and book verified vendors',
    requiredRoles: [UserRole.ORGANIZER, UserRole.SUPER_ADMIN, UserRole.VENDOR],
    preload: 'onHover',
    icon: 'Store',
    children: [
      {
        path: 'services',
        title: 'Services',
        icon: 'Briefcase',
      },
      {
        path: 'vendor/register',
        title: 'Become a Vendor',
        icon: 'UserPlus',
      },
      {
        path: 'vendor/browse',
        title: 'Browse Vendors',
        icon: 'Users',
      },
      {
        path: 'bookings',
        title: 'My Bookings',
        icon: 'CalendarCheck',
      },
    ],
  },
];

// ============= All Routes Combined =============

export const ALL_ROUTES: RouteConfig[] = [
  ...PUBLIC_ROUTES,
  ...DASHBOARD_ROUTES,
  ...ORGANIZER_ROUTES,
  ...ORG_SCOPED_ROUTES,
  ...MARKETPLACE_ROUTES,
];

// ============= Route Helpers =============

/**
 * Find route config by path
 */
export function findRouteByPath(path: string): RouteConfig | undefined {
  const searchRoutes = (routes: RouteConfig[]): RouteConfig | undefined => {
    for (const route of routes) {
      if (route.path === path) return route;
      if (route.children) {
        const found = searchRoutes(route.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  return searchRoutes(ALL_ROUTES);
}

/**
 * Get routes that should be preloaded eagerly on app init
 */
export function getEagerPreloadRoutes(): string[] {
  const collectEager = (routes: RouteConfig[]): string[] => {
    const result: string[] = [];
    for (const route of routes) {
      if (route.preload === 'eager') {
        result.push(route.path);
      }
      if (route.children) {
        result.push(...collectEager(route.children));
      }
    }
    return result;
  };
  return collectEager(ALL_ROUTES);
}

/**
 * Get routes that should be preloaded on hover
 */
export function getHoverPreloadRoutes(): string[] {
  const collectHover = (routes: RouteConfig[]): string[] => {
    const result: string[] = [];
    for (const route of routes) {
      if (route.preload === 'onHover') {
        result.push(route.path);
      }
      if (route.children) {
        result.push(...collectHover(route.children));
      }
    }
    return result;
  };
  return collectHover(ALL_ROUTES);
}

/**
 * Check if a route requires specific roles
 */
export function routeRequiresRoles(path: string): UserRole[] {
  const route = findRouteByPath(path);
  return route?.requiredRoles ?? [];
}

/**
 * Check if a route is public
 */
export function isPublicRoute(path: string): boolean {
  const route = findRouteByPath(path);
  return route?.isPublic ?? false;
}

/**
 * Build breadcrumb from path
 */
export function buildBreadcrumb(path: string): { title: string; path: string }[] {
  const segments = path.split('/').filter(Boolean);
  const breadcrumb: { title: string; path: string }[] = [];
  
  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const route = findRouteByPath(currentPath);
    if (route && !route.hidden) {
      breadcrumb.push({
        title: route.title,
        path: currentPath,
      });
    }
  }
  
  return breadcrumb;
}

// ============= Route Path Builders =============

export const routePaths = {
  // Auth
  login: () => '/login',
  register: () => '/register',
  forgotPassword: () => '/forgot-password',
  
  // Dashboard
  dashboard: () => '/dashboard',
  dashboardHome: () => '/dashboard/home',
  profile: () => '/dashboard/profile',
  profileSettings: () => '/dashboard/profile/settings',
  notifications: () => '/dashboard/notifications',
  search: () => '/dashboard/search',
  
  // Organizations
  joinOrganization: () => '/dashboard/organizations/join',
  createOrganization: () => '/organizations/create',
  organizationList: () => '/dashboard/organizations/list',
  
  // Org-scoped
  orgDashboard: (orgSlug: string) => `/${orgSlug}/dashboard`,
  orgEventManagement: (orgSlug: string) => `/${orgSlug}/eventmanagement`,
  orgEventCreate: (orgSlug: string) => `/${orgSlug}/eventmanagement/create`,
  orgEventDetail: (orgSlug: string, eventId: string) => `/${orgSlug}/eventmanagement/${eventId}`,
  orgWorkspaces: (orgSlug: string) => `/${orgSlug}/workspaces`,
  orgWorkspaceDetail: (orgSlug: string, workspaceId: string) => `/${orgSlug}/workspaces/${workspaceId}`,
  orgSettings: (orgSlug: string) => `/${orgSlug}/organizations/settings`,
  orgAdmin: (orgSlug: string) => `/${orgSlug}/admin`,
  
  // Events
  publicEvents: () => '/events',
  publicEventDetail: (slug: string) => `/event/${slug}`,
  
  // Marketplace
  marketplace: () => '/marketplace',
  marketplaceServices: () => '/marketplace/services',
  marketplaceBookings: () => '/marketplace/bookings',
  vendorProfile: (vendorId: string) => `/vendor/${vendorId}`,
  
  // Verification
  verifyCertificate: (certificateId?: string) => 
    certificateId ? `/verify/${certificateId}` : '/verify',
  
  // Portfolio
  portfolio: (userId: string) => `/portfolio/${userId}`,
} as const;
