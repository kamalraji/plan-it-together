/// Live Stream model for YouTube/Vimeo streaming integration
/// 
/// Represents a live stream attached to an event session with viewer tracking
/// and platform-specific configuration.

import 'package:flutter/foundation.dart';

/// Supported streaming platforms
enum StreamPlatform {
  youtube('YOUTUBE'),
  vimeo('VIMEO'),
  custom('CUSTOM');

  const StreamPlatform(this.value);
  final String value;

  static StreamPlatform fromString(String value) {
    return StreamPlatform.values.firstWhere(
      (p) => p.value == value.toUpperCase(),
      orElse: () => StreamPlatform.youtube,
    );
  }
}

/// Stream status lifecycle
enum StreamStatus {
  scheduled('scheduled'),
  live('live'),
  ended('ended'),
  error('error');

  const StreamStatus(this.value);
  final String value;

  static StreamStatus fromString(String value) {
    return StreamStatus.values.firstWhere(
      (s) => s.value == value.toLowerCase(),
      orElse: () => StreamStatus.scheduled,
    );
  }
}

/// Represents a live stream configuration for an event session
@immutable
class LiveStream {
  final String id;
  final String sessionId;
  final String eventId;
  final StreamPlatform platform;
  final String videoId;
  final String streamUrl;
  final StreamStatus status;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final int viewerCount;
  final bool chatEnabled;
  final bool isRecordingAvailable;
  final String? recordingUrl;
  final DateTime createdAt;
  final DateTime updatedAt;

  const LiveStream({
    required this.id,
    required this.sessionId,
    required this.eventId,
    required this.platform,
    required this.videoId,
    required this.streamUrl,
    required this.status,
    this.startedAt,
    this.endedAt,
    this.viewerCount = 0,
    this.chatEnabled = true,
    this.isRecordingAvailable = false,
    this.recordingUrl,
    required this.createdAt,
    required this.updatedAt,
  });

  // ==================== Computed Properties ====================

  /// Check if stream is currently live
  bool get isLive => status == StreamStatus.live;

  /// Check if stream is scheduled (not started)
  bool get isScheduled => status == StreamStatus.scheduled;

  /// Check if stream has ended
  bool get hasEnded => status == StreamStatus.ended;

  /// Check if there was a stream error
  bool get hasError => status == StreamStatus.error;

  /// Check if this is a YouTube stream
  bool get isYouTube => platform == StreamPlatform.youtube;

  /// Check if this is a Vimeo stream
  bool get isVimeo => platform == StreamPlatform.vimeo;

  /// Check if recording is available for playback
  bool get canPlayRecording => hasEnded && isRecordingAvailable && recordingUrl != null;

  /// Get embed URL for the stream player
  String get embedUrl {
    switch (platform) {
      case StreamPlatform.youtube:
        return 'https://www.youtube.com/embed/$videoId?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      case StreamPlatform.vimeo:
        return 'https://player.vimeo.com/video/$videoId?autoplay=1&title=0&byline=0&portrait=0';
      case StreamPlatform.custom:
        return streamUrl;
    }
  }

  /// Get thumbnail URL for the stream
  String get thumbnailUrl {
    switch (platform) {
      case StreamPlatform.youtube:
        return 'https://img.youtube.com/vi/$videoId/maxresdefault.jpg';
      case StreamPlatform.vimeo:
        // Vimeo requires API call for thumbnail, use placeholder
        return 'https://vumbnail.com/$videoId.jpg';
      case StreamPlatform.custom:
        return '';
    }
  }

  /// Get medium quality thumbnail (faster loading)
  String get thumbnailMediumUrl {
    switch (platform) {
      case StreamPlatform.youtube:
        return 'https://img.youtube.com/vi/$videoId/mqdefault.jpg';
      case StreamPlatform.vimeo:
        return 'https://vumbnail.com/${videoId}_medium.jpg';
      case StreamPlatform.custom:
        return '';
    }
  }

  /// Calculate stream duration if started and ended
  Duration? get streamDuration {
    if (startedAt == null) return null;
    final end = endedAt ?? DateTime.now();
    return end.difference(startedAt!);
  }

  /// Get formatted viewer count (e.g., "1.2K", "15K")
  String get formattedViewerCount {
    if (viewerCount < 1000) return viewerCount.toString();
    if (viewerCount < 10000) {
      return '${(viewerCount / 1000).toStringAsFixed(1)}K';
    }
    return '${(viewerCount / 1000).round()}K';
  }

  // ==================== Factory Constructors ====================

  factory LiveStream.fromJson(Map<String, dynamic> json) {
    return LiveStream(
      id: json['id'] as String,
      sessionId: json['session_id'] as String,
      eventId: json['event_id'] as String,
      platform: StreamPlatform.fromString(json['platform'] as String? ?? 'YOUTUBE'),
      videoId: json['video_id'] as String,
      streamUrl: json['stream_url'] as String,
      status: StreamStatus.fromString(json['stream_status'] as String? ?? 'scheduled'),
      startedAt: json['started_at'] != null
          ? DateTime.parse(json['started_at'] as String)
          : null,
      endedAt: json['ended_at'] != null
          ? DateTime.parse(json['ended_at'] as String)
          : null,
      viewerCount: json['viewer_count'] as int? ?? 0,
      chatEnabled: json['chat_enabled'] as bool? ?? true,
      isRecordingAvailable: json['is_recording_available'] as bool? ?? false,
      recordingUrl: json['recording_url'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'session_id': sessionId,
      'event_id': eventId,
      'platform': platform.value,
      'video_id': videoId,
      'stream_url': streamUrl,
      'stream_status': status.value,
      'started_at': startedAt?.toIso8601String(),
      'ended_at': endedAt?.toIso8601String(),
      'viewer_count': viewerCount,
      'chat_enabled': chatEnabled,
      'is_recording_available': isRecordingAvailable,
      'recording_url': recordingUrl,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  LiveStream copyWith({
    String? id,
    String? sessionId,
    String? eventId,
    StreamPlatform? platform,
    String? videoId,
    String? streamUrl,
    StreamStatus? status,
    DateTime? startedAt,
    DateTime? endedAt,
    int? viewerCount,
    bool? chatEnabled,
    bool? isRecordingAvailable,
    String? recordingUrl,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return LiveStream(
      id: id ?? this.id,
      sessionId: sessionId ?? this.sessionId,
      eventId: eventId ?? this.eventId,
      platform: platform ?? this.platform,
      videoId: videoId ?? this.videoId,
      streamUrl: streamUrl ?? this.streamUrl,
      status: status ?? this.status,
      startedAt: startedAt ?? this.startedAt,
      endedAt: endedAt ?? this.endedAt,
      viewerCount: viewerCount ?? this.viewerCount,
      chatEnabled: chatEnabled ?? this.chatEnabled,
      isRecordingAvailable: isRecordingAvailable ?? this.isRecordingAvailable,
      recordingUrl: recordingUrl ?? this.recordingUrl,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is LiveStream && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'LiveStream(id: $id, status: ${status.value}, viewers: $viewerCount)';
}

/// Viewer session for analytics and resume functionality
@immutable
class StreamViewerSession {
  final String id;
  final String streamId;
  final String userId;
  final DateTime startedAt;
  final DateTime lastSeenAt;
  final int watchDurationSeconds;
  final String qualityPreference;
  final String? deviceType;

  const StreamViewerSession({
    required this.id,
    required this.streamId,
    required this.userId,
    required this.startedAt,
    required this.lastSeenAt,
    this.watchDurationSeconds = 0,
    this.qualityPreference = 'auto',
    this.deviceType,
  });

  /// Get formatted watch duration
  String get formattedWatchDuration {
    final hours = watchDurationSeconds ~/ 3600;
    final minutes = (watchDurationSeconds % 3600) ~/ 60;
    final seconds = watchDurationSeconds % 60;

    if (hours > 0) {
      return '${hours}h ${minutes}m';
    } else if (minutes > 0) {
      return '${minutes}m ${seconds}s';
    } else {
      return '${seconds}s';
    }
  }

  factory StreamViewerSession.fromJson(Map<String, dynamic> json) {
    return StreamViewerSession(
      id: json['id'] as String,
      streamId: json['stream_id'] as String,
      userId: json['user_id'] as String,
      startedAt: DateTime.parse(json['started_at'] as String),
      lastSeenAt: DateTime.parse(json['last_seen_at'] as String),
      watchDurationSeconds: json['watch_duration_seconds'] as int? ?? 0,
      qualityPreference: json['quality_preference'] as String? ?? 'auto',
      deviceType: json['device_type'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'stream_id': streamId,
      'user_id': userId,
      'started_at': startedAt.toIso8601String(),
      'last_seen_at': lastSeenAt.toIso8601String(),
      'watch_duration_seconds': watchDurationSeconds,
      'quality_preference': qualityPreference,
      'device_type': deviceType,
    };
  }
}
