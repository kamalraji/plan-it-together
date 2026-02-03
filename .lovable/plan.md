
# Remaining Implementation Plan: Route Centralization & Minor Fixes

## Executive Summary
Based on the comprehensive analysis, the critical bug fixes have been completed. The remaining work focuses on:
1. Adopting the centralized route constants across the codebase
2. Adding role-based visibility checks where beneficial
3. Security hardening for database functions

---

## Current State (Completed Items)

| Item | Status |
|------|--------|
| Certificate link fix (`/verify/${cert.code}`) | ✅ Done |
| Booking creation route (`/marketplace/bookings/new`) | ✅ Done |
| Push notifications wiring | ✅ Done |
| Team members metric query | ✅ Done |
| `vendor_shortlist` table + wiring | ✅ Done |
| `vendor_bookings` table + wiring | ✅ Done |
| `src/lib/routes.ts` file creation | ✅ Done |

---

## Remaining Tasks

### Task 1: Adopt Centralized Route Constants

**Problem**: `src/lib/routes.ts` exists with well-organized route constants but is not imported anywhere in the codebase (0 usages found).

**Files to Update**:

| File | Current Pattern | Use Instead |
|------|-----------------|-------------|
| `ParticipantDashboard.tsx` | `navigate('/dashboard/profile')` | `DASHBOARD_ROUTES.PROFILE` |
| `ParticipantDashboard.tsx` | `navigate('/dashboard/organizations/join')` | `DASHBOARD_ROUTES.JOIN_ORGANIZATION` |
| `ParticipantDashboard.tsx` | `to="/dashboard"` | `DASHBOARD_ROUTES.ROOT` |
| `ParticipantDashboard.tsx` | `to="/events"` | `PUBLIC_ROUTES.EVENTS` |
| `DashboardRouter.tsx` | `Navigate to="/login"` | `PUBLIC_ROUTES.LOGIN` |
| `DashboardRouter.tsx` | `Navigate to="/onboarding/organization"` | `AUTH_ROUTES.ONBOARDING_ORGANIZATION` |
| `OrganizerSpecificDashboard.tsx` | `to="/organizations/create"` | `AUTH_ROUTES.CREATE_ORGANIZATION` |
| `OrganizerSpecificDashboard.tsx` | `to="/dashboard/organizations/join"` | `DASHBOARD_ROUTES.JOIN_ORGANIZATION` |

**Implementation**:
```typescript
// Example transformation in ParticipantDashboard.tsx
import { DASHBOARD_ROUTES, PUBLIC_ROUTES } from '@/lib/routes';

// Before
navigate('/dashboard/profile')

// After  
navigate(DASHBOARD_ROUTES.PROFILE)
```

### Task 2: Add Role-Based Visibility (Optional Enhancement)

**Current State**: ParticipantDashboard already has role checks for organizer-specific banners:
- Line 381: `{user?.role === 'ORGANIZER' && hasCompletedOrganizerOnboarding && ...}`
- Organizer onboarding banner also has role awareness

**Minimal Changes Needed**: The dashboard is participant-focused by design. The only enhancement would be to add a helper for checking if navigation links should be visible.

```typescript
// Add to routes.ts
export function canAccessRoute(route: string, userRole: string): boolean {
  const organizerOnlyRoutes = [
    '/organizer',
    '/eventmanagement',
    '/workspaces',
    '/admin',
  ];
  
  if (userRole === 'PARTICIPANT') {
    return !organizerOnlyRoutes.some(r => route.includes(r));
  }
  return true;
}
```

### Task 3: Security Hardening (Database Functions)

**Issue**: Supabase linter found 2 warnings about functions without explicit `search_path`.

**Migration Already Applied**: The `slugify` function was updated with proper search_path in the last migration:
```sql
CREATE FUNCTION public.slugify(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
```

**Remaining**: Review if any other custom functions need similar updates.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/ParticipantDashboard.tsx` | Import and use route constants |
| `src/components/dashboard/DashboardRouter.tsx` | Import and use route constants |
| `src/components/dashboard/OrganizerSpecificDashboard.tsx` | Import and use route constants |
| `src/lib/routes.ts` | Add `canAccessRoute` helper function |

---

## Implementation Priority

1. **High Priority**: Route constants adoption in dashboard components
2. **Medium Priority**: Add role-based visibility helper
3. **Low Priority**: Security function audit (mostly done)

---

## Estimated Changes

- **4 files** to update with route constant imports
- **~20 hardcoded paths** to replace with constants
- **1 helper function** to add for role-based visibility

---

## Benefits

1. **Maintainability**: Single source of truth for all routes
2. **Type Safety**: TypeScript will catch typos in route names
3. **Refactoring**: Easy to rename routes in one place
4. **Consistency**: All navigation uses same patterns
5. **Security**: Role-based visibility prevents confusion

---

## Testing Checklist

- [ ] Navigate from ParticipantDashboard to profile - should work
- [ ] Navigate from ParticipantDashboard to events - should work
- [ ] Organizer banners still show/hide correctly based on role
- [ ] No 404 errors when clicking any dashboard links
- [ ] Route constants correctly resolve to expected paths
