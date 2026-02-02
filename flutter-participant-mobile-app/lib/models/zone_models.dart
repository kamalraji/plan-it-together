/// Models for the Zone tab - Event day activities

import 'package:flutter/material.dart';
import 'package:thittam1hub/models/models.dart' show EventCategory;

class EventSession {
  final String id;
  final String eventId;
  final String title;
  final String? description;
  final String? speakerName;
  final String? speakerAvatar;
  final String? room;
  final String? location;
  final String? trackId;
  final DateTime startTime;
  final DateTime endTime;
  final String status; // 'upcoming', 'live', 'ended'
  final int attendeeCount;
  final String? streamUrl;
  final List<String> tags;

  EventSession({
    required this.id,
    required this.eventId,
    required this.title,
    this.description,
    this.speakerName,
    this.speakerAvatar,
    this.room,
    this.location,
    this.trackId,
    required this.startTime,
    required this.endTime,
    this.status = 'upcoming',
    this.attendeeCount = 0,
    this.streamUrl,
    this.tags = const [],
  });

  bool get isLive => status == 'live';
  bool get isUpcoming => status == 'upcoming';
  bool get hasEnded => status == 'ended';

  Duration get duration => endTime.difference(startTime);
  
  int get minutesRemaining {
    if (hasEnded) return 0;
    return endTime.difference(DateTime.now()).inMinutes.clamp(0, 999);
  }

  factory EventSession.fromJson(Map<String, dynamic> json) {
    return EventSession(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      speakerName: json['speaker_name'] as String?,
      speakerAvatar: json['speaker_avatar'] as String?,
      room: json['room'] as String?,
      location: json['location'] as String?,
      trackId: json['track_id'] as String?,
      startTime: DateTime.parse(json['start_time'] as String),
      endTime: DateTime.parse(json['end_time'] as String),
      status: json['status'] as String? ?? 'upcoming',
      attendeeCount: json['attendee_count'] as int? ?? 0,
      streamUrl: json['stream_url'] as String?,
      tags: (json['tags'] as List<dynamic>?)?.cast<String>() ?? [],
    );
  }
}

class EventCheckin {
  final String id;
  final String userId;
  final String eventId;
  final DateTime checkinTime;
  final DateTime? checkoutTime;
  final String? location;

  EventCheckin({
    required this.id,
    required this.userId,
    required this.eventId,
    required this.checkinTime,
    this.checkoutTime,
    this.location,
  });

  bool get isActive => checkoutTime == null;

  factory EventCheckin.fromJson(Map<String, dynamic> json) {
    return EventCheckin(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      eventId: json['event_id'] as String,
      checkinTime: DateTime.parse(json['checkin_time'] as String),
      checkoutTime: json['checkout_time'] != null
          ? DateTime.parse(json['checkout_time'] as String)
          : null,
      location: json['location'] as String?,
    );
  }
}

class AttendeeRadar {
  final String id;
  final String userId;
  final String fullName;
  final String? avatarUrl;
  final String? headline;
  final int matchScore;
  final bool isOnline;
  final String? currentSession;
  final List<String> sharedInterests;

  AttendeeRadar({
    required this.id,
    required this.userId,
    required this.fullName,
    this.avatarUrl,
    this.headline,
    this.matchScore = 0,
    this.isOnline = false,
    this.currentSession,
    this.sharedInterests = const [],
  });

  factory AttendeeRadar.fromJson(Map<String, dynamic> json) {
    return AttendeeRadar(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      fullName: json['full_name'] as String,
      avatarUrl: json['avatar_url'] as String?,
      headline: json['headline'] as String?,
      matchScore: json['match_score'] as int? ?? 0,
      isOnline: json['is_online'] as bool? ?? false,
      currentSession: json['current_session'] as String?,
      sharedInterests: (json['shared_interests'] as List<dynamic>?)?.cast<String>() ?? [],
    );
  }
}

class EventPoll {
  final String id;
  final String eventId;
  final String question;
  final List<PollOption> options;
  final DateTime createdAt;
  final DateTime? expiresAt;
  final bool isActive;
  final int totalVotes;
  final String? userVote;

  EventPoll({
    required this.id,
    required this.eventId,
    required this.question,
    required this.options,
    required this.createdAt,
    this.expiresAt,
    this.isActive = true,
    this.totalVotes = 0,
    this.userVote,
  });

  bool get hasVoted => userVote != null;

  factory EventPoll.fromJson(Map<String, dynamic> json) {
    return EventPoll(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      question: json['question'] as String,
      options: (json['options'] as List<dynamic>)
          .map((o) => PollOption.fromJson(o as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.parse(json['created_at'] as String),
      expiresAt: json['expires_at'] != null
          ? DateTime.parse(json['expires_at'] as String)
          : null,
      isActive: json['is_active'] as bool? ?? true,
      totalVotes: json['total_votes'] as int? ?? 0,
      userVote: json['user_vote'] as String?,
    );
  }
}

class PollOption {
  final String id;
  final String text;
  final int voteCount;
  final double percentage;

  PollOption({
    required this.id,
    required this.text,
    this.voteCount = 0,
    this.percentage = 0.0,
  });

  factory PollOption.fromJson(Map<String, dynamic> json) {
    return PollOption(
      id: json['id'] as String,
      text: json['text'] as String,
      voteCount: json['vote_count'] as int? ?? 0,
      percentage: (json['percentage'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class EventAnnouncement {
  final String id;
  final String eventId;
  final String title;
  final String content;
  final String type; // 'info', 'alert', 'update', 'sponsor'
  final DateTime createdAt;
  final String? authorName;
  final String? authorAvatar;
  final bool isPinned;

  EventAnnouncement({
    required this.id,
    required this.eventId,
    required this.title,
    required this.content,
    this.type = 'info',
    required this.createdAt,
    this.authorName,
    this.authorAvatar,
    this.isPinned = false,
  });

  IconData get typeIcon {
    switch (type) {
      case 'alert':
        return Icons.warning_rounded;
      case 'update':
        return Icons.update_rounded;
      case 'sponsor':
        return Icons.star_rounded;
      default:
        return Icons.info_rounded;
    }
  }

  factory EventAnnouncement.fromJson(Map<String, dynamic> json) {
    return EventAnnouncement(
      id: json['id'] as String,
      eventId: json['event_id'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      type: json['type'] as String? ?? 'info',
      createdAt: DateTime.parse(json['created_at'] as String),
      authorName: json['author_name'] as String?,
      authorAvatar: json['author_avatar'] as String?,
      isPinned: json['is_pinned'] as bool? ?? false,
    );
  }
}

class ZoneEvent {
  final String id;
  final String name;
  final String? description;
  final String? venue;
  final DateTime startDate;
  final DateTime endDate;
  final String? bannerUrl;
  final int attendeeCount;
  final bool isCheckedIn;
  final EventCategory? category;

  ZoneEvent({
    required this.id,
    required this.name,
    this.description,
    this.venue,
    required this.startDate,
    required this.endDate,
    this.bannerUrl,
    this.attendeeCount = 0,
    this.isCheckedIn = false,
    this.category,
  });

  bool get isHappeningNow {
    final now = DateTime.now();
    return now.isAfter(startDate) && now.isBefore(endDate);
  }

  bool get isUpcoming => DateTime.now().isBefore(startDate);

  factory ZoneEvent.fromJson(Map<String, dynamic> json, {bool isCheckedIn = false}) {
    // Parse category from JSON
    EventCategory? category;
    final catStr = json['category'] as String?;
    if (catStr != null) {
      final upperCat = catStr.toUpperCase();
      for (final c in EventCategory.values) {
        if (c.name == upperCat) {
          category = c;
          break;
        }
      }
    }
    
    // Extract venue and banner from branding JSONB (database doesn't have venue column)
    String? venue;
    String? bannerUrl;
    final branding = json['branding'] as Map<String, dynamic>?;
    if (branding != null) {
      venue = branding['venue'] as String? ?? branding['location'] as String?;
      bannerUrl = branding['banner_url'] as String? ?? branding['bannerUrl'] as String?;
    }
    
    return ZoneEvent(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      venue: venue,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: DateTime.parse(json['end_date'] as String),
      bannerUrl: bannerUrl,
      attendeeCount: json['attendee_count'] as int? ?? 0,
      isCheckedIn: isCheckedIn,
      category: category,
    );
  }
}

