/**
 * Common Hooks - Shared utility hooks used across the application
 * 
 * Re-exports hooks from the flat structure for backwards compatibility
 * while providing organized imports.
 */

// UI and mobile
export { useIsMobile } from '../use-mobile';
export { useToast, toast } from '../use-toast';
export { useTheme } from '../useTheme';
export { useSwipeGesture } from '../useSwipeGesture';
export { useMobileHomeData } from '../useMobileHomeData';

// Network and API
export { useNetworkStatus } from '../useNetworkStatus';
export { useApiHealth } from '../useApiHealth';
export { useOffline } from '../useOffline';

// Data fetching utilities
export { usePaginatedQuery } from '../usePaginatedQuery';
export { usePrefetchWorkspace, usePrefetchOrganization, usePrefetchEvent, usePrefetchProfile } from '../usePrefetch';
export { useOptimisticMutation } from '../useOptimisticMutation';
export { useRetry } from '../useRetry';

// Form and UX
export { useUnsavedChangesWarning } from '../useUnsavedChangesWarning';
export { useSeo } from '../useSeo';

// Notifications
export { useNotifications } from '../useNotifications';
export { useNotificationFeed } from '../useNotificationFeed';
export { useReminders } from '../useReminders';
export { useWebhookNotifications } from '../useWebhookNotifications';

// Support
export { useSupportTickets } from '../useSupportTickets';
export { useIssues } from '../useIssues';

// Vendor
export { useVendorStatus } from '../useVendorStatus';

// Volunteer
export { useVolunteerShifts } from '../useVolunteerShifts';

// Export list
export { useExportList } from '../useExportList';

// ID generation
export { useIDCardGeneration } from '../useIDCardGeneration';

// Contingency
export { useContingency } from '../useContingency';

// Debounce
export { useDebounce } from './useDebounce';
