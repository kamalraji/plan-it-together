---
llm_metadata:
  purpose: TypeScript to Dart model mappings
  last_updated: 2026-02-02
  related_files:
    - src/integrations/supabase/types.ts
    - apps/mobile/lib/models/
---

# Model Parity Guide

This document maps TypeScript interfaces (Web) to Dart classes (Mobile) for all shared data models. Use this when implementing features across both platforms to ensure data consistency.

---

## Core Conventions

### TypeScript (Web)
- Use `interface` for data shapes
- Use `string` for UUIDs and ISO dates
- Nullable fields: `field?: Type` or `field: Type | null`
- Import from `@/integrations/supabase/types`

### Dart (Flutter)
- Use `class` with final fields
- Use `String` for UUIDs, `DateTime` for timestamps
- Nullable fields: `Type?`
- Implement `fromJson` factory and `toJson` method
- Use `equatable` or manual `==` override for value equality

---

## User & Authentication

### UserProfile

#### TypeScript
```typescript
interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
  social_links: Record<string, string> | null;
  cover_gradient_id: string | null;
  created_at: string;
  updated_at: string;
}
```

#### Dart
```dart
class UserProfile {
  final String id;
  final String email;
  final String? fullName;
  final String? avatarUrl;
  final String? bio;
  final List<String>? skills;
  final Map<String, String>? socialLinks;
  final String? coverGradientId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const UserProfile({
    required this.id,
    required this.email,
    this.fullName,
    this.avatarUrl,
    this.bio,
    this.skills,
    this.socialLinks,
    this.coverGradientId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['full_name'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      bio: json['bio'] as String?,
      skills: (json['skills'] as List<dynamic>?)?.cast<String>(),
      socialLinks: (json['social_links'] as Map<String, dynamic>?)?.cast<String, String>(),
      coverGradientId: json['cover_gradient_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'full_name': fullName,
    'avatar_url': avatarUrl,
    'bio': bio,
    'skills': skills,
    'social_links': socialLinks,
    'cover_gradient_id': coverGradientId,
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt.toIso8601String(),
  };
}
```

---

## Events & Registrations

### Event

#### TypeScript
```typescript
interface Event {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  start_date: string;
  end_date: string;
  timezone: string;
  location: string | null;
  venue_name: string | null;
  is_virtual: boolean;
  virtual_url: string | null;
  cover_image_url: string | null;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  visibility: 'public' | 'private' | 'unlisted';
  max_attendees: number | null;
  registration_deadline: string | null;
  created_at: string;
  updated_at: string;
}
```

#### Dart
```dart
enum EventStatus { draft, published, cancelled, completed }
enum EventVisibility { public_, private_, unlisted }

class Event {
  final String id;
  final String workspaceId;
  final String title;
  final String? description;
  final String? shortDescription;
  final DateTime startDate;
  final DateTime endDate;
  final String timezone;
  final String? location;
  final String? venueName;
  final bool isVirtual;
  final String? virtualUrl;
  final String? coverImageUrl;
  final EventStatus status;
  final EventVisibility visibility;
  final int? maxAttendees;
  final DateTime? registrationDeadline;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Event({
    required this.id,
    required this.workspaceId,
    required this.title,
    this.description,
    this.shortDescription,
    required this.startDate,
    required this.endDate,
    required this.timezone,
    this.location,
    this.venueName,
    required this.isVirtual,
    this.virtualUrl,
    this.coverImageUrl,
    required this.status,
    required this.visibility,
    this.maxAttendees,
    this.registrationDeadline,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] as String,
      workspaceId: json['workspace_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      shortDescription: json['short_description'] as String?,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: DateTime.parse(json['end_date'] as String),
      timezone: json['timezone'] as String,
      location: json['location'] as String?,
      venueName: json['venue_name'] as String?,
      isVirtual: json['is_virtual'] as bool,
      virtualUrl: json['virtual_url'] as String?,
      coverImageUrl: json['cover_image_url'] as String?,
      status: EventStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => EventStatus.draft,
      ),
      visibility: EventVisibility.values.firstWhere(
        (e) => e.name.replaceAll('_', '') == json['visibility'],
        orElse: () => EventVisibility.public_,
      ),
      maxAttendees: json['max_attendees'] as int?,
      registrationDeadline: json['registration_deadline'] != null
          ? DateTime.parse(json['registration_deadline'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}
```

### Registration

#### TypeScript
```typescript
interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  ticket_type_id: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'waitlisted' | 'checked_in';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  qr_code: string | null;
  custom_fields: Record<string, unknown> | null;
  dietary_requirements: string | null;
  accessibility_needs: string | null;
  created_at: string;
  updated_at: string;
}
```

#### Dart
```dart
enum RegistrationStatus { pending, confirmed, cancelled, waitlisted, checkedIn }
enum PaymentStatus { pending, paid, refunded, failed }

class Registration {
  final String id;
  final String eventId;
  final String userId;
  final String? ticketTypeId;
  final RegistrationStatus status;
  final PaymentStatus paymentStatus;
  final String? qrCode;
  final Map<String, dynamic>? customFields;
  final String? dietaryRequirements;
  final String? accessibilityNeeds;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Registration({
    required this.id,
    required this.eventId,
    required this.userId,
    this.ticketTypeId,
    required this.status,
    required this.paymentStatus,
    this.qrCode,
    this.customFields,
    this.dietaryRequirements,
    this.accessibilityNeeds,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Registration.fromJson(Map<String, dynamic> json) {
    return Registration(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      userId: json['user_id'] as String,
      ticketTypeId: json['ticket_type_id'] as String?,
      status: RegistrationStatus.values.firstWhere(
        (e) => e.name == (json['status'] as String).replaceAll('_', ''),
        orElse: () => RegistrationStatus.pending,
      ),
      paymentStatus: PaymentStatus.values.firstWhere(
        (e) => e.name == json['payment_status'],
        orElse: () => PaymentStatus.pending,
      ),
      qrCode: json['qr_code'] as String?,
      customFields: json['custom_fields'] as Map<String, dynamic>?,
      dietaryRequirements: json['dietary_requirements'] as String?,
      accessibilityNeeds: json['accessibility_needs'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}
```

---

## Workspace & Channels

### WorkspaceChannel

#### TypeScript
```typescript
interface WorkspaceChannel {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  type: 'general' | 'announcement' | 'private' | 'task' | 'support';
  is_archived: boolean;
  is_participant_channel: boolean;
  participant_permissions: {
    can_read: boolean;
    can_write: boolean;
    can_react: boolean;
  } | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

#### Dart
```dart
enum ChannelType { general, announcement, private_, task, support }

class ChannelPermissions {
  final bool canRead;
  final bool canWrite;
  final bool canReact;

  const ChannelPermissions({
    this.canRead = true,
    this.canWrite = true,
    this.canReact = true,
  });

  factory ChannelPermissions.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const ChannelPermissions();
    }
    return ChannelPermissions(
      canRead: json['can_read'] as bool? ?? true,
      canWrite: json['can_write'] as bool? ?? true,
      canReact: json['can_react'] as bool? ?? true,
    );
  }
}

class WorkspaceChannel {
  final String id;
  final String workspaceId;
  final String name;
  final String? description;
  final ChannelType type;
  final bool isArchived;
  final bool isParticipantChannel;
  final ChannelPermissions permissions;
  final String createdBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  const WorkspaceChannel({
    required this.id,
    required this.workspaceId,
    required this.name,
    this.description,
    required this.type,
    required this.isArchived,
    required this.isParticipantChannel,
    required this.permissions,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
  });

  factory WorkspaceChannel.fromJson(Map<String, dynamic> json) {
    return WorkspaceChannel(
      id: json['id'] as String,
      workspaceId: json['workspace_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      type: ChannelType.values.firstWhere(
        (e) => e.name.replaceAll('_', '') == json['type'],
        orElse: () => ChannelType.general,
      ),
      isArchived: json['is_archived'] as bool? ?? false,
      isParticipantChannel: json['is_participant_channel'] as bool? ?? false,
      permissions: ChannelPermissions.fromJson(
        json['participant_permissions'] as Map<String, dynamic>?,
      ),
      createdBy: json['created_by'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}
```

### ChannelMessage

#### TypeScript
```typescript
interface ChannelMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string | null;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system' | 'gif';
  attachments: Array<{
    url: string;
    type: string;
    name: string;
    size?: number;
  }> | null;
  is_edited: boolean;
  is_encrypted: boolean;
  parent_message_id: string | null;
  reply_count: number;
  created_at: string;
  edited_at: string | null;
}
```

#### Dart
```dart
enum MessageType { text, image, file, system, gif }

class MessageAttachment {
  final String url;
  final String type;
  final String name;
  final int? size;

  const MessageAttachment({
    required this.url,
    required this.type,
    required this.name,
    this.size,
  });

  factory MessageAttachment.fromJson(Map<String, dynamic> json) {
    return MessageAttachment(
      url: json['url'] as String,
      type: json['type'] as String,
      name: json['name'] as String,
      size: json['size'] as int?,
    );
  }
}

class ChannelMessage {
  final String id;
  final String channelId;
  final String senderId;
  final String? senderName;
  final String content;
  final MessageType messageType;
  final List<MessageAttachment>? attachments;
  final bool isEdited;
  final bool isEncrypted;
  final String? parentMessageId;
  final int replyCount;
  final DateTime createdAt;
  final DateTime? editedAt;

  const ChannelMessage({
    required this.id,
    required this.channelId,
    required this.senderId,
    this.senderName,
    required this.content,
    required this.messageType,
    this.attachments,
    required this.isEdited,
    required this.isEncrypted,
    this.parentMessageId,
    required this.replyCount,
    required this.createdAt,
    this.editedAt,
  });

  factory ChannelMessage.fromJson(Map<String, dynamic> json) {
    return ChannelMessage(
      id: json['id'] as String,
      channelId: json['channel_id'] as String,
      senderId: json['sender_id'] as String,
      senderName: json['sender_name'] as String?,
      content: json['content'] as String,
      messageType: MessageType.values.firstWhere(
        (e) => e.name == json['message_type'],
        orElse: () => MessageType.text,
      ),
      attachments: (json['attachments'] as List<dynamic>?)
          ?.map((e) => MessageAttachment.fromJson(e as Map<String, dynamic>))
          .toList(),
      isEdited: json['is_edited'] as bool? ?? false,
      isEncrypted: json['is_encrypted'] as bool? ?? false,
      parentMessageId: json['parent_message_id'] as String?,
      replyCount: json['reply_count'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
      editedAt: json['edited_at'] != null
          ? DateTime.parse(json['edited_at'] as String)
          : null,
    );
  }
}
```

---

## Sessions & Schedule

### EventSession

#### TypeScript
```typescript
interface EventSession {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  room: string | null;
  track: string | null;
  session_type: 'keynote' | 'workshop' | 'panel' | 'networking' | 'break' | 'other';
  capacity: number | null;
  speaker_ids: string[] | null;
  is_mandatory: boolean;
  materials_url: string | null;
  created_at: string;
  updated_at: string;
}
```

#### Dart
```dart
enum SessionType { keynote, workshop, panel, networking, break_, other }

class EventSession {
  final String id;
  final String eventId;
  final String title;
  final String? description;
  final DateTime startTime;
  final DateTime endTime;
  final String? location;
  final String? room;
  final String? track;
  final SessionType sessionType;
  final int? capacity;
  final List<String>? speakerIds;
  final bool isMandatory;
  final String? materialsUrl;
  final DateTime createdAt;
  final DateTime updatedAt;

  const EventSession({
    required this.id,
    required this.eventId,
    required this.title,
    this.description,
    required this.startTime,
    required this.endTime,
    this.location,
    this.room,
    this.track,
    required this.sessionType,
    this.capacity,
    this.speakerIds,
    required this.isMandatory,
    this.materialsUrl,
    required this.createdAt,
    required this.updatedAt,
  });

  factory EventSession.fromJson(Map<String, dynamic> json) {
    return EventSession(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      startTime: DateTime.parse(json['start_time'] as String),
      endTime: DateTime.parse(json['end_time'] as String),
      location: json['location'] as String?,
      room: json['room'] as String?,
      track: json['track'] as String?,
      sessionType: SessionType.values.firstWhere(
        (e) => e.name.replaceAll('_', '') == json['session_type'],
        orElse: () => SessionType.other,
      ),
      capacity: json['capacity'] as int?,
      speakerIds: (json['speaker_ids'] as List<dynamic>?)?.cast<String>(),
      isMandatory: json['is_mandatory'] as bool? ?? false,
      materialsUrl: json['materials_url'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}
```

---

## AI Matching

### AIMatch

#### TypeScript
```typescript
interface AIMatch {
  target_user_id: string;
  match_score: number;
  match_category: 'skills' | 'interests' | 'goals' | 'collaboration';
  match_reasons: string[];
  conversation_starters: string[] | null;
  shared_context: {
    shared_skills: string[];
    shared_interests: string[];
    complementary_skills: string[];
  } | null;
}
```

#### Dart
```dart
enum MatchCategory { skills, interests, goals, collaboration }

class SharedContext {
  final List<String> sharedSkills;
  final List<String> sharedInterests;
  final List<String> complementarySkills;

  const SharedContext({
    this.sharedSkills = const [],
    this.sharedInterests = const [],
    this.complementarySkills = const [],
  });

  factory SharedContext.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const SharedContext();
    return SharedContext(
      sharedSkills: (json['shared_skills'] as List<dynamic>?)?.cast<String>() ?? [],
      sharedInterests: (json['shared_interests'] as List<dynamic>?)?.cast<String>() ?? [],
      complementarySkills: (json['complementary_skills'] as List<dynamic>?)?.cast<String>() ?? [],
    );
  }
}

class AIMatch {
  final String targetUserId;
  final double matchScore;
  final MatchCategory matchCategory;
  final List<String> matchReasons;
  final List<String>? conversationStarters;
  final SharedContext? sharedContext;

  const AIMatch({
    required this.targetUserId,
    required this.matchScore,
    required this.matchCategory,
    required this.matchReasons,
    this.conversationStarters,
    this.sharedContext,
  });

  factory AIMatch.fromJson(Map<String, dynamic> json) {
    return AIMatch(
      targetUserId: json['target_user_id'] as String,
      matchScore: (json['match_score'] as num).toDouble(),
      matchCategory: MatchCategory.values.firstWhere(
        (e) => e.name == json['match_category'],
        orElse: () => MatchCategory.interests,
      ),
      matchReasons: (json['match_reasons'] as List<dynamic>).cast<String>(),
      conversationStarters: (json['conversation_starters'] as List<dynamic>?)?.cast<String>(),
      sharedContext: json['shared_context'] != null
          ? SharedContext.fromJson(json['shared_context'] as Map<String, dynamic>)
          : null,
    );
  }
}
```

---

## Type Mapping Quick Reference

| TypeScript | Dart | Notes |
|------------|------|-------|
| `string` | `String` | |
| `number` | `int` or `double` | Use `num` then cast if needed |
| `boolean` | `bool` | |
| `string` (UUID) | `String` | Consider `uuid` package for validation |
| `string` (ISO date) | `DateTime` | Use `DateTime.parse()` |
| `Type \| null` | `Type?` | Nullable types |
| `Type[]` | `List<Type>` | |
| `Record<string, Type>` | `Map<String, Type>` | |
| `unknown` | `dynamic` | Avoid when possible |
| Union types | `enum` + factory | Use Dart enums |

---

## Dart Enum Handling

When TypeScript uses string literals, Dart should use enums with smart parsing:

```dart
enum MyStatus { active, inactive, pending }

extension MyStatusExtension on MyStatus {
  static MyStatus fromString(String value) {
    return MyStatus.values.firstWhere(
      (e) => e.name == value || e.name.replaceAll('_', '') == value,
      orElse: () => MyStatus.pending, // Default fallback
    );
  }

  String toJson() => name.replaceAll('_', '');
}
```
