import 'dart:async';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/chat_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/result.dart';

/// Scheduled Message Service
/// Manages creation, editing, and delivery of scheduled messages
class ScheduledMessageService extends BaseService {
  static ScheduledMessageService? _instance;
  static ScheduledMessageService get instance => _instance ??= ScheduledMessageService._();
  ScheduledMessageService._();

  @override
  String get tag => 'ScheduledMessage';

  StreamSubscription? _realtimeSubscription;
  final List<void Function(List<ScheduledMessage>)> _listeners = [];

  /// Add listener for scheduled message updates
  void addListener(void Function(List<ScheduledMessage>) listener) {
    _listeners.add(listener);
  }

  /// Remove listener
  void removeListener(void Function(List<ScheduledMessage>) listener) {
    _listeners.remove(listener);
  }

  void _notifyListeners(List<ScheduledMessage> messages) {
    for (final listener in _listeners) {
      listener(messages);
    }
  }

  /// Subscribe to scheduled message updates
  void subscribeToUpdates() {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    _realtimeSubscription?.cancel();
    _realtimeSubscription = SupabaseConfig.client
        .from('scheduled_messages')
        .stream(primaryKey: ['id'])
        .eq('sender_id', userId)
        .listen((data) {
          final messages = data.map((e) => ScheduledMessage.fromJson(e)).toList();
          _notifyListeners(messages);
        });
    
    logDebug('Subscribed to realtime updates');
  }

  /// Get all scheduled messages for current user
  Future<Result<List<ScheduledMessage>>> getScheduledMessages({
    String? channelId,
    ScheduledMessageStatus? status,
  }) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return <ScheduledMessage>[];

    var query = SupabaseConfig.client
        .from('scheduled_messages')
        .select()
        .eq('sender_id', userId);

    if (channelId != null) {
      query = query.eq('channel_id', channelId);
    }

    if (status != null) {
      query = query.eq('status', status.name);
    }

    final response = await query.order('scheduled_for', ascending: true);
    final messages = (response as List)
        .map((e) => ScheduledMessage.fromJson(e))
        .toList();
    
    logDbOperation('SELECT', 'scheduled_messages', rowCount: messages.length);
    return messages;
  }, operationName: 'getScheduledMessages');

  /// Get pending scheduled messages count
  Future<Result<int>> getPendingCount({String? channelId}) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return 0;

    var query = SupabaseConfig.client
        .from('scheduled_messages')
        .select('id')
        .eq('sender_id', userId)
        .eq('status', 'pending');

    if (channelId != null) {
      query = query.eq('channel_id', channelId);
    }

    final response = await query;
    return (response as List).length;
  }, operationName: 'getPendingCount');

  /// Schedule a new message
  Future<Result<ScheduledMessage?>> scheduleMessage({
    required String channelId,
    required String content,
    required DateTime scheduledFor,
    Map<String, dynamic>? attachments,
  }) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) {
      logWarning('No user logged in');
      return null;
    }

    // Validate scheduled time is in the future
    if (scheduledFor.isBefore(DateTime.now())) {
      logWarning('Scheduled time must be in the future');
      return null;
    }

    final response = await SupabaseConfig.client
        .from('scheduled_messages')
        .insert({
          'channel_id': channelId,
          'sender_id': userId,
          'content': content,
          'attachments': attachments,
          'scheduled_for': scheduledFor.toUtc().toIso8601String(),
          'status': 'pending',
        })
        .select()
        .single();

    logDbOperation('INSERT', 'scheduled_messages', rowCount: 1);
    logInfo('Message scheduled', metadata: {'scheduledFor': scheduledFor.toIso8601String()});
    return ScheduledMessage.fromJson(response);
  }, operationName: 'scheduleMessage');

  /// Update a scheduled message
  Future<Result<ScheduledMessage?>> updateScheduledMessage({
    required String messageId,
    String? content,
    DateTime? scheduledFor,
    Map<String, dynamic>? attachments,
  }) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return null;

    final updates = <String, dynamic>{};
    if (content != null) updates['content'] = content;
    if (scheduledFor != null) {
      if (scheduledFor.isBefore(DateTime.now())) {
        logWarning('Scheduled time must be in the future');
        return null;
      }
      updates['scheduled_for'] = scheduledFor.toUtc().toIso8601String();
    }
    if (attachments != null) updates['attachments'] = attachments;

    if (updates.isEmpty) return null;

    final response = await SupabaseConfig.client
        .from('scheduled_messages')
        .update(updates)
        .eq('id', messageId)
        .eq('sender_id', userId)
        .eq('status', 'pending')
        .select()
        .single();

    logDbOperation('UPDATE', 'scheduled_messages', rowCount: 1);
    logInfo('Message updated', metadata: {'messageId': messageId});
    return ScheduledMessage.fromJson(response);
  }, operationName: 'updateScheduledMessage');

  /// Cancel a scheduled message
  Future<Result<bool>> cancelScheduledMessage(String messageId) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return false;

    await SupabaseConfig.client
        .from('scheduled_messages')
        .update({'status': 'cancelled'})
        .eq('id', messageId)
        .eq('sender_id', userId)
        .eq('status', 'pending');

    logDbOperation('UPDATE', 'scheduled_messages', rowCount: 1);
    logInfo('Message cancelled', metadata: {'messageId': messageId});
    return true;
  }, operationName: 'cancelScheduledMessage');

  /// Delete a scheduled message
  Future<Result<bool>> deleteScheduledMessage(String messageId) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return false;

    await SupabaseConfig.client
        .from('scheduled_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', userId);

    logDbOperation('DELETE', 'scheduled_messages', rowCount: 1);
    logInfo('Message deleted', metadata: {'messageId': messageId});
    return true;
  }, operationName: 'deleteScheduledMessage');

  /// Send a scheduled message immediately
  Future<Result<bool>> sendNow(String messageId) => execute(() async {
    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return false;

    // Get the scheduled message
    final message = await SupabaseConfig.client
        .from('scheduled_messages')
        .select()
        .eq('id', messageId)
        .eq('sender_id', userId)
        .eq('status', 'pending')
        .single();

    final scheduled = ScheduledMessage.fromJson(message);

    // Send the actual message via ChatService
    final sendResult = await ChatService.instance.createMessage(
      channelId: scheduled.channelId,
      content: scheduled.content,
      attachments: _parseAttachments(scheduled.attachments),
    );

    if (sendResult.isFailure) {
      // Update status to failed with error message
      await SupabaseConfig.client
          .from('scheduled_messages')
          .update({
            'status': 'failed',
            'error_message': sendResult.errorMessage,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', messageId);

      logWarning('Scheduled message failed to send', metadata: {'messageId': messageId});
      return false;
    }

    // Mark as successfully sent
    await SupabaseConfig.client
        .from('scheduled_messages')
        .update({
          'status': 'sent',
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', messageId);

    logDbOperation('UPDATE', 'scheduled_messages', rowCount: 1);
    logInfo('Scheduled message sent', metadata: {'messageId': messageId});
    return true;
  }, operationName: 'sendNow');

  /// Parse attachments from JSON map
  List<MessageAttachment> _parseAttachments(Map<String, dynamic>? attachmentsJson) {
    if (attachmentsJson == null || attachmentsJson.isEmpty) {
      return const [];
    }

    try {
      if (attachmentsJson.containsKey('items')) {
        final items = attachmentsJson['items'] as List?;
        if (items != null) {
          return items
              .map((a) => MessageAttachment.fromJson(a as Map<String, dynamic>))
              .toList();
        }
      }
      return const [];
    } catch (e) {
      logWarning('Failed to parse attachments', error: e);
      return const [];
    }
  }

  /// Get time presets for scheduling
  static List<SchedulePreset> getPresets() {
    final now = DateTime.now();
    
    return [
      SchedulePreset(
        label: 'Later Today',
        description: 'In 2 hours',
        time: now.add(const Duration(hours: 2)),
      ),
      SchedulePreset(
        label: 'This Evening',
        description: '6:00 PM',
        time: DateTime(now.year, now.month, now.day, 18, 0),
      ),
      SchedulePreset(
        label: 'Tomorrow Morning',
        description: '9:00 AM',
        time: DateTime(now.year, now.month, now.day + 1, 9, 0),
      ),
      SchedulePreset(
        label: 'Tomorrow Afternoon',
        description: '2:00 PM',
        time: DateTime(now.year, now.month, now.day + 1, 14, 0),
      ),
      SchedulePreset(
        label: 'Next Week',
        description: 'Monday 9:00 AM',
        time: _getNextMonday(now),
      ),
    ];
  }

  static DateTime _getNextMonday(DateTime from) {
    var daysUntilMonday = DateTime.monday - from.weekday;
    if (daysUntilMonday <= 0) daysUntilMonday += 7;
    return DateTime(from.year, from.month, from.day + daysUntilMonday, 9, 0);
  }

  /// Dispose resources
  void dispose() {
    _realtimeSubscription?.cancel();
    _realtimeSubscription = null;
    _listeners.clear();
  }
}

/// Scheduled message model
class ScheduledMessage {
  final String id;
  final String channelId;
  final String senderId;
  final String content;
  final Map<String, dynamic>? attachments;
  final DateTime scheduledFor;
  final ScheduledMessageStatus status;
  final String? errorMessage;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ScheduledMessage({
    required this.id,
    required this.channelId,
    required this.senderId,
    required this.content,
    this.attachments,
    required this.scheduledFor,
    required this.status,
    this.errorMessage,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ScheduledMessage.fromJson(Map<String, dynamic> json) {
    return ScheduledMessage(
      id: json['id'] as String,
      channelId: json['channel_id'] as String,
      senderId: json['sender_id'] as String,
      content: json['content'] as String,
      attachments: json['attachments'] as Map<String, dynamic>?,
      scheduledFor: DateTime.parse(json['scheduled_for'] as String),
      status: ScheduledMessageStatus.fromString(json['status'] as String?),
      errorMessage: json['error_message'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  bool get isPending => status == ScheduledMessageStatus.pending;
  bool get isSent => status == ScheduledMessageStatus.sent;
  bool get isCancelled => status == ScheduledMessageStatus.cancelled;
  bool get isFailed => status == ScheduledMessageStatus.failed;

  Duration get timeUntilSend => scheduledFor.difference(DateTime.now());
  bool get isOverdue => scheduledFor.isBefore(DateTime.now()) && isPending;
}

enum ScheduledMessageStatus {
  pending,
  sent,
  cancelled,
  failed;

  static ScheduledMessageStatus fromString(String? value) {
    switch (value) {
      case 'pending': return ScheduledMessageStatus.pending;
      case 'sent': return ScheduledMessageStatus.sent;
      case 'cancelled': return ScheduledMessageStatus.cancelled;
      case 'failed': return ScheduledMessageStatus.failed;
      default: return ScheduledMessageStatus.pending;
    }
  }
}

/// Schedule preset for quick selection
class SchedulePreset {
  final String label;
  final String description;
  final DateTime time;

  const SchedulePreset({
    required this.label,
    required this.description,
    required this.time,
  });

  bool get isValid => time.isAfter(DateTime.now());
}
