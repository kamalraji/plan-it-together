

# Fix: Workspace Create Page Not Opening After Event Creation

## Problem Summary

When clicking "Create Workspace" in the post-event-creation dialog, the page doesn't navigate anywhere because the `handleCreateWorkspace` function in `EventFormPage.tsx` constructs an invalid URL path.

## Root Cause Analysis

The `handleCreateWorkspace` function (lines 300-307) has two bugs:

### Bug 1: Incorrect Regex Pattern
```javascript
const basePath = currentPath.replace(/\/events\/create$/, '');
```
The actual path is `/:orgSlug/eventmanagement/create`, not `/:orgSlug/events/create`. The regex never matches, so `basePath` retains the full path including `/eventmanagement/create`.

### Bug 2: Non-existent Route Target
```javascript
navigate(`${basePath}/events/new/${createdEventId}/workspaces`, { replace: true });
```
This generates a path like `/:orgSlug/eventmanagement/create/events/new/uuid/workspaces` which doesn't match any defined route.

### Correct Route Structure
Looking at `WorkspaceService.tsx`, the correct routes are:
- `/:orgSlug/workspaces/create` - Basic workspace creation
- `/:orgSlug/workspaces/create/:eventId` - Workspace creation with event pre-selected

---

## Solution

Update `handleCreateWorkspace` to construct the correct workspace creation URL:

```typescript
const handleCreateWorkspace = useCallback(() => {
  setShowPostCreate(false);
  if (createdEventId) {
    // Construct workspace create path based on org context
    const workspacePath = orgSlug 
      ? `/${orgSlug}/workspaces/create/${createdEventId}`
      : `/dashboard/workspaces/create/${createdEventId}`;
    navigate(workspacePath, { replace: true });
  }
}, [createdEventId, orgSlug, navigate]);
```

### Also Fix: handleContinueEditing (Similar Bug)

The `handleContinueEditing` function has the same regex issue:
```javascript
const basePath = currentPath.replace(/\/events\/create$/, '');
navigate(`${basePath}/events/${createdEventId}/edit`, { replace: true });
```

Should be:
```typescript
const handleContinueEditing = useCallback(() => {
  setShowPostCreate(false);
  if (createdEventId) {
    const editPath = orgSlug
      ? `/${orgSlug}/eventmanagement/${createdEventId}/edit`
      : `/dashboard/eventmanagement/${createdEventId}/edit`;
    navigate(editPath, { replace: true });
  }
}, [createdEventId, orgSlug, navigate]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/events/form/EventFormPage.tsx` | Fix `handleCreateWorkspace` and `handleContinueEditing` to use correct paths based on `orgSlug` param |

---

## Technical Details

### Before (Buggy)
```typescript
const handleCreateWorkspace = useCallback(() => {
  setShowPostCreate(false);
  if (createdEventId) {
    const currentPath = location.pathname;
    const basePath = currentPath.replace(/\/events\/create$/, '');
    navigate(`${basePath}/events/new/${createdEventId}/workspaces`, { replace: true });
  }
}, [createdEventId, location.pathname, navigate]);

const handleContinueEditing = useCallback(() => {
  setShowPostCreate(false);
  if (createdEventId) {
    const currentPath = location.pathname;
    const basePath = currentPath.replace(/\/events\/create$/, '');
    navigate(`${basePath}/events/${createdEventId}/edit`, { replace: true });
  }
}, [createdEventId, location.pathname, navigate]);
```

### After (Fixed)
```typescript
const handleCreateWorkspace = useCallback(() => {
  setShowPostCreate(false);
  if (createdEventId) {
    // Use correct workspace create path with event pre-selection
    const workspacePath = orgSlug 
      ? `/${orgSlug}/workspaces/create/${createdEventId}`
      : `/dashboard/workspaces/create/${createdEventId}`;
    navigate(workspacePath, { replace: true });
  }
}, [createdEventId, orgSlug, navigate]);

const handleContinueEditing = useCallback(() => {
  setShowPostCreate(false);
  if (createdEventId) {
    // Use correct event edit path
    const editPath = orgSlug
      ? `/${orgSlug}/eventmanagement/${createdEventId}/edit`
      : `/dashboard/eventmanagement/${createdEventId}/edit`;
    navigate(editPath, { replace: true });
  }
}, [createdEventId, orgSlug, navigate]);
```

Note: `orgSlug` is already available from `useParams` at line 80:
```typescript
const { eventId, orgSlug } = useParams<{ eventId?: string; orgSlug?: string }>();
```

---

## Testing Checklist

- [ ] Create a new event and click "Create Workspace" - should navigate to workspace creation page with event pre-selected
- [ ] Create a new event and click "Continue Editing" - should navigate to event edit page
- [ ] Create a new event and click "Preview Event" - should navigate to public event page
- [ ] Test both within org context (/:orgSlug/...) and dashboard context (/dashboard/...)

