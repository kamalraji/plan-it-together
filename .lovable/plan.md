
# Comprehensive Bug Identification and Navigation Analysis Report

## Executive Summary

This analysis covers broken links, improper navigation, partially implemented features, wrongly wired components, and security issues based on industry standards and a systematic review of the codebase and database.

---

## 1. BROKEN LINKS AND NAVIGATION ISSUES

### Critical Broken Links

| Location | Link | Issue | Severity |
|----------|------|-------|----------|
| `ParticipantDashboard.tsx:621` | `/certificates/${cert.id}` | Route does not exist in AppRouter - no `/certificates/:id` route defined | HIGH |
| `ServiceDetailPage.tsx:111` | `/marketplace/bookings/new` | Route does not exist - only `/marketplace/bookings` and `/marketplace/bookings/:bookingId` defined | HIGH |
| `OrganizationSidebar.tsx:73` | `${base}/templates` | Route `/:orgSlug/templates` exists but workspace templates path may be confusing | MEDIUM |
| Multiple workspace files | `${basePath}/${eventId}?workspaceId=${workspaceId}` | Legacy URL format still used in some places while new hierarchical format is active | MEDIUM |

### Navigation Pattern Issues

1. **Certificate View Route Missing**
   - `ParticipantDashboard.tsx` links to `/certificates/${cert.id}` but no such route exists
   - Only `/verify` and `/verify/:certificateId` routes exist for certificate verification
   - Users clicking "View Certificate" will hit 404

2. **Booking Creation Route Missing**
   - `ServiceDetailPage.tsx` navigates to `/marketplace/bookings/new?serviceId=...&date=...`
   - `MarketplaceService.tsx` only defines `/marketplace/bookings` and `/marketplace/bookings/:bookingId`
   - Users clicking "Book Now" on service detail page will hit 404

3. **Workspace URL Format Inconsistencies**
   - Some components use legacy `?workspaceId=xxx` query params
   - Others use new hierarchical format `/root/:rootSlug/department/:deptSlug`
   - `LegacyWorkspaceRedirect.tsx` exists but not all legacy references are redirected

---

## 2. SECURITY ISSUES (Supabase Linter Findings)

### Current Security Warnings (7 issues found)

| Issue | Description | Tables Affected | Priority |
|-------|-------------|-----------------|----------|
| RLS Policy Always True (3x) | Overly permissive `USING (true)` or `WITH CHECK (true)` for non-SELECT operations | Multiple tables | HIGH |
| Function Search Path Mutable (2x) | Functions without `search_path` set, potential SQL injection vector | Unknown functions | MEDIUM |
| Extension in Public Schema | Extension installed in `public` schema instead of `extensions` | N/A | MEDIUM |
| Leaked Password Protection Disabled | Auth setting not enabled | Auth config | MEDIUM |

### Analysis of Permissive Policies

From the database query, notable permissive policies include:
- `contact_submissions`: `WITH CHECK (true)` for INSERT (acceptable - public contact form)
- `volunteer_applications`: `WITH CHECK (true)` for INSERT (acceptable - public applications)
- `notification_queue`: `ALL` with `qual: true` for PUBLIC role (needs review)
- `admin_audit_logs`: `WITH CHECK (true)` for service_role (acceptable)
- Various `service_role` policies with `true` (acceptable - server-side only)

### Recommended Fixes

```text
1. Enable leaked password protection:
   Supabase Dashboard → Authentication → Settings → Password strength

2. Review notification_queue policy:
   - Currently allows ALL operations for PUBLIC role
   - Should be restricted to service_role for INSERT
   - SELECT should be user-scoped

3. Set search_path for custom functions:
   ALTER FUNCTION function_name() SET search_path TO 'public', 'pg_temp';
```

---

## 3. PARTIALLY IMPLEMENTED FEATURES

### Features with Console.log Placeholders

| Component | Feature | Current State | Action Required |
|-----------|---------|---------------|-----------------|
| `BroadcastComposerDialog.tsx:108-110` | Push notifications | Logs "Would send push notification" instead of calling edge function | Wire to `send-push-notification` edge function |
| `EventMarketplaceIntegration.tsx:54` | Add to shortlist | Logs "Adding to shortlist" placeholder | Wire to `vendor_shortlist` table (now exists) |
| `EventMarketplaceIntegration.tsx:71` | Book vendor | Logs booking request data | Wire to `bookings` table |

### Features with TODO Comments

Found 68 files with TODO/FIXME markers. Key ones:

| File | Line | Issue |
|------|------|-------|
| `WorkspaceListPage.tsx:242` | Bulk archive logic | TODO: Implement bulk archive |
| `WorkspaceListPage.tsx:250` | Bulk delete logic | TODO: Implement bulk delete |
| `WorkspaceListPage.tsx:267` | Import workspace | TODO: Implement import |
| `WorkspaceListPage.tsx:282` | Delete confirmation | TODO: Wire to backend |

### Analytics "Coming Soon" Placeholder

- `OrgMarketplacePage.tsx:251` shows "More detailed analytics coming soon" in Analytics tab
- Analytics metrics cards are wired but detailed charts are not implemented

---

## 4. WRONGLY WIRED COMPONENTS

### Route Access Mismatches

1. **Marketplace Access Control**
   - `/marketplace/*` requires `ORGANIZER`, `SUPER_ADMIN`, or `VENDOR` roles
   - But `/vendor/:vendorId` (public vendor profile) is accessible without auth
   - This may cause confusion if users try to access marketplace features from vendor profile

2. **Event Templates Route**
   - `EventService.tsx:62` defines `/templates` → `<EventListPage filterBy="templates" />`
   - `OrganizationSidebar.tsx:64` links to `${base}/eventmanagement/templates`
   - Both work but EventListPage may not properly handle `filterBy="templates"` prop

### Data Flow Issues

1. **Team Members Metric Hardcoded**
   - `AppRouter.tsx:202` shows `teamMembers: 0` with comment "Team metrics will be wired to dedicated tables later"
   - Dashboard displays 0 team members regardless of actual count

2. **ConsoleDashboard Revenue Query**
   - Fetches `amount` from `bookings` table where status is COMPLETED
   - If `amount` column is null or missing, revenue shows as $0

---

## 5. DATABASE SCHEMA ISSUES

### Tables Without Full Integration

| Table | Usage | Status |
|-------|-------|--------|
| `vendor_shortlist` | VendorShortlist.tsx | Now properly integrated (Phase 2 fix) |
| `vendor_bookings` | BookingManagementUI.tsx | Now properly integrated (Phase 2 fix) |
| `vendor_deliverables` | VendorCoordination.tsx | Now properly integrated (Phase 2 fix) |
| `bookings` (separate) | ServiceDetailPage.tsx booking flow | Missing `/marketplace/bookings/new` route |

---

## 6. IMPLEMENTATION PRIORITIES

### Phase 1: Critical Route Fixes (Immediate)

1. **Add certificate view route** or fix ParticipantDashboard link
   - Option A: Add `/certificates/:id` route with certificate display page
   - Option B: Change link to `/verify/${cert.code}` (uses existing verification page)

2. **Add booking creation route**
   - Add `/marketplace/bookings/new` route to MarketplaceService
   - Create `BookingCreatePage` component with proper form

3. **Enable leaked password protection**
   - Enable in Supabase Dashboard

### Phase 2: Feature Completion (Short-term)

1. **Wire push notifications**
   - Call `send-push-notification` edge function in BroadcastComposerDialog
   - Edge function already exists at `supabase/functions/send-push-notification/`

2. **Implement bulk actions in WorkspaceListPage**
   - Wire bulk archive and delete to Supabase mutations

3. **Add team member metrics**
   - Query `organization_members` table for actual team count
   - Update ConsoleDashboard to display real data

### Phase 3: Navigation Cleanup (Medium-term)

1. **Audit all navigation paths** against route definitions
2. **Complete legacy workspace URL migration**
3. **Add E2E navigation tests** to prevent future broken links

---

## 7. FILES REQUIRING CHANGES

| File | Issue | Fix |
|------|-------|-----|
| `src/components/dashboard/ParticipantDashboard.tsx:621` | Broken `/certificates/:id` link | Change to `/verify/${cert.code}` |
| `src/components/marketplace/ServiceDetailPage.tsx:111` | Missing `/marketplace/bookings/new` route | Add route or create modal |
| `src/components/routing/services/MarketplaceService.tsx` | Missing booking creation route | Add `/bookings/new` route |
| `src/components/workspace/communication/BroadcastComposerDialog.tsx:108-110` | Push notification placeholder | Call edge function |
| `src/components/routing/AppRouter.tsx:202` | Hardcoded teamMembers: 0 | Query organization_members |

---

## 8. TESTING CHECKLIST

### Critical Path Tests

- [ ] Click "View Certificate" in ParticipantDashboard → Should not 404
- [ ] Click "Book Now" on ServiceDetailPage → Should not 404
- [ ] Send broadcast with push notification → Should actually send push
- [ ] View dashboard team members → Should show real count
- [ ] Bulk archive workspaces → Should actually archive

### Security Tests

- [ ] Verify leaked password protection is enabled
- [ ] Test notification_queue permissions
- [ ] Verify custom functions have proper search_path

---

## Summary

This analysis identified:
- **2 critical broken links** (certificates view, booking creation)
- **7 security warnings** (3 RLS, 2 function, 1 extension, 1 auth setting)
- **5+ partially implemented features** with console.log placeholders
- **3 wrongly wired components** (team metrics, route mismatches)
- **68 files with TODO markers** requiring future attention

The highest priority fixes are:
1. Add `/certificates/:id` route or fix link
2. Add `/marketplace/bookings/new` route
3. Enable leaked password protection
4. Wire push notification edge function
