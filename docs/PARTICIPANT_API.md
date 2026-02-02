# Participant Communication API Documentation

## Overview

This document describes the REST API endpoints for participant communication in the event management system. These APIs are designed for mobile (Flutter) and web client integration.

**Base URL:** `https://ltsniuflqfahdcirrmjh.supabase.co/functions/v1`

**Authentication:** All endpoints require a valid Supabase JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Participant Channels API

#### GET `/participant-channels-api?eventId={eventId}`

List all participant-accessible channels for an event.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | UUID | Yes | The event ID |
| channelId | UUID | No | Get specific channel details |

**Response (200):**
```json
{
  "channels": [
    {
      "id": "uuid",
      "name": "announcements",
      "description": "Official event announcements",
      "type": "announcement",
      "canRead": true,
      "canWrite": false,
      "unreadCount": 3,
      "lastMessage": {
        "content": "Welcome to the event!",
        "senderName": "Event Team",
        "createdAt": "2026-02-02T10:00:00Z"
      },
      "participantCount": 150
    }
  ],
  "eventId": "uuid",
  "eventName": "Tech Conference 2026"
}
```

**Channel Types:**
- `announcement` - Official announcements (typically read-only)
- `general` - Open discussion
- `private` - Invite-only channels
- `task` - Task-related discussions

---

#### GET `/participant-channels-api?eventId={eventId}&channelId={channelId}`

Get detailed info for a specific channel including accurate unread count.

**Response (200):**
```json
{
  "channel": {
    "id": "uuid",
    "name": "general",
    "description": "Open discussion",
    "type": "general",
    "canRead": true,
    "canWrite": true,
    "unreadCount": 5,
    "lastMessage": { ... },
    "participantCount": 150
  },
  "eventId": "uuid",
  "eventName": "Tech Conference 2026"
}
```

---

#### PUT `/participant-channels-api`

Mark a channel as read (update read receipt).

**Request Body:**
```json
{
  "channelId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "markedAsRead": "uuid"
}
```

---

### 2. Participant Messages API

#### GET `/participant-messages-api?channelId={channelId}`

List messages in a channel with cursor-based pagination.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| channelId | UUID | Yes | The channel ID |
| cursor | ISO8601 | No | Pagination cursor (created_at of last message) |
| limit | Integer | No | Max messages to return (default: 50, max: 100) |

**Response (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "channelId": "uuid",
      "senderId": "uuid",
      "senderName": "John Doe",
      "content": "Hello everyone!",
      "messageType": "text",
      "attachments": [],
      "isEdited": false,
      "editedAt": null,
      "createdAt": "2026-02-02T10:00:00Z"
    }
  ],
  "nextCursor": "2026-02-02T09:55:00Z",
  "hasMore": true
}
```

**Message Types:**
- `text` - Regular text message
- `system` - System-generated message
- `broadcast` - Broadcast announcement
- `task_update` - Task status update

---

#### POST `/participant-messages-api`

Send a message to a channel.

**Request Body:**
```json
{
  "channelId": "uuid",
  "content": "Hello everyone!",
  "messageType": "text"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "channelId": "uuid",
  "senderId": "uuid",
  "senderName": "John Doe",
  "content": "Hello everyone!",
  "messageType": "text",
  "createdAt": "2026-02-02T10:00:00Z"
}
```

**Error (403):** If channel is read-only for participants:
```json
{
  "error": "This channel is read-only for participants"
}
```

---

#### PUT `/participant-messages-api`

Edit a message (own messages only).

**Request Body:**
```json
{
  "messageId": "uuid",
  "content": "Updated message content"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "content": "Updated message content",
  "isEdited": true,
  "editedAt": "2026-02-02T10:05:00Z"
}
```

---

#### DELETE `/participant-messages-api?messageId={messageId}`

Delete a message (own messages only).

**Response (200):**
```json
{
  "success": true,
  "deleted": "uuid"
}
```

---

### 3. Participant Channel Management API

#### POST `/participant-channel-join`

Manage participant channel memberships (admin only).

**Request Body:**
```json
{
  "action": "join" | "leave" | "sync" | "channels",
  "eventId": "uuid",
  "channelId": "uuid",
  "channelIds": ["uuid", "uuid"],
  "userId": "uuid",
  "userIds": ["uuid", "uuid"]
}
```

**Actions:**
| Action | Description |
|--------|-------------|
| `join` | Add participant(s) to channel(s) |
| `leave` | Remove participant(s) from channel(s) |
| `sync` | Sync all confirmed registrations to auto-join channels |
| `channels` | List participant's accessible channels |

---

## Realtime Subscriptions

For real-time message updates, use Supabase Realtime:

```dart
// Flutter example
final channel = supabase
    .channel('channel-messages:$channelId')
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
        final newMessage = payload.newRecord;
        // Handle new message
      },
    )
    .subscribe();
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
| Code | Description |
|------|-------------|
| 400 | Bad Request - Missing required parameters |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Access denied to resource |
| 404 | Not Found - Resource doesn't exist |
| 405 | Method Not Allowed |
| 500 | Internal Server Error |

---

## Flutter Integration Example

### Service Class

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

class ParticipantChannelService {
  final SupabaseClient _supabase = Supabase.instance.client;
  
  Future<List<Channel>> getChannels(String eventId) async {
    final response = await _supabase.functions.invoke(
      'participant-channels-api',
      queryParameters: {'eventId': eventId},
    );
    
    if (response.status != 200) {
      throw Exception(response.data['error']);
    }
    
    return (response.data['channels'] as List)
        .map((c) => Channel.fromJson(c))
        .toList();
  }
  
  Future<List<Message>> getMessages(String channelId, {String? cursor}) async {
    final params = {'channelId': channelId};
    if (cursor != null) params['cursor'] = cursor;
    
    final response = await _supabase.functions.invoke(
      'participant-messages-api',
      queryParameters: params,
    );
    
    if (response.status != 200) {
      throw Exception(response.data['error']);
    }
    
    return (response.data['messages'] as List)
        .map((m) => Message.fromJson(m))
        .toList();
  }
  
  Future<Message> sendMessage(String channelId, String content) async {
    final response = await _supabase.functions.invoke(
      'participant-messages-api',
      method: HttpMethod.post,
      body: {
        'channelId': channelId,
        'content': content,
        'messageType': 'text',
      },
    );
    
    if (response.status != 201) {
      throw Exception(response.data['error']);
    }
    
    return Message.fromJson(response.data);
  }
  
  Future<void> markAsRead(String channelId) async {
    await _supabase.functions.invoke(
      'participant-channels-api',
      method: HttpMethod.put,
      body: {'channelId': channelId},
    );
  }
}
```

### Models

```dart
class Channel {
  final String id;
  final String name;
  final String? description;
  final String type;
  final bool canRead;
  final bool canWrite;
  final int unreadCount;
  final Message? lastMessage;
  final int participantCount;
  
  Channel.fromJson(Map<String, dynamic> json)
      : id = json['id'],
        name = json['name'],
        description = json['description'],
        type = json['type'],
        canRead = json['canRead'] ?? true,
        canWrite = json['canWrite'] ?? true,
        unreadCount = json['unreadCount'] ?? 0,
        lastMessage = json['lastMessage'] != null 
            ? Message.fromJson(json['lastMessage']) 
            : null,
        participantCount = json['participantCount'] ?? 0;
}

class Message {
  final String id;
  final String channelId;
  final String senderId;
  final String? senderName;
  final String content;
  final String messageType;
  final List<dynamic> attachments;
  final bool isEdited;
  final DateTime? editedAt;
  final DateTime createdAt;
  
  Message.fromJson(Map<String, dynamic> json)
      : id = json['id'],
        channelId = json['channelId'],
        senderId = json['senderId'],
        senderName = json['senderName'],
        content = json['content'],
        messageType = json['messageType'] ?? 'text',
        attachments = json['attachments'] ?? [],
        isEdited = json['isEdited'] ?? false,
        editedAt = json['editedAt'] != null 
            ? DateTime.parse(json['editedAt']) 
            : null,
        createdAt = DateTime.parse(json['createdAt']);
}
```

---

## Push Notifications

For push notification integration, register the device token:

```dart
// Register FCM token with your backend
await supabase.from('push_tokens').upsert({
  'user_id': currentUserId,
  'token': fcmToken,
  'platform': 'android', // or 'ios'
  'updated_at': DateTime.now().toIso8601String(),
});
```

Push notifications are triggered when:
1. New message in announcement channel
2. User is mentioned (@username)
3. Direct message received

---

## Rate Limits

| Endpoint | Rate Limit |
|----------|------------|
| GET messages | 100 requests/minute |
| POST message | 30 messages/minute |
| All others | 60 requests/minute |

---

## Changelog

### v1.0.0 (2026-02-02)
- Initial release
- Basic CRUD for messages
- Channel listing with permissions
- Read receipts
- Cursor-based pagination
