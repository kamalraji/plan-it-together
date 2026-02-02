
# Plan: Unify Mobile and Desktop Experience

## Overview
Remove the dedicated mobile app shell, bottom navigation, mobile header, and mobile home screen. Mobile users will see the exact same layout as desktop, with the responsive sidebar handling navigation across all screen sizes. This follows the modern **"responsive-first" design pattern** where a single responsive layout adapts to all screen sizes rather than maintaining separate mobile and desktop codebases.

## Rationale (Industry Best Practices)

1. **Single Source of Truth**: Maintaining separate mobile/desktop layouts doubles maintenance effort and creates feature drift over time
2. **Consistent UX**: Users moving between devices experience the same interface, reducing cognitive load
3. **Sidebar-Based Navigation**: Modern web apps (Notion, Linear, Slack) use collapsible sidebars that work on all screen sizes
4. **Touch-Friendly Desktop Components**: Shadcn UI components are already built with touch targets in mind
5. **Progressive Enhancement**: The existing Sidebar component already handles mobile via `offcanvas` mode

## Current Mobile-Specific Components to Remove

| Component | Location | Purpose |
|-----------|----------|---------|
| `MobileAppShell` | `src/components/mobile/` | Wrapper with mobile header, bottom nav, FAB |
| `MobileHeader` | `src/components/mobile/` | Fixed top bar with org logo, sync status |
| `MobileBottomNav` | `src/components/mobile/` | 5-tab bottom navigation |
| `MobileFAB` | `src/components/mobile/` | Floating action button for quick actions |
| `MobileHomePage` | `src/components/mobile/` | Dedicated mobile home dashboard |
| `MobileQuickActionsSheet` | `src/components/mobile/` | Bottom sheet for quick actions |
| `MobileSearchOverlay` | `src/components/mobile/` | Full-screen search overlay |
| `MobileWorkspaceDashboard` | `src/components/workspace/mobile/` | Dedicated mobile workspace view |

## Components to Keep (Useful Across All Devices)

| Component | Reason to Keep |
|-----------|---------------|
| `OfflineModeBanner` | Network status indicator works on all devices |
| `SyncProgressIndicator` | Useful for showing sync status everywhere |
| `PullToRefresh` | Can be conditionally used on touch devices |
| `MobileSkeleton` | Skeleton patterns are reusable |

## Implementation Steps

### Step 1: Update OrgScopedLayout
Remove the mobile-specific conditional branch that renders `MobileAppShell`. All screen sizes will use the same `SidebarProvider` + `ConsoleHeader` + `OrganizationSidebar` layout.

**File**: `src/components/organization/OrgScopedLayout.tsx`
- Remove the `isMobile` check (line 179-232) that conditionally renders `MobileAppShell`
- Remove the `useIsMobile` hook import
- Remove the `MobileAppShell` import
- The existing desktop layout already handles mobile via the Sidebar's `offcanvas` mode

### Step 2: Update ResponsiveWorkspaceDashboard
Remove the mobile/desktop conditional rendering. Always render `WorkspaceDashboard`.

**File**: `src/components/workspace/ResponsiveWorkspaceDashboard.tsx`
- Remove the `isMobile` state and screen size detection
- Remove the `MobileWorkspaceDashboard` import
- Always return `WorkspaceDashboard` (it's already responsive via Tailwind)

### Step 3: Enhance Desktop Sidebar for Mobile
Ensure the existing sidebar works well on small screens with proper touch targets and offcanvas behavior.

**File**: `src/components/organization/OrganizationSidebar.tsx`
- Already configured with `collapsible="offcanvas"` which slides in from the left on mobile
- Verify touch targets are minimum 44x44px on interactive elements

### Step 4: Enhance ConsoleHeader for Mobile
Ensure the header displays well on small screens.

**File**: `src/components/routing/ConsoleHeader.tsx`
- Already has responsive padding and sizing (`px-3 sm:px-4 lg:px-6`)
- Already hides text labels on mobile, shows icons only
- Already has mobile-friendly touch targets

### Step 5: Add Offline Banner to Desktop Layout
Move the offline indicator from mobile shell to the main layout so all users see network status.

**File**: `src/components/organization/OrgScopedLayout.tsx`
- Import `OfflineModeBanner` and `useOffline` hook
- Add the banner below the header in the desktop layout

### Step 6: Clean Up Mobile Directory (Optional)
Components can be deprecated but kept for reference, or moved to a `deprecated/` folder.

**Files to mark as deprecated/remove**:
- `src/components/mobile/MobileAppShell.tsx`
- `src/components/mobile/MobileHeader.tsx`
- `src/components/mobile/MobileBottomNav.tsx`
- `src/components/mobile/MobileFAB.tsx`
- `src/components/mobile/MobileHomePage.tsx`
- `src/components/mobile/MobileQuickActionsSheet.tsx`
- `src/components/mobile/MobileSearchOverlay.tsx`
- `src/components/mobile/home/*` (all home-specific components)
- `src/components/workspace/mobile/MobileWorkspaceDashboard.tsx`
- `src/components/workspace/mobile/MobileWorkspaceHeader.tsx`
- `src/components/workspace/mobile/MobileNavigation.tsx`

### Step 7: Update Exports
Update the barrel exports to remove deprecated mobile components.

**Files**:
- `src/components/mobile/index.ts`
- `src/components/workspace/mobile/index.ts`

---

## Technical Details

### Before (Mobile)
```text
+---------------------------+
|     MobileHeader          | <- fixed top
+---------------------------+
|                           |
|    MobileHomePage         |
|    or children            |
|                           |
+---------------------------+
|      MobileFAB            | <- floating
+---------------------------+
|   MobileBottomNav         | <- fixed bottom
+---------------------------+
```

### After (Unified - Same as Desktop)
```text
+---------------------------+
|     ConsoleHeader         | <- fixed top with hamburger
+---------------------------+
| Sidebar |                 |
| (slide) |    Content      |
| (touch  |    (SidebarInset)|
|  open)  |                 |
+---------------------------+
```

### Sidebar Behavior by Screen Size
- **Desktop (≥768px)**: Sidebar collapsed by default, expands on hover/click
- **Mobile (<768px)**: Sidebar hidden, slides in via hamburger menu (offcanvas mode)
- **Touch Detection**: No longer forces mobile view, relies on viewport width only

### Key Tailwind Breakpoints Used
- `sm:` (640px) - Small text adjustments
- `md:` (768px) - Primary mobile/desktop breakpoint
- `lg:` (1024px) - Wider layouts

---

## Files to Modify

1. **`src/components/organization/OrgScopedLayout.tsx`**
   - Remove mobile conditional branch
   - Add offline banner to unified layout

2. **`src/components/workspace/ResponsiveWorkspaceDashboard.tsx`**
   - Simplify to always render desktop component

3. **`src/components/mobile/index.ts`**
   - Remove deprecated exports, keep useful shared components

4. **`src/components/workspace/mobile/index.ts`**
   - Remove MobileWorkspaceDashboard export

---

## Files to Delete (or Move to Deprecated)

- `src/components/mobile/MobileAppShell.tsx`
- `src/components/mobile/MobileHeader.tsx`
- `src/components/mobile/MobileBottomNav.tsx`
- `src/components/mobile/MobileFAB.tsx`
- `src/components/mobile/MobileHomePage.tsx`
- `src/components/mobile/MobileQuickActionsSheet.tsx`
- `src/components/mobile/MobileSearchOverlay.tsx`
- `src/components/mobile/home/` (entire directory)
- `src/components/workspace/mobile/MobileWorkspaceDashboard.tsx`
- `src/components/workspace/mobile/MobileWorkspaceHeader.tsx`
- `src/components/workspace/mobile/MobileNavigation.tsx`
- `src/components/workspace/mobile/MobileWorkspaceDashboardSkeleton.tsx`

---

## Components to Keep

| Component | New Location | Reason |
|-----------|-------------|--------|
| `OfflineModeBanner` | `src/components/mobile/shared/` | Useful for all devices |
| `SyncProgressIndicator` | `src/components/mobile/shared/` | Useful for all devices |
| `PullToRefresh` | `src/components/mobile/shared/` | Optional touch enhancement |
| `MobileSkeleton` | `src/components/mobile/shared/` | Reusable loading states |

---

## Hooks to Keep/Modify

| Hook | Action |
|------|--------|
| `useIsMobile` | Keep for conditional touch enhancements (not for layout switching) |
| `useMobileHomeData` | Remove (was for mobile home page) |
| `useOffline` | Keep (useful everywhere) |

---

## Risk Mitigation

1. **Testing**: After implementation, test on multiple viewport sizes (320px, 375px, 768px, 1024px, 1440px)
2. **Touch Targets**: Verify all interactive elements maintain 44x44px minimum touch targets
3. **Navigation**: Ensure hamburger menu is discoverable on mobile
4. **Gradual Rollout**: Keep mobile components in codebase (commented/deprecated) until verified
