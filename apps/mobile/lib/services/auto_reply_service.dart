import 'dart:async';
import 'package:flutter/material.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/chat_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';

/// Auto Reply Service
/// Manages automatic away messages with rate limiting and scheduling
class AutoReplyService extends BaseService {
  static AutoReplyService? _instance;
  static AutoReplyService get instance => _instance ??= AutoReplyService._();
  AutoReplyService._();

  @override
  String get tag => 'AutoReply';

  AutoReplySettings? _settings;
  bool _isInitialized = false;

  /// Get current settings
  AutoReplySettings? get settings => _settings;

  /// Check if auto-reply is currently active
  bool get isActive {
    if (_settings == null || !_settings!.enabled) return false;
    return _settings!.isCurrentlyActive;
  }

  /// Initialize service and load settings
  Future<Result<void>> initialize() => execute(() async {
    if (_isInitialized) return;

    await _loadSettingsInternal();
    _isInitialized = true;
    logInfo('Initialized - active: $isActive');
  }, operationName: 'initialize');

  /// Load settings from database (internal)
  Future<void> _loadSettingsInternal() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    final response = await SupabaseConfig.client
        .from('auto_reply_settings')
        .select()
        .eq('user_id', userId)
        .limit(1);

    if ((response as List).isNotEmpty) {
      _settings = AutoReplySettings.fromJson(response[0]);
    }
    logDbOperation('SELECT', 'auto_reply_settings', rowCount: response.length);
  }

  /// Load settings from database
  Future<Result<void>> loadSettings() => execute(() async {
    await _loadSettingsInternal();
  }, operationName: 'loadSettings');

  /// Update auto-reply settings
  Future<Result<bool>> updateSettings(AutoReplySettings newSettings) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return false;

    await SupabaseConfig.client.from('auto_reply_settings').upsert({
      'user_id': userId,
      'enabled': newSettings.enabled,
      'message': newSettings.message,
      'schedule_start': newSettings.scheduleStart?.format24h(),
      'schedule_end': newSettings.scheduleEnd?.format24h(),
      'active_days': newSettings.activeDays,
      'exclude_contacts': newSettings.excludeContacts,
      'rate_limit_minutes': newSettings.rateLimitMinutes,
    }, onConflict: 'user_id');

    _settings = newSettings;
    logDbOperation('UPSERT', 'auto_reply_settings');
    logInfo('Settings updated - enabled: ${newSettings.enabled}');
    return true;
  }, operationName: 'updateSettings');

  /// Enable auto-reply
  Future<Result<bool>> enable({
    required String message,
    TimeOfDay? scheduleStart,
    TimeOfDay? scheduleEnd,
    List<int>? activeDays,
  }) async {
    final newSettings = AutoReplySettings(
      enabled: true,
      message: message,
      scheduleStart: scheduleStart,
      scheduleEnd: scheduleEnd,
      activeDays: activeDays ?? [1, 2, 3, 4, 5, 6, 7],
      excludeContacts: _settings?.excludeContacts ?? [],
      rateLimitMinutes: _settings?.rateLimitMinutes ?? 60,
    );
    return updateSettings(newSettings);
  }

  /// Disable auto-reply
  Future<Result<bool>> disable() async {
    if (_settings == null) return const Success(true);
    return updateSettings(_settings!.copyWith(enabled: false));
  }

  /// Check if we should send auto-reply to a user
  Future<Result<bool>> shouldReply(String recipientId) => execute(() async {
    if (!isActive) return false;
    if (_settings == null) return false;

    // Check if recipient is excluded
    if (_settings!.excludeContacts.contains(recipientId)) {
      logDebug('Recipient is excluded');
      return false;
    }

    // Check rate limit
    final canReply = await _checkRateLimitInternal(recipientId);
    if (!canReply) {
      logDebug('Rate limited for recipient: $recipientId');
      return false;
    }

    return true;
  }, operationName: 'shouldReply');

  Future<bool> _checkRateLimitInternal(String recipientId) async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return false;

    final cutoff = DateTime.now().subtract(
      Duration(minutes: _settings?.rateLimitMinutes ?? 60),
    );

    final response = await SupabaseConfig.client
        .from('auto_reply_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('recipient_id', recipientId)
        .gte('sent_at', cutoff.toIso8601String())
        .limit(1);

    logDbOperation('SELECT', 'auto_reply_logs', rowCount: (response as List).length);
    return response.isEmpty;
  }

  /// Record that an auto-reply was sent
  Future<Result<void>> recordReply(String recipientId) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    await SupabaseConfig.client.from('auto_reply_logs').insert({
      'user_id': userId,
      'recipient_id': recipientId,
    });

    logDbOperation('INSERT', 'auto_reply_logs');
    logDebug('Reply recorded for: $recipientId');
  }, operationName: 'recordReply');

  /// Send auto-reply message
  Future<Result<bool>> sendAutoReply(String channelId, String recipientId) => execute(() async {
    final shouldReplyResult = await shouldReply(recipientId);
    if (shouldReplyResult is Failure || 
        (shouldReplyResult is Success<bool> && !shouldReplyResult.data)) {
      return false;
    }

    if (_settings == null || _settings!.message.isEmpty) {
      logWarning('No auto-reply message configured');
      return false;
    }

    // Send the actual auto-reply message via ChatService
    final sendResult = await ChatService.instance.createMessage(
      channelId: channelId,
      content: _settings!.message,
      attachments: const [],
    );

    if (sendResult.isFailure) {
      logWarning('Failed to send auto-reply', error: sendResult.errorMessage);
      return false;
    }

    // Record that we sent a reply (for rate limiting)
    await recordReply(recipientId);
    logInfo('Auto-reply sent', metadata: {
      'channelId': channelId,
      'recipientId': recipientId,
    });
    return true;
  }, operationName: 'sendAutoReply');

  /// Add contact to exclude list
  Future<Result<bool>> excludeContact(String contactId) async {
    if (_settings == null) return const Success(false);

    final updatedExcludes = [..._settings!.excludeContacts, contactId];
    return updateSettings(_settings!.copyWith(excludeContacts: updatedExcludes));
  }

  /// Remove contact from exclude list
  Future<Result<bool>> includeContact(String contactId) async {
    if (_settings == null) return const Success(false);

    final updatedExcludes = _settings!.excludeContacts
        .where((id) => id != contactId)
        .toList();
    return updateSettings(_settings!.copyWith(excludeContacts: updatedExcludes));
  }

  /// Get predefined message templates
  static List<String> get messageTemplates => [
    "I'm currently unavailable and will respond as soon as possible.",
    "Thanks for your message! I'm away right now but will get back to you shortly.",
    "Hi! I'm not available at the moment. I'll reply when I'm back.",
    "I'm on vacation until [date]. I'll respond when I return.",
    "Thanks for reaching out! I'm in a meeting and will respond later.",
    "I'm currently outside of my working hours. I'll get back to you during business hours.",
  ];
}

/// Auto-reply settings model
class AutoReplySettings {
  final bool enabled;
  final String message;
  final TimeOfDay? scheduleStart;
  final TimeOfDay? scheduleEnd;
  final List<int> activeDays;
  final List<String> excludeContacts;
  final int rateLimitMinutes;

  const AutoReplySettings({
    required this.enabled,
    required this.message,
    this.scheduleStart,
    this.scheduleEnd,
    this.activeDays = const [1, 2, 3, 4, 5],
    this.excludeContacts = const [],
    this.rateLimitMinutes = 60,
  });

  factory AutoReplySettings.fromJson(Map<String, dynamic> json) {
    return AutoReplySettings(
      enabled: json['enabled'] as bool? ?? false,
      message: json['message'] as String? ?? 
          'I am currently unavailable and will respond as soon as possible.',
      scheduleStart: _parseTime(json['schedule_start'] as String?),
      scheduleEnd: _parseTime(json['schedule_end'] as String?),
      activeDays: (json['active_days'] as List?)?.cast<int>() ?? [1, 2, 3, 4, 5],
      excludeContacts: (json['exclude_contacts'] as List?)?.cast<String>() ?? [],
      rateLimitMinutes: json['rate_limit_minutes'] as int? ?? 60,
    );
  }

  static TimeOfDay? _parseTime(String? timeStr) {
    if (timeStr == null) return null;
    final parts = timeStr.split(':');
    if (parts.length < 2) return null;
    return TimeOfDay(
      hour: int.tryParse(parts[0]) ?? 0,
      minute: int.tryParse(parts[1]) ?? 0,
    );
  }

  bool get hasSchedule => scheduleStart != null && scheduleEnd != null;

  bool get isCurrentlyActive {
    if (!enabled) return false;

    final now = DateTime.now();
    
    // Check active days
    if (!activeDays.contains(now.weekday)) return false;

    // Check schedule if set
    if (hasSchedule) {
      final currentMinutes = now.hour * 60 + now.minute;
      final startMinutes = scheduleStart!.hour * 60 + scheduleStart!.minute;
      final endMinutes = scheduleEnd!.hour * 60 + scheduleEnd!.minute;

      if (startMinutes <= endMinutes) {
        // Same day schedule (e.g., 9:00 - 17:00)
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      } else {
        // Overnight schedule (e.g., 22:00 - 07:00)
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      }
    }

    return true;
  }

  AutoReplySettings copyWith({
    bool? enabled,
    String? message,
    TimeOfDay? scheduleStart,
    TimeOfDay? scheduleEnd,
    List<int>? activeDays,
    List<String>? excludeContacts,
    int? rateLimitMinutes,
  }) {
    return AutoReplySettings(
      enabled: enabled ?? this.enabled,
      message: message ?? this.message,
      scheduleStart: scheduleStart ?? this.scheduleStart,
      scheduleEnd: scheduleEnd ?? this.scheduleEnd,
      activeDays: activeDays ?? this.activeDays,
      excludeContacts: excludeContacts ?? this.excludeContacts,
      rateLimitMinutes: rateLimitMinutes ?? this.rateLimitMinutes,
    );
  }
}

extension on TimeOfDay {
  String format24h() => 
      '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';
}
