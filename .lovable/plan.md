
# Phase 5: Real-Time Integration Implementation Plan

## Overview

This phase focuses on adding comprehensive real-time capabilities across all workspace dashboards and communication features. Building on the Phase 4 backend infrastructure (edge functions, database tables), we'll implement Supabase Realtime subscriptions to enable live updates without page refresh.

## Current State Analysis

### What Already Exists
1. **Real-time hooks available:**
   - `useRealtimeMessages` - Full real-time for channel messages (INSERT/UPDATE/DELETE)
   - `useChannelPresence` - Supabase Presence for online/typing status
   - `useActivityFeed` - Real-time activity feed subscriptions
   - `useApprovalRealtimeUpdates` - Budget/resource request status changes
   - `useTaskRealtimeUpdates` - Task status changes

2. **Real-time-ready components:**
   - `RealtimeMessageThread` - Uses real-time messages + presence + typing indicators
   - `TypingIndicator` - Displays who is typing
   - `ActivityFeedWidget` - Has `enableRealtime` flag

3. **Database tables ready:**
   - `workspace_presence` - Created in Phase 4
   - `channel_messages` - Has real-time subscriptions
   - `workspace_activities` - Activity logging

### What's Missing
1. **Dashboard real-time subscriptions:**
   - `RootDashboard` - No live department stats updates
   - `CommitteeDashboard` - No live task/milestone updates
   - `TeamDashboard` - No live workload changes

2. **Communication integration:**
   - `WorkspaceCommunication` - Uses broken `api.get()` calls instead of edge functions
   - `MessageThread` - Uses polling (5s) instead of Supabase Realtime

3. **Presence system gaps:**
   - No workspace-level presence (only channel-level)
   - No integration with dashboards

---

## Implementation Tasks

### Task 1: Create Real-Time Dashboard Hook
**File:** `src/hooks/useRealtimeDashboard.ts`

Create a unified hook that provides real-time subscriptions for dashboard data:

```text
Features:
- Subscribe to workspace_tasks changes for the event
- Subscribe to workspace_activities for live activity feed
- Subscribe to workspace_milestones for milestone updates
- Subscribe to workspace_team_members for team changes
- Subscribe to budget_requests and resource_requests for approval changes
- Automatic query invalidation on changes
```

This hook will be used by RootDashboard, CommitteeDashboard, and TeamDashboard.

---

### Task 2: Create Workspace Presence Hook
**File:** `src/hooks/useWorkspacePresence.ts`

Create a workspace-level presence system (different from channel presence):

```text
Features:
- Track which workspace a user is currently viewing
- Show online/away/busy status
- Update workspace_presence table
- Heartbeat mechanism (30s intervals)
- Auto-cleanup on tab close/navigate away
- Integration with user profiles for display names
```

---

### Task 3: Update RootDashboard with Real-Time
**File:** `src/components/workspace/root/RootDashboard.tsx`

Enhance the dashboard to use real-time subscriptions:

```text
Changes:
- Import and use useRealtimeDashboard hook
- Add real-time subscription for department stats updates
- Add visual indicator when data is refreshing
- Show live activity count updates
- Add online team members indicator
```

---

### Task 4: Update CommitteeDashboard with Real-Time
**File:** `src/components/workspace/committee/CommitteeDashboard.tsx`

Add real-time task and milestone updates:

```text
Changes:
- Use useTaskRealtimeUpdates for task status changes
- Add real-time milestone progress updates
- Show live notification when tasks are assigned/completed
- Add subtle animation when data updates
```

---

### Task 5: Update TeamDashboard with Real-Time
**File:** `src/components/workspace/team/TeamDashboard.tsx`

Add real-time workload and progress updates:

```text
Changes:
- Subscribe to workspace_team_assignments changes
- Live update personal progress stats
- Real-time team workload visualization
- Show when colleagues log hours
```

---

### Task 6: Refactor WorkspaceCommunication to Use Edge Functions
**File:** `src/components/workspace/WorkspaceCommunication.tsx`

Replace broken API calls with new edge function hooks:

```text
Changes:
- Replace api.get('/workspaces/${workspaceId}/channels') with useWorkspaceChannelsList
- Replace api.post for messages with useSendMessage
- Replace channel creation with useCreateChannel
- Add real-time message updates via useRealtimeMessages
- Integrate presence and typing indicators
```

---

### Task 7: Create Enhanced Message Thread Component
**File:** `src/components/workspace/communication/EnhancedMessageThread.tsx`

Create a production-ready message thread with all real-time features:

```text
Features:
- Full real-time message updates (no polling)
- Typing indicators with debouncing
- Online presence indicators
- Unread message tracking
- Scroll to new messages
- Optimistic message sending
- Message edit/delete support
- @mention highlighting
```

---

### Task 8: Create Presence Indicator Components
**Files:**
- `src/components/workspace/presence/OnlineUsersWidget.tsx`
- `src/components/workspace/presence/PresenceAvatar.tsx`
- `src/components/workspace/presence/ActiveNowBadge.tsx`

```text
OnlineUsersWidget:
- Shows list of currently active users in workspace
- Grouped by status (online, away, busy)
- Click to view user profile or start DM

PresenceAvatar:
- Avatar with online indicator dot
- Tooltip showing last activity

ActiveNowBadge:
- Small badge showing "X active now"
- Used in dashboard headers
```

---

### Task 9: Add Real-Time Notifications Toast
**File:** `src/hooks/useRealtimeNotifications.ts`

Create a hook for real-time toast notifications:

```text
Features:
- Subscribe to notifications table
- Show toast for new task assignments
- Show toast for approval status changes
- Show toast for @mentions
- Show toast for escalations
- Configurable notification preferences
```

---

### Task 10: Update Plan Progress
**File:** `.lovable/plan.md`

Update the plan to reflect Phase 5 completion.

---

## File Changes Summary

### New Files (7)
1. `src/hooks/useRealtimeDashboard.ts` - Dashboard real-time subscriptions
2. `src/hooks/useWorkspacePresence.ts` - Workspace-level presence
3. `src/hooks/useRealtimeNotifications.ts` - Toast notifications
4. `src/components/workspace/presence/OnlineUsersWidget.tsx` - Online users list
5. `src/components/workspace/presence/PresenceAvatar.tsx` - Avatar with status
6. `src/components/workspace/presence/ActiveNowBadge.tsx` - Active count badge
7. `src/components/workspace/communication/EnhancedMessageThread.tsx` - Full-featured thread

### Modified Files (5)
1. `src/components/workspace/root/RootDashboard.tsx` - Add real-time
2. `src/components/workspace/committee/CommitteeDashboard.tsx` - Add real-time
3. `src/components/workspace/team/TeamDashboard.tsx` - Add real-time
4. `src/components/workspace/WorkspaceCommunication.tsx` - Use edge functions
5. `.lovable/plan.md` - Update progress

---

## Technical Details

### Supabase Realtime Subscription Pattern
```typescript
// Example subscription pattern to be used
const channel = supabase
  .channel(`dashboard:${workspaceId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'workspace_tasks',
    filter: `workspace_id=eq.${workspaceId}`,
  }, (payload) => {
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
  })
  .subscribe();
```

### Presence System Pattern
```typescript
// Workspace presence tracking
const channel = supabase.channel(`workspace:${workspaceId}`, {
  config: { presence: { key: userId } }
});

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    setOnlineUsers(Object.values(state).flat());
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        userId,
        userName,
        status: 'online',
        currentView: 'dashboard',
        lastSeen: new Date().toISOString(),
      });
    }
  });
```

### Query Invalidation Strategy
- Use targeted invalidation based on payload type
- Batch invalidations for performance
- Debounce rapid updates (e.g., typing indicators)

---

## Success Criteria

After implementation:
1. Dashboard data updates within 1 second of database changes
2. Online presence indicators show on all dashboards
3. Typing indicators work in all message threads
4. Communication uses edge functions (no broken API calls)
5. Toast notifications appear for important events
6. No polling - all updates via WebSocket

---

## Estimated Implementation Order

1. **useRealtimeDashboard** (15 min) - Core hook
2. **useWorkspacePresence** (15 min) - Presence hook
3. **Presence components** (15 min) - UI components
4. **RootDashboard update** (10 min) - Add real-time
5. **CommitteeDashboard update** (10 min) - Add real-time
6. **TeamDashboard update** (10 min) - Add real-time
7. **WorkspaceCommunication refactor** (20 min) - Edge functions
8. **EnhancedMessageThread** (15 min) - Full-featured thread
9. **useRealtimeNotifications** (10 min) - Toast notifications
10. **Update plan.md** (5 min) - Document progress

**Total estimated time: ~2 hours**
