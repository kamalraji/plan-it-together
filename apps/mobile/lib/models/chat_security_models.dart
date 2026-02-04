/// Models for chat privacy and security features

class DisappearingMessageSettings {
  final String id;
  final String channelId;
  final String userId;
  final int durationSeconds;
  final bool enabled;
  final DateTime createdAt;
  final DateTime updatedAt;

  DisappearingMessageSettings({
    required this.id,
    required this.channelId,
    required this.userId,
    required this.durationSeconds,
    required this.enabled,
    required this.createdAt,
    required this.updatedAt,
  });

  factory DisappearingMessageSettings.fromJson(Map<String, dynamic> json) {
    return DisappearingMessageSettings(
      id: json['id'] as String,
      channelId: json['channel_id'] as String,
      userId: json['user_id'] as String,
      durationSeconds: json['duration_seconds'] as int,
      enabled: json['enabled'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'channel_id': channelId,
        'user_id': userId,
        'duration_seconds': durationSeconds,
        'enabled': enabled,
      };

  String get durationLabel {
    if (durationSeconds <= 0) return 'Off';
    if (durationSeconds < 60) return '$durationSeconds seconds';
    if (durationSeconds < 3600) return '${durationSeconds ~/ 60} minutes';
    if (durationSeconds < 86400) return '${durationSeconds ~/ 3600} hours';
    return '${durationSeconds ~/ 86400} days';
  }

  static const List<int> presetDurations = [
    0,      // Off
    300,    // 5 minutes
    3600,   // 1 hour
    86400,  // 24 hours
    604800, // 7 days
  ];
}

enum MessageReportReason {
  spam,
  harassment,
  inappropriate,
  scam,
  other;

  String get label {
    switch (this) {
      case spam:
        return 'Spam';
      case harassment:
        return 'Harassment';
      case inappropriate:
        return 'Inappropriate Content';
      case scam:
        return 'Scam or Fraud';
      case other:
        return 'Other';
    }
  }

  String get description {
    switch (this) {
      case spam:
        return 'Unsolicited promotional content or repetitive messages';
      case harassment:
        return 'Bullying, threats, or targeted abuse';
      case inappropriate:
        return 'Explicit, offensive, or harmful content';
      case scam:
        return 'Attempts to deceive or defraud';
      case other:
        return 'Other policy violations';
    }
  }
}

enum MessageReportStatus {
  pending,
  reviewed,
  resolved,
  dismissed;
}

class MessageReport {
  final String id;
  final String messageId;
  final String reporterId;
  final String? reportedUserId;
  final MessageReportReason reason;
  final String? details;
  final MessageReportStatus status;
  final DateTime createdAt;
  final DateTime? reviewedAt;
  final String? reviewedBy;

  MessageReport({
    required this.id,
    required this.messageId,
    required this.reporterId,
    this.reportedUserId,
    required this.reason,
    this.details,
    required this.status,
    required this.createdAt,
    this.reviewedAt,
    this.reviewedBy,
  });

  factory MessageReport.fromJson(Map<String, dynamic> json) {
    return MessageReport(
      id: json['id'] as String,
      messageId: json['message_id'] as String,
      reporterId: json['reporter_id'] as String,
      reportedUserId: json['reported_user_id'] as String?,
      reason: MessageReportReason.values.firstWhere(
        (r) => r.name == json['reason'],
        orElse: () => MessageReportReason.other,
      ),
      details: json['details'] as String?,
      status: MessageReportStatus.values.firstWhere(
        (s) => s.name == json['status'],
        orElse: () => MessageReportStatus.pending,
      ),
      createdAt: DateTime.parse(json['created_at'] as String),
      reviewedAt: json['reviewed_at'] != null
          ? DateTime.parse(json['reviewed_at'] as String)
          : null,
      reviewedBy: json['reviewed_by'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'message_id': messageId,
        'reporter_id': reporterId,
        'reported_user_id': reportedUserId,
        'reason': reason.name,
        'details': details,
      };
}

class ChatSecuritySettings {
  final String id;
  final String userId;
  final bool appLockEnabled;
  final int lockTimeoutMinutes;
  final bool requireBiometric;
  final bool hideMessagePreviewLocked;
  final bool incognitoKeyboard;
  final bool screenshotProtection;
  
  // Privacy toggles
  final bool hideTypingIndicator;
  final bool hideReadReceipts;
  final bool screenshotNotify;
  
  final DateTime createdAt;
  final DateTime updatedAt;

  ChatSecuritySettings({
    required this.id,
    required this.userId,
    required this.appLockEnabled,
    required this.lockTimeoutMinutes,
    required this.requireBiometric,
    required this.hideMessagePreviewLocked,
    required this.incognitoKeyboard,
    required this.screenshotProtection,
    required this.hideTypingIndicator,
    required this.hideReadReceipts,
    required this.screenshotNotify,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ChatSecuritySettings.empty(String userId) {
    return ChatSecuritySettings(
      id: '',
      userId: userId,
      appLockEnabled: false,
      lockTimeoutMinutes: 5,
      requireBiometric: false,
      hideMessagePreviewLocked: true,
      incognitoKeyboard: false,
      screenshotProtection: false,
      hideTypingIndicator: false,
      hideReadReceipts: false,
      screenshotNotify: false,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  factory ChatSecuritySettings.fromJson(Map<String, dynamic> json) {
    return ChatSecuritySettings(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      appLockEnabled: json['app_lock_enabled'] as bool? ?? false,
      lockTimeoutMinutes: json['lock_timeout_minutes'] as int? ?? 5,
      requireBiometric: json['require_biometric'] as bool? ?? false,
      hideMessagePreviewLocked:
          json['hide_message_preview_locked'] as bool? ?? true,
      incognitoKeyboard: json['incognito_keyboard'] as bool? ?? false,
      screenshotProtection: json['screenshot_protection'] as bool? ?? false,
      hideTypingIndicator: json['hide_typing_indicator'] as bool? ?? false,
      hideReadReceipts: json['hide_read_receipts'] as bool? ?? false,
      screenshotNotify: json['screenshot_notify'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'user_id': userId,
        'app_lock_enabled': appLockEnabled,
        'lock_timeout_minutes': lockTimeoutMinutes,
        'require_biometric': requireBiometric,
        'hide_message_preview_locked': hideMessagePreviewLocked,
        'incognito_keyboard': incognitoKeyboard,
        'screenshot_protection': screenshotProtection,
        'hide_typing_indicator': hideTypingIndicator,
        'hide_read_receipts': hideReadReceipts,
        'screenshot_notify': screenshotNotify,
      };

  ChatSecuritySettings copyWith({
    bool? appLockEnabled,
    int? lockTimeoutMinutes,
    bool? requireBiometric,
    bool? hideMessagePreviewLocked,
    bool? incognitoKeyboard,
    bool? screenshotProtection,
    bool? hideTypingIndicator,
    bool? hideReadReceipts,
    bool? screenshotNotify,
  }) {
    return ChatSecuritySettings(
      id: id,
      userId: userId,
      appLockEnabled: appLockEnabled ?? this.appLockEnabled,
      lockTimeoutMinutes: lockTimeoutMinutes ?? this.lockTimeoutMinutes,
      requireBiometric: requireBiometric ?? this.requireBiometric,
      hideMessagePreviewLocked:
          hideMessagePreviewLocked ?? this.hideMessagePreviewLocked,
      incognitoKeyboard: incognitoKeyboard ?? this.incognitoKeyboard,
      screenshotProtection: screenshotProtection ?? this.screenshotProtection,
      hideTypingIndicator: hideTypingIndicator ?? this.hideTypingIndicator,
      hideReadReceipts: hideReadReceipts ?? this.hideReadReceipts,
      screenshotNotify: screenshotNotify ?? this.screenshotNotify,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }

  String get lockTimeoutLabel {
    if (lockTimeoutMinutes <= 0) return 'Immediately';
    if (lockTimeoutMinutes == 1) return '1 minute';
    if (lockTimeoutMinutes < 60) return '$lockTimeoutMinutes minutes';
    return '${lockTimeoutMinutes ~/ 60} hour${lockTimeoutMinutes >= 120 ? 's' : ''}';
  }

  static const List<int> presetTimeouts = [0, 1, 5, 15, 30, 60];
}
