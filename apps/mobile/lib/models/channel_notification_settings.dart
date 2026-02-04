/// Channel-specific notification settings
/// 
/// Allows per-channel customization of notification preferences,
/// separate from global notification settings.

/// Per-channel notification settings model
class ChannelNotificationSettings {
  final String id;
  final String channelId;
  final String userId;
  final bool muted;
  final DateTime? mutedUntil;
  final String? customSoundName;
  final bool vibrationEnabled;
  final bool showPreviews;
  final bool mentionsOnly;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  const ChannelNotificationSettings({
    required this.id,
    required this.channelId,
    required this.userId,
    this.muted = false,
    this.mutedUntil,
    this.customSoundName,
    this.vibrationEnabled = true,
    this.showPreviews = true,
    this.mentionsOnly = false,
    required this.createdAt,
    required this.updatedAt,
  });
  
  /// Factory for default settings
  factory ChannelNotificationSettings.defaults({
    required String channelId,
    required String userId,
  }) => ChannelNotificationSettings(
    id: '',
    channelId: channelId,
    userId: userId,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
  
  /// Whether mute is currently active
  bool get isMuted {
    if (!muted) return false;
    if (mutedUntil == null) return true; // Muted forever
    return DateTime.now().isBefore(mutedUntil!);
  }
  
  /// Human-readable mute status
  String get muteStatusLabel {
    if (!muted) return 'Off';
    if (mutedUntil == null) return 'Forever';
    
    final remaining = mutedUntil!.difference(DateTime.now());
    if (remaining.isNegative) return 'Off';
    
    if (remaining.inDays >= 7) return '1 week';
    if (remaining.inDays >= 1) return '${remaining.inDays} day${remaining.inDays > 1 ? 's' : ''}';
    if (remaining.inHours >= 1) return '${remaining.inHours} hour${remaining.inHours > 1 ? 's' : ''}';
    return '${remaining.inMinutes} min';
  }
  
  /// Available mute duration options
  static const List<MuteDuration> muteDurations = [
    MuteDuration(label: 'Off', duration: null),
    MuteDuration(label: '1 hour', duration: Duration(hours: 1)),
    MuteDuration(label: '8 hours', duration: Duration(hours: 8)),
    MuteDuration(label: '1 day', duration: Duration(days: 1)),
    MuteDuration(label: '1 week', duration: Duration(days: 7)),
    MuteDuration(label: 'Forever', duration: null, isForever: true),
  ];
  
  Map<String, dynamic> toJson() => {
    'id': id,
    'channel_id': channelId,
    'user_id': userId,
    'muted': muted,
    'muted_until': mutedUntil?.toIso8601String(),
    'custom_sound_name': customSoundName,
    'vibration_enabled': vibrationEnabled,
    'show_previews': showPreviews,
    'mentions_only': mentionsOnly,
    'created_at': createdAt.toIso8601String(),
    'updated_at': updatedAt.toIso8601String(),
  };
  
  factory ChannelNotificationSettings.fromJson(Map<String, dynamic> json) {
    DateTime? parseDateTime(dynamic value) {
      if (value == null) return null;
      if (value is String) {
        try { return DateTime.parse(value); } catch (_) { return null; }
      }
      return null;
    }
    
    return ChannelNotificationSettings(
      id: json['id'] as String? ?? '',
      channelId: json['channel_id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      muted: json['muted'] as bool? ?? false,
      mutedUntil: parseDateTime(json['muted_until']),
      customSoundName: json['custom_sound_name'] as String?,
      vibrationEnabled: json['vibration_enabled'] as bool? ?? true,
      showPreviews: json['show_previews'] as bool? ?? true,
      mentionsOnly: json['mentions_only'] as bool? ?? false,
      createdAt: parseDateTime(json['created_at']) ?? DateTime.now(),
      updatedAt: parseDateTime(json['updated_at']) ?? DateTime.now(),
    );
  }
  
  ChannelNotificationSettings copyWith({
    String? id,
    String? channelId,
    String? userId,
    bool? muted,
    DateTime? mutedUntil,
    String? customSoundName,
    bool? vibrationEnabled,
    bool? showPreviews,
    bool? mentionsOnly,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => ChannelNotificationSettings(
    id: id ?? this.id,
    channelId: channelId ?? this.channelId,
    userId: userId ?? this.userId,
    muted: muted ?? this.muted,
    mutedUntil: mutedUntil ?? this.mutedUntil,
    customSoundName: customSoundName ?? this.customSoundName,
    vibrationEnabled: vibrationEnabled ?? this.vibrationEnabled,
    showPreviews: showPreviews ?? this.showPreviews,
    mentionsOnly: mentionsOnly ?? this.mentionsOnly,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
}

/// Mute duration option
class MuteDuration {
  final String label;
  final Duration? duration;
  final bool isForever;
  
  const MuteDuration({
    required this.label,
    required this.duration,
    this.isForever = false,
  });
  
  /// Calculate the muted_until DateTime from now
  DateTime? getMutedUntil() {
    if (isForever) return null; // null means forever
    if (duration == null) return null; // Off
    return DateTime.now().add(duration!);
  }
  
  /// Whether this option disables muting
  bool get isOff => duration == null && !isForever;
}
