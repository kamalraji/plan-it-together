
# Comprehensive Event Features Industrial Best Practice Implementation Plan

## Progress Tracking

| Phase | Status | Completed |
|-------|--------|-----------|
| 1. Security Hardening | ✅ Done | Helper functions created, extensions schema ready |
| 2. URL Navigation | ✅ Done | EventSettingsTab, EventAnalyticsTab, EventOpsConsole updated |
| 4. Optimistic Updates | ✅ Done | useEventDraft now has optimistic local saves with sync status |
| 5. Accessibility | ✅ Done | LiveRegion added to analytics, ops console, and registration management |
| 6. Responsiveness | ✅ Done | RegistrationMobileCard created for mobile-optimized registration views |
| 8. Code Quality | ✅ Done | Analytics charts extracted to modular components |
| 9. Query Key Factory | ✅ Done | src/lib/query-keys/events.ts created |
| 3, 7, 10 | 🔲 Pending | Workflows, settings propagation, error handling |


## Executive Summary

This plan addresses gaps identified through comprehensive analysis of the event management system, covering 8 major areas: **Security**, **Data Integrity**, **URL Navigation & Deep Linking**, **Accessibility**, **Responsiveness**, **Optimistic Updates**, **Code Quality**, and **Missing Workflows**.

---

## Analysis Summary

### Current State Assessment

| Area | Status | Key Findings |
|------|--------|--------------|
| Security | Needs Attention | 3 linter warnings: Extensions in public schema, permissive RLS, leaked password protection disabled |
| Deep Linking | Partial | `useDeepLink` and `useUrlState` hooks exist but not consistently used across all event views |
| Accessibility | Good | Skip links, ARIA labels, 44px touch targets present; some gaps in dynamic content announcements |
| Responsiveness | Good | Mobile breakpoints present; some components lack tablet optimization |
| Optimistic Updates | Partial | Implemented in ~14 hooks; missing in event form mutations and some settings |
| Error Boundaries | Good | GlobalErrorBoundary, RetryableErrorBoundary in routing; missing in some isolated components |
| Realtime | Partial | ~36 hooks with subscriptions; event-specific realtime for check-ins exists |
| Console Logs | Clean | No console.log statements found in event components |

---

## Phase 1: Security Hardening (Critical)

### 1.1 Address Supabase Linter Warnings

**Issue 1: Extension in Public Schema**
- Move extensions to a dedicated `extensions` schema
- Migration required

**Issue 2: Permissive RLS Policies**
- Audit all tables with `USING (true)` policies
- Replace with proper role-based conditions

**Issue 3: Leaked Password Protection**
- Enable in Supabase Auth settings (Dashboard action)

### 1.2 Event-Specific RLS Audit

Tables requiring RLS review:
- `events` - Verify organizer-only write access
- `event_drafts` - User-scoped access
- `registrations` - User can see own, organizer sees all for their events
- `ticket_tiers` - Public read, organizer write
- `event_page_views` - Public insert, organizer read

**Files to Modify:**
```text
supabase/migrations/YYYYMMDD_security_hardening.sql
```

---

## Phase 2: URL Navigation & Deep Linking Standardization

### 2.1 Current Gaps

| Component | Current State | Gap |
|-----------|---------------|-----|
| `EventSettingsTab` | No URL params | Tab selection not preserved |
| `EventAnalyticsTab` | No URL params | Date range, chart selection not shareable |
| `EventFormPage` | Section state in memory | Form section not deep-linkable |
| `EventOpsConsole` | No URL params | Filter state not preserved |

### 2.2 Implementation

**Standardize URL state for all event management views:**

```text
/console/events/:eventId?tab=registrations&status=pending&page=2
/console/events/:eventId?tab=analytics&range=30d&chart=registrations
/console/events/:eventId?tab=settings#tickets
/:orgSlug/eventmanagement/:eventId/edit?section=branding
```

**Files to Modify:**
```text
src/components/events/settings/EventSettingsTab.tsx - Add useUrlTab for sub-tabs
src/components/events/analytics/EventAnalyticsTab.tsx - Add date range URL params
src/components/events/form/EventFormPage.tsx - Add section URL params
src/components/events/EventOpsConsole.tsx - Add filter URL params
```

---

## Phase 3: Missing Workflow Assignments

### 3.1 Identified Gaps in Workspace-Event Integration

| Workflow | Status | Gap |
|----------|--------|-----|
| Event → Root Workspace | Exists | Root workspace auto-creates on event publish |
| Registration Workspace | Partial | Not auto-provisioned for all events |
| Check-in Workflow | Exists | Linked to event via workspace |
| Budget Approval | Exists | Full approval workflow implemented |
| Page Builder Assignment | Exists | `AssignPageBuilderDialog` functional |
| Certificate Delegation | Exists | `useCertificateDelegation` implemented |
| Volunteer Shift Assignment | Partial | Missing automated scheduling |

### 3.2 Workflow Enhancements

**Missing: Auto-provision core workspaces on event creation**

Events should auto-create these workspaces when published:
1. Root Workspace (exists)
2. Registration Committee
3. Operations Department
4. Communications Committee

**Files to Modify:**
```text
src/hooks/useEventPublish.ts - Add workspace provisioning on publish
supabase/functions/workspace-provision/ - New edge function (create)
```

---

## Phase 4: Optimistic Updates Standardization

### 4.1 Hooks Missing Optimistic Updates

| Hook | Current | Needed |
|------|---------|--------|
| `useEventDraft` | No `onMutate` | Add optimistic save indicator |
| `useTicketTierManager` (implicit) | Basic mutation | Add optimistic tier updates |
| `useEventFormSubmit` | Loading state only | Show optimistic success before confirmation |
| `usePromoCodeValidation` | Validation only | Cache valid codes optimistically |

### 4.2 Implementation Pattern

Use existing `useOptimisticMutation` helper:

```typescript
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';
```

**Files to Modify:**
```text
src/components/events/settings/TicketTierManager.tsx - Add optimistic updates
src/components/events/settings/PromoCodeManager.tsx - Add optimistic updates
src/hooks/useEventDraft.ts - Add optimistic cache update
```

---

## Phase 5: Accessibility Enhancements

### 5.1 Current Compliance Status

| Feature | Status | Notes |
|---------|--------|-------|
| Skip Links | Implemented | `SkipLink` component in use |
| ARIA Labels | Good | Page builder blocks have ARIA labels |
| Touch Targets | Good | 44px minimum enforced |
| Focus Management | Partial | Missing in modals and dynamic content |
| Live Regions | Exists | `LiveRegion` component available but underused |
| Keyboard Navigation | Partial | Form sections need keyboard shortcuts |

### 5.2 Enhancements Needed

**Add live announcements for:**
- Registration status changes
- Check-in success/failure
- Form validation errors
- Analytics data updates

**Files to Modify:**
```text
src/components/events/registration/RegistrationManagementTab.tsx - Add LiveRegion
src/components/events/analytics/EventAnalyticsTab.tsx - Add ARIA live polite
src/components/events/form/EventFormPage.tsx - Add error announcements
src/components/events/EventOpsConsole.tsx - Add check-in announcements
```

---

## Phase 6: Responsiveness & Mobile Optimization

### 6.1 Current Breakpoint Coverage

```text
sm: 640px   - Present in most components
md: 768px   - Tablet views partially covered
lg: 1024px  - Desktop layouts defined
xl: 1280px  - Wide desktop in page builder
2xl: 1536px - Limited usage
```

### 6.2 Components Needing Mobile Optimization

| Component | Issue | Fix |
|-----------|-------|-----|
| `EventAnalyticsTab` | Charts too small on mobile | Add responsive chart heights |
| `RegistrationManagementTab` | Table columns hidden | Add expandable mobile cards |
| `EventPageBuilder` | Panel widths fixed | Add collapsible mobile panels |
| `EventSettingsTab` | Grid too dense | Stack on mobile |

**Files to Modify:**
```text
src/components/events/analytics/EventAnalyticsTab.tsx - Responsive chart heights
src/components/events/registration/RegistrationManagementTab.tsx - Mobile card view
src/components/events/page-builder/LeftPanel.tsx - Collapsible on mobile
src/components/events/page-builder/RightPanel.tsx - Collapsible on mobile
```

---

## Phase 7: Settings Propagation

### 7.1 Settings That Should Cascade

| Setting | Scope | Propagation Needed |
|---------|-------|-------------------|
| Event Branding (colors, logo) | Event | Landing page, certificates, emails |
| Timezone | Organization | All event dates in org |
| Currency | Organization | All ticket pricing |
| Accessibility Features | Event | All public pages |

### 7.2 Current Gaps

- Certificate templates don't inherit event branding colors
- Email templates don't pull event logo
- Registration confirmation doesn't respect event timezone

**Files to Modify:**
```text
src/hooks/useCertificateTemplates.ts - Pull event branding
src/components/events/shared/EventCountdown.tsx - Respect event timezone
supabase/functions/send-registration-confirmation/index.ts - Include event branding
```

---

## Phase 8: Code Quality & Modularization

### 8.1 File Size Analysis

| File | Lines | Action |
|------|-------|--------|
| `PublicEventPage.tsx` | 552 | Extract hero section, ticket display |
| `RegistrationManagementTab.tsx` | 527 | Extract filters, table row components |
| `EventFormPage.tsx` | 376 | Already well-modularized |
| `EventAnalyticsTab.tsx` | 464 | Extract chart components |

### 8.2 Suggested Extractions

```text
src/components/events/PublicEventPage.tsx
  → Extract: EventHeroSection.tsx, EventTicketCard.tsx, EventOrganizerCard.tsx

src/components/events/registration/RegistrationManagementTab.tsx
  → Extract: RegistrationFilters.tsx, RegistrationTable.tsx, RegistrationMobileCard.tsx

src/components/events/analytics/EventAnalyticsTab.tsx
  → Extract: RegistrationTimelineChart.tsx, TicketDistributionChart.tsx, CheckInPatternChart.tsx
```

---

## Phase 9: Query Optimization

### 9.1 Query Key Factory Audit

**Existing:** `eventKeys` in `useEventData.ts` - Well structured

**Missing standardization in:**
- `useEventRegistrations` - Uses inline query keys
- `useTicketCheckout` - Ad-hoc keys

### 9.2 Recommended Query Key Factory

```typescript
// src/lib/query-keys/events.ts
export const eventQueryKeys = {
  all: ['events'] as const,
  lists: () => [...eventQueryKeys.all, 'list'] as const,
  list: (filters: EventFilters) => [...eventQueryKeys.lists(), filters] as const,
  details: () => [...eventQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventQueryKeys.details(), id] as const,
  registrations: (eventId: string) => [...eventQueryKeys.detail(eventId), 'registrations'] as const,
  analytics: (eventId: string) => [...eventQueryKeys.detail(eventId), 'analytics'] as const,
  settings: (eventId: string) => [...eventQueryKeys.detail(eventId), 'settings'] as const,
};
```

**Files to Modify:**
```text
src/lib/query-keys/events.ts - Create centralized factory
src/hooks/useEventRegistrations.ts - Use factory
src/hooks/useTicketCheckout.ts - Use factory
```

---

## Phase 10: Error Handling & Edge Cases

### 10.1 Missing Error Boundaries

| Area | Current | Needed |
|------|---------|--------|
| Event Form Sections | None | Isolate section crashes |
| Analytics Charts | None | Handle chart render failures |
| Page Builder | Basic | Isolate block rendering errors |

### 10.2 Edge Case Handling

| Scenario | Current | Fix |
|----------|---------|-----|
| Event deleted while editing | 404 page | Show "Event no longer exists" dialog |
| Ticket sold out during checkout | Generic error | Show sold out state with waitlist option |
| Payment timeout | Error toast | Show retry option with countdown |

**Files to Modify:**
```text
src/components/events/form/sections/*.tsx - Add section-level error boundaries
src/components/events/analytics/EventAnalyticsTab.tsx - Add chart error boundaries
src/hooks/useTicketCheckout.ts - Add sold out handling
```

---

## Implementation Priority Matrix

| Phase | Priority | Effort | Impact |
|-------|----------|--------|--------|
| 1. Security Hardening | Critical | Medium | High |
| 2. URL Navigation | High | Medium | High |
| 3. Missing Workflows | Medium | High | Medium |
| 4. Optimistic Updates | Medium | Low | High |
| 5. Accessibility | High | Medium | High |
| 6. Responsiveness | Medium | Medium | Medium |
| 7. Settings Propagation | Low | Medium | Medium |
| 8. Code Quality | Low | Medium | Low |
| 9. Query Optimization | Low | Low | Medium |
| 10. Error Handling | Medium | Medium | High |

---

## Files Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/YYYYMMDD_security_hardening.sql` | RLS policy updates |
| `supabase/functions/workspace-provision/index.ts` | Auto-provision workspaces |
| `src/lib/query-keys/events.ts` | Centralized query key factory |
| `src/components/events/shared/EventHeroSection.tsx` | Extracted hero component |
| `src/components/events/registration/RegistrationFilters.tsx` | Extracted filters |
| `src/components/events/analytics/RegistrationTimelineChart.tsx` | Extracted chart |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/events/settings/EventSettingsTab.tsx` | URL state, accessibility |
| `src/components/events/analytics/EventAnalyticsTab.tsx` | URL state, responsiveness, error boundaries |
| `src/components/events/registration/RegistrationManagementTab.tsx` | Mobile view, live regions |
| `src/components/events/form/EventFormPage.tsx` | URL section params, error announcements |
| `src/components/events/EventOpsConsole.tsx` | URL filters, live announcements |
| `src/components/events/PublicEventPage.tsx` | Extract components, timezone handling |
| `src/hooks/useEventPublish.ts` | Workspace auto-provision |
| `src/hooks/useEventDraft.ts` | Optimistic updates |
| `src/hooks/useEventRegistrations.ts` | Centralized query keys |

---

## Testing Requirements

### Manual Testing Checklist

- [ ] Security: Verify RLS policies prevent unauthorized access
- [ ] Deep Links: Copy URL with filters, paste in new tab, verify state restored
- [ ] Accessibility: Navigate with keyboard only, use screen reader
- [ ] Mobile: Test all event views on 375px width
- [ ] Optimistic: Verify instant UI updates on mutations
- [ ] Error Recovery: Test network failures during operations

### Automated Testing

Add Vitest tests for:
- `useDeepLink` hook behavior
- `useUrlState` with complex filter objects
- Query key factory structure
- Optimistic update rollback on failure

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Supabase Linter Warnings | 3 | 0 |
| URL-preserved views | ~40% | 100% |
| WCAG 2.1 AA compliance | ~85% | 100% |
| Mobile-optimized components | ~70% | 100% |
| Hooks with optimistic updates | 14 | 25+ |
| Console logs in production | 0 | 0 |

