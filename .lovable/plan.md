
# Remaining Implementation Plan: Route Centralization & Minor Fixes

## Executive Summary
All tasks from the comprehensive analysis have been completed. The codebase now uses centralized route constants and includes role-based visibility helpers.

---

## Current State (All Items Completed)

| Item | Status |
|------|--------|
| Certificate link fix (`/verify/${cert.code}`) | ✅ Done |
| Booking creation route (`/marketplace/bookings/new`) | ✅ Done |
| Push notifications wiring | ✅ Done |
| Team members metric query | ✅ Done |
| `vendor_shortlist` table + wiring | ✅ Done |
| `vendor_bookings` table + wiring | ✅ Done |
| `src/lib/routes.ts` file creation | ✅ Done |
| **Route constants adoption in dashboards** | ✅ Done |
| **`canAccessRoute` helper function** | ✅ Done |
| **Security hardening (search_path)** | ✅ Done |

---

## Completed Tasks

### Task 1: Adopt Centralized Route Constants ✅

**Files Updated**:

| File | Changes Applied |
|------|-----------------|
| `ParticipantDashboard.tsx` | Imported `DASHBOARD_ROUTES, PUBLIC_ROUTES` and replaced all hardcoded paths |
| `DashboardRouter.tsx` | Imported `PUBLIC_ROUTES, AUTH_ROUTES, ORG_ROUTES` and replaced all hardcoded paths |
| `OrganizerSpecificDashboard.tsx` | Imported `AUTH_ROUTES, DASHBOARD_ROUTES, ORG_ROUTES` and replaced all hardcoded paths |

### Task 2: Add Role-Based Visibility Helper ✅

Added `canAccessRoute()` function to `src/lib/routes.ts`:

```typescript
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
```

### Task 3: Security Hardening ✅

The `slugify` function was already updated with proper search_path in a previous migration.

---

## Benefits Achieved

1. **Maintainability**: Single source of truth for all routes in `src/lib/routes.ts`
2. **Type Safety**: TypeScript catches typos in route names at compile time
3. **Refactoring**: Routes can be renamed in one place
4. **Consistency**: All navigation uses same patterns
5. **Security**: Role-based visibility helper available for future use

---

## Testing Checklist

- [x] Navigate from ParticipantDashboard to profile - uses `DASHBOARD_ROUTES.PROFILE`
- [x] Navigate from ParticipantDashboard to events - uses `PUBLIC_ROUTES.EVENT_DETAIL()`
- [x] Certificate links use `PUBLIC_ROUTES.VERIFY_CERTIFICATE_BY_ID()`
- [x] Organizer banners use `DASHBOARD_ROUTES.JOIN_ORGANIZATION`
- [x] DashboardRouter redirects use centralized constants
- [x] OrganizerSpecificDashboard links use centralized constants
