
# Integrate Organization Create/Join into Organizer Onboarding

## Overview

Currently, when a new organizer completes the 5-step onboarding wizard, they are redirected to `/onboarding/organization` (OrganizerOnboardingPage) which shows a checklist but requires them to navigate away to create or join an organization. This creates a fragmented experience.

This plan integrates the organization creation/joining directly into the onboarding wizard as a new step, providing a seamless single-flow experience that follows industrial best practices.

---

## Current Flow Analysis

```text
Step 0: Role Selection (participant/organizer)
Step 1: Basic Profile (name, username, avatar)
Step 2: About You (organization name text field, job title, org type)
Step 3: Connectivity (social links - skippable)
Step 4: Preferences (event types, team size)
        ↓
[Submit] → Redirect to /onboarding/organization
        ↓
OrganizerOnboardingPage (checklist with links to create/join)
```

**Problem**: The "About You" step (Step 2) asks for "organization name" as a simple text field, but this doesn't actually create or link to a real organization entity in the database.

---

## Proposed Solution

Replace the organizer's "About You" step (Step 2) with an enhanced "Organization Setup" step that provides:

1. **Two-tab interface**: "Create New" or "Join Existing"
2. **Create New tab**: Full organization creation form (name, slug, category, description, etc.)
3. **Join Existing tab**: Search and request to join existing organizations
4. **Skip option**: Allow organizers to skip and complete organization setup later

### Updated Flow

```text
Step 0: Role Selection (participant/organizer)
Step 1: Basic Profile (name, username, avatar)
Step 2: Organization Setup (CREATE or JOIN) ← NEW ENHANCED STEP
Step 3: Connectivity (social links - skippable)
Step 4: Preferences (event types, team size)
        ↓
[Submit] → Direct to org dashboard or participant dashboard
```

---

## Implementation Plan

### Phase 1: Create OrganizationSetupStep Component

**New file**: `src/components/onboarding/steps/OrganizationSetupStep.tsx`

This component will feature:

- **Tabbed UI** using Radix Tabs for "Create New" vs "Join Existing"
- **Create New Tab**:
  - Organization name (required)
  - URL slug with auto-generation from name
  - Category selector (College, Company, Industry, Non-profit)
  - Description (optional)
  - Contact details (optional)
  - Real-time slug availability check
- **Join Existing Tab**:
  - Search input with debounced queries
  - Organization results list with status indicators
  - "Request to Join" buttons
  - Pending/Active membership status display
- **Skip option**: "I'll set this up later" button

**Accessibility features**:
- ARIA labels for all form controls
- Focus management between tabs
- LiveRegion announcements for async operations
- Keyboard navigation support

**Validation**:
- Zod schema for create form validation
- Real-time slug uniqueness check
- Clear error messaging

### Phase 2: Update Onboarding State Hook

**File**: `src/components/onboarding/hooks/useOnboardingState.ts`

Changes:
- Add `organizationSetup` field to `OnboardingData` interface
- Add new Zod schema `organizationSetupSchema` with discriminated union:
  - `{ action: 'create', data: CreateOrganizationDTO }`
  - `{ action: 'join', organizationId: string }`
  - `{ action: 'skip' }`
- Update step labels for organizer flow

### Phase 3: Update OnboardingWizard

**File**: `src/components/onboarding/OnboardingWizard.tsx`

Changes:
- Replace `AboutYouStep` for organizers with `OrganizationSetupStep`
- Add `handleOrganizationSetupSubmit` callback that:
  - If "create": Calls `create-organization` edge function
  - If "join": Calls `requestJoinOrganization` service
  - If "skip": Proceeds without organization action
- Store created/joined organization reference for final navigation
- Update final navigation logic:
  - Created org → `/${org.slug}/dashboard`
  - Joined org (pending) → `/dashboard` with notification about pending approval
  - Skipped → `/onboarding/organization` (existing checklist page)

### Phase 4: Backend Integration

**Reuse existing infrastructure**:
- `create-organization` edge function (already exists)
- `useCreateOrganization` hook (already exists)
- `useRequestJoinOrganization` hook (already exists)
- `useSearchOrganizations` hook (already exists)
- `useMyOrganizationMemberships` hook (already exists)

**No new edge functions needed** - all required APIs are already available.

### Phase 5: Skip Flow Enhancement

If organizer skips organization setup:
- Store flag in localStorage to remind them later
- Show subtle reminder banner on dashboard
- Existing `/onboarding/organization` checklist remains available

---

## Technical Details

### New Zod Schema for Organization Setup

```typescript
export const createOrganizationSetupSchema = z.object({
  action: z.literal('create'),
  name: z.string().trim().min(1, 'Organization name is required').max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  category: z.enum(['COLLEGE', 'COMPANY', 'INDUSTRY', 'NON_PROFIT']),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
});

export const joinOrganizationSetupSchema = z.object({
  action: z.literal('join'),
  organizationId: z.string().uuid(),
  organizationName: z.string(), // For display/confirmation
});

export const skipOrganizationSetupSchema = z.object({
  action: z.literal('skip'),
});

export const organizationSetupSchema = z.discriminatedUnion('action', [
  createOrganizationSetupSchema,
  joinOrganizationSetupSchema,
  skipOrganizationSetupSchema,
]);
```

### Component Structure

```typescript
interface OrganizationSetupStepProps {
  data: OrganizationSetupData | null;
  onSubmit: (data: OrganizationSetupData) => void;
  onSkip: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}
```

### Slug Auto-Generation

```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/onboarding/steps/OrganizationSetupStep.tsx` | CREATE | New component with create/join tabs |
| `src/components/onboarding/hooks/useOnboardingState.ts` | MODIFY | Add organizationSetup schema and data field |
| `src/components/onboarding/OnboardingWizard.tsx` | MODIFY | Integrate OrganizationSetupStep, update handlers |
| `src/components/onboarding/index.ts` | MODIFY | Export new component if needed |

---

## UI/UX Considerations

### Create New Tab Design
- Clean form layout matching existing onboarding aesthetic
- Gradient header consistent with wizard branding
- Auto-generated slug preview with edit capability
- Category visual selector (optional enhancement)

### Join Existing Tab Design
- Prominent search input
- Clear status badges (Joined, Pending, Available)
- One-click request to join
- Inline loading states

### Mobile Responsiveness
- Stacked layout for tabs on mobile
- Full-width form controls
- Touch-friendly tap targets (min 44px)

### Error Handling
- Inline field validation errors
- Toast notifications for API errors
- Retry capability for failed requests
- Clear messaging for duplicate slugs

---

## Security Considerations

- Organization creation requires authenticated user (enforced by edge function)
- Slug uniqueness validated server-side
- Join requests create PENDING memberships (not auto-approved)
- RLS policies on organizations table control visibility
- No sensitive data exposed in search results

---

## Testing Checklist

- [ ] Create organization with valid data
- [ ] Create organization with duplicate slug (should show error)
- [ ] Join existing organization
- [ ] Join already-joined organization (should show "Joined" status)
- [ ] Skip organization setup
- [ ] Navigate back and forward between steps
- [ ] Mobile responsive layout
- [ ] Keyboard navigation
- [ ] Screen reader accessibility

---

## Rollback Strategy

If issues arise:
1. Revert to using original `AboutYouStep` for organizers
2. Keep redirect to `/onboarding/organization` for organization setup
3. No database changes required (uses existing tables/policies)

