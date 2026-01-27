/**
 * Auth Hooks - Authentication and authorization related hooks
 * 
 * Re-exports hooks from the flat structure for backwards compatibility
 * while providing organized imports.
 */

// Core authentication
export { useAuth } from '../useAuth';
export { useAuthSessionRefresh } from '../useAuthSessionRefresh';
export { useAdminSessionTimeout } from '../useAdminSessionTimeout';
export { useAdminAuditLog } from '../useAdminAuditLog';

// User profile and validation
export { useUserProfile } from '../useUserProfile';
export { useUsernameValidation, canChangeUsername } from '../useUsernameValidation';
