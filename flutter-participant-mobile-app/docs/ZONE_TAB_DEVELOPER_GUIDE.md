# Zone Tab - Developer Guide

## Overview

The Zone tab is an event-day dashboard that provides real-time engagement features for event attendees. It dynamically renders specialized UI cards based on event category and supports check-in/out, live sessions, polls, announcements, and networking features.

## Architecture

### File Structure

```
lib/
├── pages/impact/
│   └── zone_page.dart          # Main Zone tab UI
├── models/
│   └── zone_models.dart        # Data models (EventSession, EventCheckin, etc.)
├── supabase/
│   └── zone_service.dart       # Supabase API layer
├── utils/
│   └── zone_category_features.dart  # Category-specific feature mapping
└── widgets/zone/
    ├── competition_zone_card.dart   # Competition/quiz events
    ├── conference_zone_card.dart    # Conference events
    ├── hackathon_zone_card.dart     # Hackathon events
    ├── networking_zone_card.dart    # Meetup/networking events
    └── workshop_zone_card.dart      # Workshop events
```

### Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  ZonePage   │────▶│ ZoneService  │────▶│    Supabase     │
│   (UI)      │◀────│   (API)      │◀────│   (Database)    │
└─────────────┘     └──────────────┘     └─────────────────┘
       │
       ▼
┌─────────────────────────┐
│ ZoneCategoryFeatures    │
│ (Feature Mapping)       │
└─────────────────────────┘
```

## Database Schema

### Core Tables

#### `event_sessions`
Stores session/talk information for events.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID | FK to events |
| `title` | TEXT | Session title |
| `description` | TEXT | Session description |
| `speaker_name` | TEXT | Speaker's name |
| `speaker_title` | TEXT | Speaker's role/title |
| `speaker_avatar` | TEXT | Avatar URL |
| `start_time` | TIMESTAMPTZ | Session start |
| `end_time` | TIMESTAMPTZ | Session end |
| `location` | TEXT | Room/location |
| `track` | TEXT | Session track (e.g., "Main Hall") |
| `status` | TEXT | 'upcoming', 'live', 'ended' |

#### `event_checkins`
Tracks attendee check-in/out for events.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID | FK to events |
| `user_id` | UUID | User who checked in |
| `checkin_date` | DATE | Date of check-in |
| `checkin_time` | TIMESTAMPTZ | Check-in timestamp |
| `checkout_time` | TIMESTAMPTZ | Check-out timestamp (nullable) |
| `location` | TEXT | Check-in location |

#### `event_polls`
Live polling for events.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID | FK to events |
| `question` | TEXT | Poll question |
| `is_active` | BOOLEAN | Whether poll is accepting votes |
| `expires_at` | TIMESTAMPTZ | Poll expiration |
| `created_by` | UUID | Poll creator |

#### `event_poll_options`
Options for each poll.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `poll_id` | UUID | FK to event_polls |
| `text` | TEXT | Option text |
| `vote_count` | INTEGER | Current vote count |

#### `event_poll_votes`
Individual vote records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `poll_id` | UUID | FK to event_polls |
| `option_id` | UUID | FK to event_poll_options |
| `user_id` | UUID | Voter |

#### `event_announcements`
Event announcements and updates.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID | FK to events |
| `title` | TEXT | Announcement title |
| `content` | TEXT | Announcement body |
| `type` | TEXT | 'info', 'warning', 'success', 'update' |
| `is_pinned` | BOOLEAN | Pin to top |
| `is_active` | BOOLEAN | Visibility |
| `author_name` | TEXT | Author display name |
| `author_avatar` | TEXT | Author avatar URL |

### Database Functions

#### `increment_poll_vote(option_id UUID)`
Atomically increments a poll option's vote count.

#### `decrement_poll_vote(option_id UUID)`
Atomically decrements a poll option's vote count (for vote changes).

## RLS Policies

### Read Access
- **Registered attendees**: Can read sessions, polls, and announcements for events they're registered for
- **Checked-in users**: Can see nearby attendees

### Write Access
- **Event owners** (`events.owner_id`): Full management access
- **Workspace team members**: Active members of the workspace linked to the event can manage content

```sql
-- Example policy structure
CREATE POLICY "Event owners and workspace team can manage sessions"
  ON public.event_sessions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_sessions.event_id AND e.owner_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM workspaces w
      JOIN workspace_team_members wtm ON wtm.workspace_id = w.id
      WHERE w.event_id = event_sessions.event_id
      AND wtm.user_id = auth.uid()
      AND wtm.status = 'ACTIVE'
    )
  );
```

## ZoneService API

### Core Methods

```dart
class ZoneService {
  // Get today's events user is registered for
  Future<List<ZoneEvent>> getTodayEvents();
  
  // Get currently checked-in event
  Future<ZoneEvent?> getCurrentEvent();
  
  // Check in/out
  Future<void> checkIn(String eventId, {String? location});
  Future<void> checkOut(String eventId);
  
  // Sessions
  Future<List<EventSession>> getLiveSessions(String eventId);
  Future<List<EventSession>> getUpcomingSessions(String eventId, {int limit = 5});
  
  // Networking
  Future<List<AttendeeRadar>> getNearbyAttendees(String eventId, {int limit = 12});
  
  // Polls
  Future<List<EventPoll>> getActivePolls(String eventId);
  Future<void> submitPollVote(String pollId, String optionId);
  
  // Announcements
  Future<List<EventAnnouncement>> getAnnouncements(String eventId, {int limit = 10});
  
  // Stats
  Future<int> getAttendeeCount(String eventId);
}
```

### Check-in Logic

The check-in system uses UPSERT to handle daily re-check-ins:

```dart
// Re-activates existing check-in for today instead of creating duplicates
await supabase.from('event_checkins').upsert({
  'event_id': eventId,
  'user_id': userId,
  'checkin_date': today,
  'checkin_time': now,
  'checkout_time': null,  // Clear checkout on re-check-in
}, onConflict: 'event_id,user_id,checkin_date');
```

## Category Feature System

### ZoneCategoryFeatures

Maps event categories to available features and UI cards:

```dart
class ZoneCategoryFeatures {
  // Get the specialized zone card for a category
  static Widget? getZoneCardWidget(EventCategory? category, String eventId);
  
  // Get available features for a category
  static List<ZoneFeature> getFeaturesForCategory(EventCategory? category);
  
  // Check if category has a specific feature
  static bool hasFeature(EventCategory? category, ZoneFeature feature);
  
  // UI helpers
  static Color getCategoryThemeColor(EventCategory? category);
  static String getCategoryTagline(EventCategory? category);
}
```

### Feature Mapping

| Category | Zone Card | Special Features |
|----------|-----------|------------------|
| Hackathon | HackathonZoneCard | Team finder, mentor booking, submission |
| Conference | ConferenceZoneCard | Multi-track schedule, sponsor booths |
| Workshop | WorkshopZoneCard | Materials, progress tracking |
| Meetup/Social | NetworkingZoneCard | Smart matching, meeting scheduler |
| Competition | CompetitionZoneCard | Live quiz, real-time leaderboard |
| Other | Generic fallback | Basic features |

## Adding New Category Support

1. **Create Zone Card Widget** in `lib/widgets/zone/`:
```dart
class NewCategoryZoneCard extends StatefulWidget {
  final String eventId;
  const NewCategoryZoneCard({required this.eventId});
  // ... implementation
}
```

2. **Register in ZoneCategoryFeatures**:
```dart
static Widget? getZoneCardWidget(EventCategory? category, String eventId) {
  switch (category) {
    case EventCategory.newCategory:
      return NewCategoryZoneCard(eventId: eventId);
    // ...
  }
}
```

3. **Define Features**:
```dart
static List<ZoneFeature> getFeaturesForCategory(EventCategory? category) {
  switch (category) {
    case EventCategory.newCategory:
      return [ZoneFeature.feature1, ZoneFeature.feature2, ..._defaultFeatures];
    // ...
  }
}
```

## Testing

### Sample Data Migration

Use the migration `20260119110937_*_insert_sample_zone_data.sql` as reference for inserting test data:

```sql
-- Insert test sessions
INSERT INTO public.event_sessions (event_id, title, speaker_name, ...)
VALUES ('your-event-id', 'Test Session', 'Speaker Name', ...);

-- Insert test polls
INSERT INTO public.event_polls (event_id, question, is_active)
VALUES ('your-event-id', 'Test Question?', true);
```

### Manual Testing Checklist

- [ ] Check-in flow works correctly
- [ ] Live sessions display with correct status
- [ ] Polls accept votes and update counts
- [ ] Announcements display with correct styling
- [ ] Category-specific cards render
- [ ] Re-check-in on same day works
- [ ] Check-out updates record correctly

## Troubleshooting

### Common Issues

1. **No sessions appearing**: Verify session `status` is 'live' or 'upcoming' and times are correct
2. **Poll votes not updating**: Check RLS policies and ensure user is authenticated
3. **Check-in fails**: Verify unique constraint on `(event_id, user_id, checkin_date)`
4. **Attendee radar empty**: Ensure other users are checked in to the same event

### Debug Queries

```sql
-- Check active check-ins for an event
SELECT * FROM event_checkins 
WHERE event_id = 'event-uuid' 
AND checkout_time IS NULL;

-- Check poll votes
SELECT p.question, o.text, o.vote_count 
FROM event_polls p
JOIN event_poll_options o ON o.poll_id = p.id
WHERE p.event_id = 'event-uuid';
```
