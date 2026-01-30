/**
 * Centralized Hooks Index
 * 
 * This file provides organized imports for all hooks in the application.
 * Hooks are grouped by domain for easier discovery and maintenance.
 * 
 * Usage:
 *   import { useAuth, useWorkspaceData, useEventData } from '@/hooks';
 *   
 * Or import from specific domains:
 *   import { useAuth } from '@/hooks/auth';
 *   import { useWorkspaceData } from '@/hooks/workspace';
 *   import { useEmailCampaigns } from '@/hooks/committee/communication';
 */

// Auth hooks
export * from './auth';

// Workspace hooks
export * from './workspace';

// Event hooks
export * from './events';

// Organization hooks
export * from './organization';

// Task hooks
export * from './tasks';

// Content hooks  
export * from './content';

// Common utility hooks
export * from './common';

// Catering hooks
export * from './catering';

// IT hooks
export * from './it';

// Committee hooks (shared dashboard hooks only - specific committees have their own imports)
export * from './committee';

// Mobile & Responsiveness
export { useIsMobile } from './use-mobile';
export { 
  useSwipeGesture, 
  useLongPress, 
  useSwipeAction, 
  usePinchZoom 
} from './useTouchGestures';

// URL & Navigation
export { useUrlState } from './useUrlState';
export { useDeepLink } from './useDeepLink';

// Event Registration Management
export { 
  useEventRegistrations, 
  useEventRegistrationStats,
  useUpdateRegistrationStatus,
  useBulkUpdateRegistrations,
  exportRegistrationsToCSV,
} from './useEventRegistrations';

// Workspace & Approvals
export { useApprovalMutations } from './useApprovalMutations';

// Note: For committee-specific hooks with potential naming conflicts, import directly:
// import { useEmailCampaigns } from '@/hooks/committee/communication';
// import { useSocialPosts } from '@/hooks/committee/social';
// import { useSponsors } from '@/hooks/committee/sponsorship';
