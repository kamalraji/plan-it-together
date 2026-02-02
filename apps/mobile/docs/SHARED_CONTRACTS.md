# Shared Contracts - Flutter Mobile & React Organizer

## Overview

Both apps share a single Supabase backend. This document defines the contracts for database tables, API endpoints, and real-time channels to ensure consistency across platforms.

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   Flutter Mobile    │     │  React Organizer    │
│   (Attendee App)    │     │   (thittam-web)     │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           └───────────┬───────────────┘
                       │
           ┌───────────▼───────────┐
           │   Supabase Backend    │
           │  ┌─────────────────┐  │
           │  │   PostgreSQL    │  │
           │  │   Auth          │  │
           │  │   Realtime      │  │
           │  │   Storage       │  │
           │  │   Edge Funcs    │  │
           │  └─────────────────┘  │
           └───────────────────────┘
```

## Database Tables

### Core Tables (Shared)

| Table | Mobile Access | Organizer Access | Description |
|-------|---------------|------------------|-------------|
| `events` | Read (registered) | Full CRUD | Event definitions |
| `event_registrations` | Read/Write (own) | Full CRUD | Attendee registrations |
| `user_profiles` | Read/Write (own) | Read (event attendees) | User profile data |
| `user_roles` | Read (own) | Read/Write | Role assignments |
| `workspaces` | Read (member) | Full CRUD | Organizer workspaces |
| `workspace_team_members` | Read (own) | Full CRUD | Team membership |

### Zone Tables (Event-Day Features)

| Table | Mobile Access | Organizer Access | RLS Key |
|-------|---------------|------------------|---------|
| `event_sessions` | Read | Full CRUD | `event_id` |
| `event_checkins` | Read/Write (own) | Read all | `event_id`, `user_id` |
| `event_polls` | Read | Full CRUD | `event_id` |
| `event_poll_options` | Read | Full CRUD | `poll_id` |
| `event_poll_votes` | Write (own) | Read counts | `poll_id`, `user_id` |
| `event_announcements` | Read | Full CRUD | `event_id` |
| `event_live_streams` | Read | Full CRUD | `event_id` |
| `session_questions` | Read/Write | Full CRUD | `session_id` |
| `session_question_upvotes` | Write (own) | Read | `question_id` |

### Chat Tables

| Table | Mobile Access | Organizer Access | RLS Key |
|-------|---------------|------------------|---------|
| `chat_conversations` | Read/Write (participant) | Read (event) | `participant_ids` |
| `chat_messages` | Read/Write (conversation member) | Read (event) | `conversation_id` |
| `chat_read_receipts` | Read/Write (own) | None | `user_id` |

### Settings Tables

| Table | Mobile Access | Organizer Access | RLS Key |
|-------|---------------|------------------|---------|
| `notification_preferences` | Read/Write (own) | None | `user_id` |
| `accessibility_settings` | Read/Write (own) | None | `user_id` |
| `security_notification_preferences` | Read/Write (own) | None | `user_id` |
| `ai_matching_privacy_settings` | Read/Write (own) | None | `user_id` |

---

## Real-Time Channels

### Channel Naming Convention

```
{feature}:{scope_id}
```

Examples:
- `zone:event-uuid` - All zone updates for an event
- `settings:user-uuid` - User settings sync
- `chat:conversation-uuid` - Chat messages

### Zone Channel (Mobile & Organizer)

**Channel:** `zone:{eventId}`

Multiplexed channel for all event-day features:

```typescript
// Tables monitored
const zoneTables = [
  'event_sessions',
  'event_polls',
  'event_poll_votes',
  'event_announcements',
  'event_checkins',
  'event_live_streams',
  'session_questions',
  'session_question_upvotes',
  'zone_leaderboard',
  'zone_activity_feed',
];

// Filter: event_id = {eventId}
```

**Payload Structure:**
```typescript
interface ZonePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: 'public';
  new: Record<string, any> | null;
  old: Record<string, any> | null;
}
```

### Settings Channel (Mobile Only)

**Channel:** `settings:{userId}`

Syncs user preferences across devices:

```typescript
const settingsTables = [
  'notification_preferences',
  'accessibility_settings',
  'security_notification_preferences',
  'ai_matching_privacy_settings',
];

// Filter: user_id = {userId}
```

### Chat Channel (Mobile)

**Channel:** `chat:{conversationId}`

Real-time message delivery:

```typescript
const chatTables = [
  'chat_messages',
  'chat_read_receipts',
  'chat_typing_indicators',
];
```

---

## Edge Functions

### Shared Functions

| Function | Purpose | Auth | Rate Limit |
|----------|---------|------|------------|
| `agora-token` | Generate RTC tokens for video/audio | Required | 10/min |
| `trigger-chat-notification` | Push notifications for chat | Required | 60/min |
| `analyze-profile-match` | AI-powered profile matching | Required | 5/min |
| `export-user-data` | GDPR data export | Required | 1/day |
| `check-password-breach` | HaveIBeenPwned check | Required | 10/min |

### Request/Response Contracts

#### `agora-token`

```typescript
// Request
interface AgoraTokenRequest {
  channelName: string;
  uid: number;
  role: 'publisher' | 'subscriber';
}

// Response
interface AgoraTokenResponse {
  token: string;
  expiresAt: number;
}
```

#### `analyze-profile-match`

```typescript
// Request
interface MatchRequest {
  eventId: string;
  targetUserId?: string; // Optional: specific user to match
}

// Response
interface MatchResponse {
  matches: Array<{
    userId: string;
    score: number;
    commonInterests: string[];
    reason: string;
  }>;
}
```

---

## RLS Policy Patterns

### Attendee Access (Mobile)

```sql
-- Read own registrations
CREATE POLICY "Users can read own registrations"
  ON event_registrations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Read events they're registered for
CREATE POLICY "Attendees can read registered events"
  ON events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_registrations
      WHERE event_id = events.id
      AND user_id = auth.uid()
    )
  );
```

### Organizer Access (Web)

```sql
-- Event owners have full access
CREATE POLICY "Event owners can manage"
  ON event_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_sessions.event_id
      AND owner_id = auth.uid()
    )
  );

-- Workspace team members can manage
CREATE POLICY "Workspace team can manage"
  ON event_sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      JOIN workspace_team_members wtm ON wtm.workspace_id = w.id
      WHERE w.event_id = event_sessions.event_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
  );
```

### Role Check Function

```sql
-- SECURITY DEFINER function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

---

## Data Models (TypeScript/Dart Parity)

### Event

```typescript
// TypeScript (React)
interface Event {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  startDate: string; // ISO 8601
  endDate: string;
  location: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}
```

```dart
// Dart (Flutter)
class Event {
  final String id;
  final String title;
  final String? description;
  final EventCategory category;
  final DateTime startDate;
  final DateTime endDate;
  final String? location;
  final String ownerId;
  final DateTime createdAt;
  final DateTime updatedAt;
}
```

### EventSession

```typescript
// TypeScript
interface EventSession {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  speakerName: string | null;
  speakerTitle: string | null;
  speakerAvatar: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
  track: string | null;
  status: 'upcoming' | 'live' | 'ended';
}
```

### Poll

```typescript
interface EventPoll {
  id: string;
  eventId: string;
  question: string;
  isActive: boolean;
  expiresAt: string | null;
  createdBy: string;
  options: PollOption[];
}

interface PollOption {
  id: string;
  pollId: string;
  text: string;
  voteCount: number;
}
```

---

## API Conventions

### Supabase Query Patterns

Both apps should use consistent query patterns:

```typescript
// Select with joins
const { data, error } = await supabase
  .from('event_sessions')
  .select('*, events!inner(title)')
  .eq('event_id', eventId)
  .order('start_time', { ascending: true });

// Upsert with conflict handling
const { error } = await supabase
  .from('event_checkins')
  .upsert({
    event_id: eventId,
    user_id: userId,
    checkin_date: today,
    checkin_time: now,
  }, { onConflict: 'event_id,user_id,checkin_date' });

// RPC for atomic operations
const { error } = await supabase
  .rpc('increment_poll_vote', { option_id: optionId });
```

### Error Handling

Both apps should handle these Supabase error codes consistently:

| Code | Meaning | User Message |
|------|---------|--------------|
| `42501` | RLS violation | "You don't have permission" |
| `23503` | FK violation | "Referenced item not found" |
| `23505` | Unique violation | "This already exists" |
| `PGRST116` | No rows | "Not found" |

---

## Storage Buckets

| Bucket | Mobile | Organizer | Purpose |
|--------|--------|-----------|---------|
| `avatars` | Read/Write (own) | Read | User profile pictures |
| `event-assets` | Read | Full CRUD | Event banners, logos |
| `chat-attachments` | Read/Write (conversation) | Read | Chat media |
| `session-materials` | Read | Full CRUD | Workshop materials |

### File Naming Convention

```
{bucket}/{entity_id}/{timestamp}_{random}.{ext}
```

Example: `avatars/user-uuid/1706123456_abc123.jpg`

---

## Versioning & Migrations

### Migration Naming

```
{YYYYMMDDHHMMSS}_{description}.sql
```

### Breaking Change Protocol

1. Add new column/table (additive)
2. Deploy both apps with support for old + new
3. Migrate data if needed
4. Remove old column/table support from apps
5. Remove deprecated schema

---

## Testing Contracts

When modifying shared tables or Edge Functions:

1. **Schema changes**: Test in both Flutter and React apps
2. **RLS changes**: Verify both attendee and organizer access
3. **Realtime changes**: Confirm both apps receive updates
4. **Edge Function changes**: Test from both platforms
