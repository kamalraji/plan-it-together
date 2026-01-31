
# Fix: Event Registrations Data Isolation

## Problem Identified
The Registrations Overview page (`/console/events/registrations`) is showing registrations for **all events** across the platform, not just events owned by or belonging to the current organizer. This is a **data isolation security issue**.

## Two-Layer Fix Required

### 1. Database Layer: Strengthen RLS Policy
The current RLS policy on `registrations` allows any organizer to view all registrations. This needs to be scoped to event ownership.

**Current Policy:**
```sql
has_role(auth.uid(), 'organizer') OR ...
```

**Fixed Policy:**
```sql
-- Organizers can only view registrations for their own events
-- (via event ownership or organization membership)
EXISTS (
  SELECT 1 FROM events e
  WHERE e.id = registrations.event_id
  AND (
    e.owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = e.organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'ACTIVE'
      AND om.role IN ('OWNER', 'ADMIN', 'MEMBER')
    )
  )
)
```

### 2. Application Layer: Add Event Ownership Filter
Update `EventRegistrationsOverviewPage.tsx` to filter registrations by events the user owns or belongs to.

**Changes:**
- Filter registrations to only show those from events where:
  - User is the event owner (`events.owner_id`), OR
  - User is an active member of the event's organization

---

## Implementation Steps

### Step 1: Create Migration for RLS Policy Update
Create a new migration that:
1. Drops the existing overly permissive organizer SELECT policy on `registrations`
2. Creates a new scoped policy that checks event ownership via `owner_id` or organization membership

### Step 2: Update Application Query
Modify `EventRegistrationsOverviewPage.tsx`:
1. Fetch user's organization IDs first
2. Build a query that filters registrations to:
   - Events where `owner_id` matches current user, OR
   - Events where `organization_id` is in user's organizations
3. This provides defense-in-depth (app filter + RLS)

### Step 3: Verify Access Control
Ensure Super Admins retain full access while Organizers are properly scoped.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/[new]_fix_registrations_rls.sql` | New migration to fix RLS policy |
| `src/components/routing/services/EventRegistrationsOverviewPage.tsx` | Add ownership filter to query |

---

## Technical Details

### Migration SQL
```sql
-- Drop overly permissive organizer policy
DROP POLICY IF EXISTS "Organizers view registrations" ON public.registrations;

-- Create properly scoped policy for organizers
CREATE POLICY "Organizers view registrations for owned events"
ON public.registrations
FOR SELECT
TO authenticated
USING (
  -- User's own registrations
  user_id = auth.uid()
  -- OR admin access
  OR has_role(auth.uid(), 'admin')
  -- OR organizer for this specific event
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = registrations.event_id
    AND (
      e.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.organization_memberships om
        WHERE om.organization_id = e.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'ACTIVE'
      )
    )
  )
);
```

### Application Query Update
```typescript
// Get user's accessible events via ownership or org membership
const { data: accessibleEventIds } = await supabase
  .from('events')
  .select('id')
  .or(`owner_id.eq.${user.id},organization_id.in.(${userOrgIds.join(',')})`);

// Then filter registrations to those events
let query = supabase
  .from('registrations')
  .select('id, event_id, user_id, status, created_at, events(name, start_date)', { count: 'exact' })
  .in('event_id', accessibleEventIds)
  // ... rest of query
```

---

## Security Impact
- **Before**: Any organizer could see all registrations across the platform
- **After**: Organizers only see registrations for events they own or belong to via organization membership
- **Super Admins**: Retain full access (unchanged)
