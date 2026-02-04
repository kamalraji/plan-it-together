---
llm_metadata:
  purpose: Document the complete registration to channel communication workflow
  last_updated: 2026-02-02
  key_tables:
    - registrations
    - workspace_channels
    - channel_members
    - channel_messages
  key_functions:
    - participant-channels-api
    - participant-messages-api
    - send-push-notification
---

# Workspace Channel Workflow

This document details the complete workflow from participant registration to real-time channel communication between organizers and participants.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        REGISTRATION PHASE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Participant                                                            │
│       │                                                                  │
│       ▼                                                                  │
│   ┌───────────────┐     ┌───────────────┐     ┌───────────────┐         │
│   │   Register    │ ──▶ │    Payment    │ ──▶ │   Confirmed   │         │
│   │   (PENDING)   │     │   Process     │     │   (CONFIRMED) │         │
│   └───────────────┘     └───────────────┘     └───────────────┘         │
│                                                       │                  │
└───────────────────────────────────────────────────────┼──────────────────┘
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        CHANNEL ASSIGNMENT                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    Database Trigger                              │   │
│   │              auto_join_participant_channels()                    │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│              ┌───────────────┼───────────────┐                          │
│              ▼               ▼               ▼                          │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│   │   General    │  │Announcements │  │    Help      │                  │
│   │   Channel    │  │   Channel    │  │   Channel    │                  │
│   └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMMUNICATION PHASE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Organizer (Web)                    Participant (Mobile)                │
│        │                                   │                             │
│        │  POST /channel-messages           │                             │
│        │◄──────────────────────────────────┤                             │
│        │                                   │                             │
│        ▼                                   │                             │
│   ┌────────────┐                           │                             │
│   │  Broadcast │                           │                             │
│   │  Message   │                           │                             │
│   └────────────┘                           │                             │
│        │                                   │                             │
│        │  Supabase Realtime                │                             │
│        ├──────────────────────────────────▶│                             │
│        │                                   │                             │
│        │  Push Notification                │                             │
│        ├──────────────────────────────────▶│                             │
│        │                                   ▼                             │
│        │                            ┌────────────┐                       │
│        │                            │  Mobile    │                       │
│        │                            │  Receives  │                       │
│        │                            └────────────┘                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Registration

### 1.1 Initial Registration

**Trigger:** User submits registration form  
**Tables Updated:** `registrations`  
**Initial Status:** `pending`

```sql
-- Registration created with pending status
INSERT INTO registrations (
  event_id,
  user_id,
  ticket_type_id,
  status,
  payment_status,
  custom_fields
) VALUES (
  'event-uuid',
  'user-uuid',
  'ticket-type-uuid',
  'pending',
  'pending',
  '{"company": "Acme Corp"}'
);
```

### 1.2 Payment Processing

**For Paid Events:**
1. `create-ticket-checkout` edge function creates Stripe session
2. User completes payment on Stripe
3. `stripe-webhook` receives `checkout.session.completed`
4. Webhook updates `payment_status` to `paid`

**For Free Events:**
1. Registration auto-confirmed immediately
2. `payment_status` set to `not_required`

### 1.3 Confirmation

**Trigger:** Payment confirmed or free event registration  
**Tables Updated:** `registrations`  
**New Status:** `confirmed`

```sql
-- Update registration to confirmed
UPDATE registrations
SET 
  status = 'confirmed',
  payment_status = 'paid',
  confirmed_at = now(),
  qr_code = generate_qr_code()
WHERE id = 'registration-uuid';
```

---

## Phase 2: Channel Assignment

### 2.1 Database Trigger

When registration status changes to `confirmed`, a database trigger automatically adds the participant to event channels.

```sql
-- Trigger function: auto_join_participant_channels()
CREATE OR REPLACE FUNCTION auto_join_participant_channels()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id UUID;
  v_workspace_id UUID;
  v_channel RECORD;
BEGIN
  -- Only process on confirmation
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Get event and workspace info
    SELECT e.id, e.workspace_id INTO v_event_id, v_workspace_id
    FROM events e
    WHERE e.id = NEW.event_id;
    
    -- Add to all participant-accessible channels
    FOR v_channel IN 
      SELECT id, name, type
      FROM workspace_channels
      WHERE workspace_id = v_workspace_id
        AND is_participant_channel = true
        AND is_archived = false
    LOOP
      -- Add to channel_members
      INSERT INTO channel_members (
        channel_id,
        user_id,
        user_name,
        joined_at
      ) VALUES (
        v_channel.id,
        NEW.user_id,
        (SELECT full_name FROM user_profiles WHERE id = NEW.user_id),
        now()
      )
      ON CONFLICT (channel_id, user_id) DO NOTHING;
    END LOOP;
    
    -- Send welcome push notification
    PERFORM pg_notify('push_notification', json_build_object(
      'user_id', NEW.user_id,
      'title', 'Registration Confirmed!',
      'body', 'You now have access to event channels.',
      'data', json_build_object('type', 'registration_confirmed', 'event_id', v_event_id)
    )::text);
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_join_channels
AFTER UPDATE OF status ON registrations
FOR EACH ROW
EXECUTE FUNCTION auto_join_participant_channels();
```

### 2.2 Channel Types

| Type | Description | Participant Access |
|------|-------------|-------------------|
| `general` | General discussion | Read + Write |
| `announcement` | Organizer broadcasts | Read Only |
| `support` | Help requests | Read + Write |
| `networking` | Participant networking | Read + Write |
| `private` | Organizer-only | No Access |
| `task` | Team tasks | No Access |

### 2.3 Channel Configuration

Organizers configure participant access via `participant_permissions`:

```json
{
  "can_read": true,
  "can_write": true,
  "can_react": true,
  "can_reply": true,
  "can_attach_files": false,
  "max_message_length": 1000
}
```

---

## Phase 3: Communication

### 3.1 Participant Fetches Channels

**Mobile App Flow:**

```dart
// 1. Fetch channels via edge function
final response = await supabase.functions.invoke(
  'participant-channels-api',
  body: {'event_id': eventId},
);

// 2. Parse response
final channels = (response.data['channels'] as List)
    .map((c) => WorkspaceChannel.fromJson(c))
    .toList();

// 3. Subscribe to realtime updates for each channel
for (final channel in channels) {
  _subscribeToChannel(channel.id);
}
```

**API Response:**

```json
{
  "channels": [
    {
      "id": "uuid",
      "name": "General",
      "type": "general",
      "description": "General discussion",
      "unread_count": 3,
      "last_message": {
        "id": "uuid",
        "content": "Welcome everyone!",
        "sender_name": "Event Organizer",
        "created_at": "2026-02-02T10:00:00Z"
      },
      "participant_permissions": {
        "can_read": true,
        "can_write": true,
        "can_react": true
      }
    }
  ],
  "unread_total": 5
}
```

### 3.2 Organizer Sends Message

**Web App Flow:**

```typescript
// 1. Post message via edge function
const { data, error } = await supabase.functions.invoke('channel-messages', {
  body: {
    channel_id: channelId,
    content: "Important announcement: Event starts in 30 minutes!",
    message_type: "text",
    is_broadcast: true, // Optional: highlight as announcement
  }
});

// 2. Message is inserted into channel_messages table
// 3. Supabase Realtime broadcasts to all subscribers
// 4. Push notification sent to participants (if enabled)
```

### 3.3 Real-time Message Delivery

**Supabase Realtime Subscription (Mobile):**

```dart
final channel = supabase
  .channel('channel-messages-$channelId')
  .onPostgresChanges(
    event: PostgresChangeEvent.insert,
    schema: 'public',
    table: 'channel_messages',
    filter: PostgresChangeFilter(
      type: PostgresChangeFilterType.eq,
      column: 'channel_id',
      value: channelId,
    ),
    callback: (payload) {
      final message = ChannelMessage.fromJson(payload.newRecord);
      _addMessageToList(message);
      _showNotificationIfNeeded(message);
    },
  )
  .subscribe();
```

### 3.4 Push Notification Flow

**Trigger:** New message in channel with notifications enabled

```typescript
// trigger-chat-notification edge function
const sendNotification = async (message: ChannelMessage) => {
  // Get channel members who should receive notification
  const { data: members } = await supabase
    .from('channel_members')
    .select('user_id, is_muted, muted_until')
    .eq('channel_id', message.channel_id)
    .neq('user_id', message.sender_id);

  // Filter out muted members
  const activeMembers = members.filter(m => 
    !m.is_muted && 
    (!m.muted_until || new Date(m.muted_until) < new Date())
  );

  // Get FCM tokens
  const { data: tokens } = await supabase
    .from('user_push_tokens')
    .select('token, platform')
    .in('user_id', activeMembers.map(m => m.user_id));

  // Send via FCM
  for (const { token, platform } of tokens) {
    await sendFCMNotification(token, {
      title: message.sender_name || 'New Message',
      body: truncate(message.content, 100),
      data: {
        type: 'chat_message',
        channel_id: message.channel_id,
        message_id: message.id,
      }
    });
  }
};
```

---

## Phase 4: Participant Response

### 4.1 Participant Sends Message

**Mobile App Flow:**

```dart
// 1. Check write permission
if (!channel.permissions.canWrite) {
  showError('You cannot send messages in this channel');
  return;
}

// 2. Send message via edge function
final response = await supabase.functions.invoke(
  'participant-messages-api',
  body: {
    'action': 'create',
    'channel_id': channelId,
    'content': messageText,
    'message_type': 'text',
  },
);

// 3. Optimistic update (add to local list immediately)
_addMessageOptimistically(message);

// 4. Handle response
if (response.status == 200) {
  _confirmMessage(response.data['id']);
} else {
  _revertOptimisticMessage(message);
  showError('Failed to send message');
}
```

### 4.2 Message Visibility

Messages are visible to all channel members via RLS policy:

```sql
CREATE POLICY "Channel members can view messages"
ON channel_messages FOR SELECT
USING (
  channel_id IN (
    SELECT channel_id FROM channel_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members with write permission can insert"
ON channel_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM channel_members cm
    JOIN workspace_channels wc ON wc.id = cm.channel_id
    WHERE cm.channel_id = channel_messages.channel_id
      AND cm.user_id = auth.uid()
      AND (wc.participant_permissions->>'can_write')::boolean = true
  )
);
```

---

## Database Schema

### Key Tables

```sql
-- Registrations
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  ticket_type_id UUID REFERENCES ticket_types(id),
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  qr_code TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waitlisted', 'checked_in')),
  CONSTRAINT valid_payment CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed', 'not_required'))
);

-- Workspace Channels
CREATE TABLE workspace_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'general',
  is_archived BOOLEAN DEFAULT false,
  is_participant_channel BOOLEAN DEFAULT false,
  participant_permissions JSONB DEFAULT '{"can_read": true, "can_write": true, "can_react": true}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_type CHECK (type IN ('general', 'announcement', 'private', 'task', 'support', 'networking'))
);

-- Channel Members
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES workspace_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  user_name TEXT,
  is_muted BOOLEAN DEFAULT false,
  muted_until TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(channel_id, user_id)
);

-- Channel Messages
CREATE TABLE channel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES workspace_channels(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  sender_name TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  attachments JSONB,
  is_edited BOOLEAN DEFAULT false,
  is_encrypted BOOLEAN DEFAULT false,
  parent_message_id UUID REFERENCES channel_messages(id),
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ,
  
  CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'image', 'file', 'system', 'gif'))
);
```

---

## Edge Function Implementations

### participant-channels-api

```typescript
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await validateAuth(req);
  if (!auth.authenticated) {
    return errorResponse('Unauthorized', 401, corsHeaders);
  }

  const url = new URL(req.url);
  const eventId = url.searchParams.get('event_id');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Verify user is registered for this event
  const { data: registration } = await supabase
    .from('registrations')
    .select('status')
    .eq('event_id', eventId)
    .eq('user_id', auth.userId)
    .eq('status', 'confirmed')
    .single();

  if (!registration) {
    return errorResponse('Not registered for this event', 403, corsHeaders);
  }

  // Get channels with unread counts
  const { data: channels } = await supabase
    .from('workspace_channels')
    .select(`
      id,
      name,
      description,
      type,
      is_participant_channel,
      participant_permissions,
      channel_members!inner(last_read_at),
      channel_messages(
        id,
        content,
        sender_name,
        created_at
      )
    `)
    .eq('workspace_id', eventWorkspaceId)
    .eq('is_participant_channel', true)
    .eq('is_archived', false)
    .eq('channel_members.user_id', auth.userId)
    .order('created_at', { foreignTable: 'channel_messages', ascending: false })
    .limit(1, { foreignTable: 'channel_messages' });

  // Calculate unread counts
  const channelsWithUnread = channels.map(ch => ({
    ...ch,
    unread_count: calculateUnread(ch.channel_messages, ch.channel_members[0]?.last_read_at),
    last_message: ch.channel_messages[0] || null,
  }));

  return successResponse({
    channels: channelsWithUnread,
    unread_total: channelsWithUnread.reduce((sum, ch) => sum + ch.unread_count, 0),
  }, corsHeaders);
});
```

---

## Error Handling

### Common Errors

| Error | Code | Resolution |
|-------|------|------------|
| Not registered | 403 | User must complete registration |
| Registration pending | 403 | User must confirm/pay registration |
| Channel not found | 404 | Channel may be archived or deleted |
| Write not allowed | 403 | Check `participant_permissions.can_write` |
| Rate limited | 429 | Wait before sending more messages |

### Mobile Error Handling

```dart
try {
  await sendMessage(content);
} on FunctionException catch (e) {
  switch (e.status) {
    case 403:
      if (e.message.contains('not registered')) {
        showError('Please complete your registration first');
      } else if (e.message.contains('write not allowed')) {
        showError('This is a read-only channel');
      }
      break;
    case 429:
      showError('Too many messages. Please wait a moment.');
      break;
    default:
      showError('Failed to send message');
  }
}
```

---

## Performance Considerations

### Pagination

Messages are paginated with cursor-based pagination:

```typescript
// Request
GET /participant-messages-api?channel_id=uuid&limit=50&cursor=last-message-id

// Response
{
  "messages": [...],
  "next_cursor": "uuid-of-50th-message",
  "has_more": true
}
```

### Caching

Mobile app caches channels and recent messages:

```dart
// Cache channels for 5 minutes
await _cacheService.set(
  'channels_$eventId',
  channels,
  Duration(minutes: 5),
);

// Cache messages indefinitely (immutable)
await _cacheService.set(
  'messages_$channelId',
  messages,
);
```

### Realtime Optimization

Only subscribe to channels currently visible:

```dart
// Subscribe when entering channel view
void onChannelEnter(String channelId) {
  _activeSubscription = _subscribeToChannel(channelId);
}

// Unsubscribe when leaving
void onChannelExit() {
  _activeSubscription?.unsubscribe();
}
```

---

## Security

### RLS Policies

All data access is controlled by Row Level Security:

1. **Registrations:** Users can only see their own registrations
2. **Channel Members:** Only confirmed registrants are members
3. **Messages:** Only channel members can read/write messages
4. **Permissions:** Write access respects `participant_permissions`

### Rate Limiting

| Action | Limit |
|--------|-------|
| Fetch channels | 60/min |
| Fetch messages | 120/min |
| Send message | 30/min |
| React to message | 60/min |

### Input Validation

All message content is validated:
- Max length: 4000 characters
- Sanitized for XSS
- URLs validated for link previews
- File attachments scanned for malware
