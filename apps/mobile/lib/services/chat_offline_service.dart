import 'package:flutter/foundation.dart' show VoidCallback;
import 'package:uuid/uuid.dart';
import 'package:thittam1hub/services/connectivity_service.dart';
import 'package:thittam1hub/services/offline_action_queue.dart';
import 'package:thittam1hub/services/e2e_encryption_service.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/models/encryption_models.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/models/models.dart';

/// Result type for chat operations with offline support
class ChatResult<T> {
  final T? data;
  final bool success;
  final bool queued;
  final String? error;
  final String? pendingId;

  const ChatResult._({
    this.data,
    required this.success,
    this.queued = false,
    this.error,
    this.pendingId,
  });

  factory ChatResult.success(T data) => ChatResult._(data: data, success: true);
  factory ChatResult.queued(String pendingId) => ChatResult._(success: true, queued: true, pendingId: pendingId);
  factory ChatResult.failure(String error) => ChatResult._(success: false, error: error);

  bool get isQueued => queued;
  bool get isOnlineSuccess => success && !queued;
}

/// Represents a pending message in the optimistic UI
class PendingMessage {
  final String id;
  final String channelId;
  final String content;
  final String senderId;
  final String senderName;
  final String? senderAvatar;
  final DateTime sentAt;
  final PendingMessageStatus status;
  final String? error;
  // Encryption fields
  final bool isEncrypted;
  final String? encryptedContent;
  final String? nonce;
  final String? senderPublicKey;

  const PendingMessage({
    required this.id,
    required this.channelId,
    required this.content,
    required this.senderId,
    required this.senderName,
    this.senderAvatar,
    required this.sentAt,
    this.status = PendingMessageStatus.pending,
    this.error,
    this.isEncrypted = false,
    this.encryptedContent,
    this.nonce,
    this.senderPublicKey,
  });

  PendingMessage copyWith({
    PendingMessageStatus? status,
    String? error,
    bool? isEncrypted,
    String? encryptedContent,
    String? nonce,
    String? senderPublicKey,
  }) {
    return PendingMessage(
      id: id,
      channelId: channelId,
      content: content,
      senderId: senderId,
      senderName: senderName,
      senderAvatar: senderAvatar,
      sentAt: sentAt,
      status: status ?? this.status,
      error: error ?? this.error,
      isEncrypted: isEncrypted ?? this.isEncrypted,
      encryptedContent: encryptedContent ?? this.encryptedContent,
      nonce: nonce ?? this.nonce,
      senderPublicKey: senderPublicKey ?? this.senderPublicKey,
    );
  }

  Message toOptimisticMessage() {
    return Message(
      id: id,
      channelId: channelId,
      senderId: senderId,
      senderName: senderName,
      senderAvatar: senderAvatar,
      content: content, // Always show plaintext in UI
      sentAt: sentAt,
      attachments: [],
      isEncrypted: isEncrypted,
      nonce: nonce,
      senderPublicKey: senderPublicKey,
    );
  }
}

enum PendingMessageStatus {
  pending,
  sending,
  queued,
  failed,
  sent,
}

/// Service for handling chat operations with offline support
/// Provides optimistic UI updates and automatic retry via OfflineActionQueue
class ChatOfflineService {
  static const String _tag = 'ChatOfflineService';
  static final LoggingService _log = LoggingService.instance;

  static ChatOfflineService? _instance;
  static ChatOfflineService get instance => _instance ??= ChatOfflineService._();
  ChatOfflineService._();

  final _uuid = const Uuid();
  final _queue = OfflineActionQueue.instance;
  final _connectivity = ConnectivityService.instance;

  // Pending messages for optimistic UI
  final Map<String, PendingMessage> _pendingMessages = {};
  final List<VoidCallback> _listeners = [];

  /// Get pending messages for a channel
  List<PendingMessage> getPendingMessages(String channelId) {
    return _pendingMessages.values
        .where((m) => m.channelId == channelId)
        .toList()
      ..sort((a, b) => a.sentAt.compareTo(b.sentAt));
  }

  /// Check if a message ID is pending
  bool isPending(String messageId) => _pendingMessages.containsKey(messageId);

  /// Get status of a pending message
  PendingMessageStatus? getMessageStatus(String messageId) {
    return _pendingMessages[messageId]?.status;
  }

  /// Add listener for pending message changes
  void addListener(VoidCallback callback) {
    _listeners.add(callback);
  }

  /// Remove listener
  void removeListener(VoidCallback callback) {
    _listeners.remove(callback);
  }

  void _notifyListeners() {
    for (final listener in List.from(_listeners)) {
      try {
        listener();
      } catch (e) {
        _log.error('Listener error', tag: _tag, error: e);
      }
    }
  }

  /// Send a message with offline support
  /// Returns immediately with optimistic result, queues if offline
  Future<ChatResult<PendingMessage>> sendMessage({
    required String channelId,
    required String content,
    List<MessageAttachment> attachments = const [],
  }) async {
    final user = SupabaseConfig.auth.currentUser;
    if (user == null) {
      return ChatResult.failure('Not authenticated');
    }

    // Get sender info
    String senderName = user.email?.split('@').first ?? 'You';
    String? senderAvatar;
    
    try {
      final profile = await SupabaseConfig.client
          .from('user_profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
      if (profile != null) {
        senderName = (profile['full_name'] as String?)?.trim().isNotEmpty == true
            ? profile['full_name'] as String
            : senderName;
        senderAvatar = profile['avatar_url'] as String?;
      }
    } catch (e) {
      _log.warning('Profile lookup error', tag: _tag, error: e);
    }

    final pendingId = _uuid.v4();
    final sentAt = DateTime.now();

    // Create pending message for optimistic UI
    final pending = PendingMessage(
      id: pendingId,
      channelId: channelId,
      content: content,
      senderId: user.id,
      senderName: senderName,
      senderAvatar: senderAvatar,
      sentAt: sentAt,
      status: PendingMessageStatus.pending,
    );

    _pendingMessages[pendingId] = pending;
    _notifyListeners();

    // Check connectivity
    if (!_connectivity.isOnline) {
      // Queue for later sync
      await _queueMessage(
        pendingId: pendingId,
        channelId: channelId,
        content: content,
        senderName: senderName,
        senderAvatar: senderAvatar,
        sentAt: sentAt,
        attachments: attachments,
      );
      
      _pendingMessages[pendingId] = pending.copyWith(status: PendingMessageStatus.queued);
      _notifyListeners();
      
      _log.debug('Message queued offline', tag: _tag, metadata: {'pendingId': pendingId});
      return ChatResult.queued(pendingId);
    }

    // Try to send online
    _pendingMessages[pendingId] = pending.copyWith(status: PendingMessageStatus.sending);
    _notifyListeners();

    try {
      final data = {
        'channel_id': channelId,
        'sender_id': user.id,
        'sender_name': senderName,
        'sender_avatar': senderAvatar,
        'content': content,
        'attachments': attachments.map((a) => a.toJson()).toList(),
        'sent_at': sentAt.toIso8601String(),
      };

      await SupabaseConfig.client.from('messages').insert(data);
      
      // Success - remove from pending
      _pendingMessages.remove(pendingId);
      _notifyListeners();
      
      _log.info('Message sent', tag: _tag, metadata: {'pendingId': pendingId});
      return ChatResult.success(pending.copyWith(status: PendingMessageStatus.sent));
    } catch (e) {
      _log.error('Message send failed', tag: _tag, error: e);
      
      // Queue for retry
      await _queueMessage(
        pendingId: pendingId,
        channelId: channelId,
        content: content,
        senderName: senderName,
        senderAvatar: senderAvatar,
        sentAt: sentAt,
        attachments: attachments,
      );
      
      _pendingMessages[pendingId] = pending.copyWith(
        status: PendingMessageStatus.queued,
        error: _getUserFriendlyError(e),
      );
      _notifyListeners();
      
      return ChatResult.queued(pendingId);
    }
  }

  /// Send an encrypted message with offline support
  /// Encrypts content before sending, stores plaintext locally for optimistic UI
  Future<ChatResult<PendingMessage>> sendEncryptedMessage({
    required String channelId,
    required String recipientUserId,
    required String content,
    List<MessageAttachment> attachments = const [],
  }) async {
    final user = SupabaseConfig.auth.currentUser;
    if (user == null) {
      return ChatResult.failure('Not authenticated');
    }

    final encryption = E2EEncryptionService.instance;
    
    // Check if encryption is available
    if (!await encryption.hasKeyPair()) {
      _log.debug('No encryption keys, falling back to unencrypted', tag: _tag);
      return sendMessage(channelId: channelId, content: content, attachments: attachments);
    }

    // Get sender info
    String senderName = user.email?.split('@').first ?? 'You';
    String? senderAvatar;
    
    try {
      final profile = await SupabaseConfig.client
          .from('user_profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
      if (profile != null) {
        senderName = (profile['full_name'] as String?)?.trim().isNotEmpty == true
            ? profile['full_name'] as String
            : senderName;
        senderAvatar = profile['avatar_url'] as String?;
      }
    } catch (e) {
      _log.warning('Profile lookup error', tag: _tag, error: e);
    }

    final pendingId = _uuid.v4();
    final sentAt = DateTime.now();

    // Encrypt the message
    final encryptResult = await encryption.encryptMessage(content, recipientUserId);
    if (!encryptResult.success) {
      _log.warning('Encryption failed, falling back', tag: _tag, error: encryptResult.error);
      // Fall back to unencrypted
      return sendMessage(channelId: channelId, content: content, attachments: attachments);
    }

    final encrypted = encryptResult.data!;

    // Create pending message with plaintext for UI, but encrypted for sending
    final pending = PendingMessage(
      id: pendingId,
      channelId: channelId,
      content: content, // Plaintext for local display
      senderId: user.id,
      senderName: senderName,
      senderAvatar: senderAvatar,
      sentAt: sentAt,
      status: PendingMessageStatus.pending,
      isEncrypted: true,
      encryptedContent: encrypted.ciphertext,
      nonce: encrypted.nonce,
      senderPublicKey: encrypted.senderPublicKey,
    );

    _pendingMessages[pendingId] = pending;
    _notifyListeners();

    // Check connectivity
    if (!_connectivity.isOnline) {
      await _queueEncryptedMessage(
        pendingId: pendingId,
        channelId: channelId,
        encryptedContent: encrypted.ciphertext,
        nonce: encrypted.nonce,
        senderPublicKey: encrypted.senderPublicKey,
        senderName: senderName,
        senderAvatar: senderAvatar,
        sentAt: sentAt,
        attachments: attachments,
      );
      
      _pendingMessages[pendingId] = pending.copyWith(status: PendingMessageStatus.queued);
      _notifyListeners();
      
      _log.debug('Encrypted message queued offline', tag: _tag, metadata: {'pendingId': pendingId});
      return ChatResult.queued(pendingId);
    }

    // Try to send online
    _pendingMessages[pendingId] = pending.copyWith(status: PendingMessageStatus.sending);
    _notifyListeners();

    try {
      final data = {
        'channel_id': channelId,
        'sender_id': user.id,
        'sender_name': senderName,
        'sender_avatar': senderAvatar,
        'content': encrypted.ciphertext,
        'attachments': attachments.map((a) => a.toJson()).toList(),
        'sent_at': sentAt.toIso8601String(),
        'is_encrypted': true,
        'encryption_version': encrypted.encryptionVersion,
        'sender_public_key': encrypted.senderPublicKey,
        'nonce': encrypted.nonce,
      };

      await SupabaseConfig.client.from('messages').insert(data);
      
      _pendingMessages.remove(pendingId);
      _notifyListeners();
      
      _log.info('Encrypted message sent', tag: _tag, metadata: {'pendingId': pendingId});
      return ChatResult.success(pending.copyWith(status: PendingMessageStatus.sent));
    } catch (e) {
      _log.error('Encrypted message send failed', tag: _tag, error: e);
      
      await _queueEncryptedMessage(
        pendingId: pendingId,
        channelId: channelId,
        encryptedContent: encrypted.ciphertext,
        nonce: encrypted.nonce,
        senderPublicKey: encrypted.senderPublicKey,
        senderName: senderName,
        senderAvatar: senderAvatar,
        sentAt: sentAt,
        attachments: attachments,
      );
      
      _pendingMessages[pendingId] = pending.copyWith(
        status: PendingMessageStatus.queued,
        error: _getUserFriendlyError(e),
      );
      _notifyListeners();
      
      return ChatResult.queued(pendingId);
    }
  }

  /// Send a group message with offline support
  Future<ChatResult<PendingMessage>> sendGroupMessage({
    required String groupId,
    required String content,
    Map<String, dynamic>? attachments,
  }) async {
    final user = SupabaseConfig.auth.currentUser;
    if (user == null) {
      return ChatResult.failure('Not authenticated');
    }

    final channelId = 'group:$groupId';
    
    // Get sender info
    String senderName = user.email?.split('@').first ?? 'You';
    String? senderAvatar;
    
    try {
      final profile = await SupabaseConfig.client
          .from('user_profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
      if (profile != null) {
        senderName = (profile['full_name'] as String?)?.trim().isNotEmpty == true
            ? profile['full_name'] as String
            : senderName;
        senderAvatar = profile['avatar_url'] as String?;
      }
    } catch (e) {
      _log.warning('Profile lookup error', tag: _tag, error: e);
    }

    final pendingId = _uuid.v4();
    final sentAt = DateTime.now();

    // Create pending message for optimistic UI
    final pending = PendingMessage(
      id: pendingId,
      channelId: channelId,
      content: content,
      senderId: user.id,
      senderName: senderName,
      senderAvatar: senderAvatar,
      sentAt: sentAt,
      status: PendingMessageStatus.pending,
    );

    _pendingMessages[pendingId] = pending;
    _notifyListeners();

    // Check connectivity
    if (!_connectivity.isOnline) {
      await _queueGroupMessage(
        pendingId: pendingId,
        groupId: groupId,
        content: content,
        senderName: senderName,
        senderAvatar: senderAvatar,
        sentAt: sentAt,
        attachments: attachments,
      );
      
      _pendingMessages[pendingId] = pending.copyWith(status: PendingMessageStatus.queued);
      _notifyListeners();
      
      _log.debug('Group message queued offline', tag: _tag, metadata: {'pendingId': pendingId});
      return ChatResult.queued(pendingId);
    }

    // Try to send online
    _pendingMessages[pendingId] = pending.copyWith(status: PendingMessageStatus.sending);
    _notifyListeners();

    try {
      await SupabaseConfig.client.from('messages').insert({
        'channel_id': channelId,
        'sender_id': user.id,
        'sender_name': senderName,
        'sender_avatar': senderAvatar,
        'content': content,
        'attachments': attachments,
        'sent_at': sentAt.toIso8601String(),
      });

      // Update group's updated_at timestamp
      await SupabaseConfig.client
          .from('chat_groups')
          .update({'updated_at': DateTime.now().toIso8601String()})
          .eq('id', groupId);

      // Success - remove from pending
      _pendingMessages.remove(pendingId);
      _notifyListeners();
      
      _log.info('Group message sent', tag: _tag, metadata: {'pendingId': pendingId});
      return ChatResult.success(pending.copyWith(status: PendingMessageStatus.sent));
    } catch (e) {
      _log.error('Group message send failed', tag: _tag, error: e);
      
      await _queueGroupMessage(
        pendingId: pendingId,
        groupId: groupId,
        content: content,
        senderName: senderName,
        senderAvatar: senderAvatar,
        sentAt: sentAt,
        attachments: attachments,
      );
      
      _pendingMessages[pendingId] = pending.copyWith(
        status: PendingMessageStatus.queued,
        error: _getUserFriendlyError(e),
      );
      _notifyListeners();
      
      return ChatResult.queued(pendingId);
    }
  }

  /// Add reaction with offline support
  Future<ChatResult<void>> addReaction({
    required String messageId,
    required String emoji,
  }) async {
    final user = SupabaseConfig.auth.currentUser;
    if (user == null) {
      return ChatResult.failure('Not authenticated');
    }

    if (!_connectivity.isOnline) {
      final actionId = _uuid.v4();
      await _queue.enqueue(OfflineAction(
        id: actionId,
        type: OfflineActionType.addReaction,
        payload: {
          'messageId': messageId,
          'emoji': emoji,
        },
        createdAt: DateTime.now(),
      ));
      return ChatResult.queued(actionId);
    }

    try {
      await SupabaseConfig.client.from('message_reactions').upsert({
        'message_id': messageId,
        'user_id': user.id,
        'emoji': emoji,
      });
      return ChatResult.success(null);
    } catch (e) {
      // Queue for retry
      final actionId = _uuid.v4();
      await _queue.enqueue(OfflineAction(
        id: actionId,
        type: OfflineActionType.addReaction,
        payload: {
          'messageId': messageId,
          'emoji': emoji,
        },
        createdAt: DateTime.now(),
      ));
      return ChatResult.queued(actionId);
    }
  }

  /// Remove reaction with offline support
  Future<ChatResult<void>> removeReaction({
    required String messageId,
    required String emoji,
  }) async {
    final user = SupabaseConfig.auth.currentUser;
    if (user == null) {
      return ChatResult.failure('Not authenticated');
    }

    if (!_connectivity.isOnline) {
      final actionId = _uuid.v4();
      await _queue.enqueue(OfflineAction(
        id: actionId,
        type: OfflineActionType.removeReaction,
        payload: {
          'messageId': messageId,
          'emoji': emoji,
        },
        createdAt: DateTime.now(),
      ));
      return ChatResult.queued(actionId);
    }

    try {
      await SupabaseConfig.client
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
      return ChatResult.success(null);
    } catch (e) {
      final actionId = _uuid.v4();
      await _queue.enqueue(OfflineAction(
        id: actionId,
        type: OfflineActionType.removeReaction,
        payload: {
          'messageId': messageId,
          'emoji': emoji,
        },
        createdAt: DateTime.now(),
      ));
      return ChatResult.queued(actionId);
    }
  }

  /// Retry a failed message
  Future<void> retryMessage(String pendingId) async {
    final pending = _pendingMessages[pendingId];
    if (pending == null) return;

    // Cancel from queue and re-send
    await _queue.cancelAction(pendingId);
    _pendingMessages.remove(pendingId);
    _notifyListeners();

    // Re-send based on channel type
    if (pending.channelId.startsWith('group:')) {
      final groupId = pending.channelId.replaceFirst('group:', '');
      await sendGroupMessage(
        groupId: groupId,
        content: pending.content,
      );
    } else {
      await sendMessage(
        channelId: pending.channelId,
        content: pending.content,
      );
    }
  }

  /// Cancel a pending message
  Future<void> cancelMessage(String pendingId) async {
    await _queue.cancelAction(pendingId);
    _pendingMessages.remove(pendingId);
    _notifyListeners();
    _log.debug('Message cancelled', tag: _tag, metadata: {'pendingId': pendingId});
  }

  /// Clear pending message after successful sync
  void onMessageSynced(String pendingId) {
    _pendingMessages.remove(pendingId);
    _notifyListeners();
  }

  Future<void> _queueMessage({
    required String pendingId,
    required String channelId,
    required String content,
    required String senderName,
    String? senderAvatar,
    required DateTime sentAt,
    List<MessageAttachment> attachments = const [],
  }) async {
    await _queue.enqueue(OfflineAction(
      id: pendingId,
      type: OfflineActionType.sendMessage,
      payload: {
        'channelId': channelId,
        'content': content,
        'senderName': senderName,
        'senderAvatar': senderAvatar,
        'sentAt': sentAt.toIso8601String(),
        'attachments': attachments.map((a) => a.toJson()).toList(),
      },
      createdAt: DateTime.now(),
    ));
  }

  Future<void> _queueGroupMessage({
    required String pendingId,
    required String groupId,
    required String content,
    required String senderName,
    String? senderAvatar,
    required DateTime sentAt,
    Map<String, dynamic>? attachments,
  }) async {
    await _queue.enqueue(OfflineAction(
      id: pendingId,
      type: OfflineActionType.sendGroupMessage,
      payload: {
        'groupId': groupId,
        'content': content,
        'senderName': senderName,
        'senderAvatar': senderAvatar,
        'sentAt': sentAt.toIso8601String(),
        'attachments': attachments,
      },
      createdAt: DateTime.now(),
    ));
  }

  Future<void> _queueEncryptedMessage({
    required String pendingId,
    required String channelId,
    required String encryptedContent,
    required String nonce,
    required String senderPublicKey,
    required String senderName,
    String? senderAvatar,
    required DateTime sentAt,
    List<MessageAttachment> attachments = const [],
  }) async {
    await _queue.enqueue(OfflineAction(
      id: pendingId,
      type: OfflineActionType.sendMessage, // Same type, but encrypted payload
      payload: {
        'channelId': channelId,
        'content': encryptedContent,
        'senderName': senderName,
        'senderAvatar': senderAvatar,
        'sentAt': sentAt.toIso8601String(),
        'attachments': attachments.map((a) => a.toJson()).toList(),
        'is_encrypted': true,
        'encryption_version': 1,
        'sender_public_key': senderPublicKey,
        'nonce': nonce,
      },
      createdAt: DateTime.now(),
    ));
  }

  String _getUserFriendlyError(dynamic error) {
    final errorStr = error.toString().toLowerCase();
    
    if (errorStr.contains('network') || errorStr.contains('socket') || errorStr.contains('connection')) {
      return 'Network error. Will retry when connected.';
    }
    if (errorStr.contains('timeout')) {
      return 'Request timed out. Will retry shortly.';
    }
    if (errorStr.contains('auth') || errorStr.contains('permission')) {
      return 'Authentication error. Please sign in again.';
    }
    
    return 'Failed to send. Will retry automatically.';
  }

  void dispose() {
    _pendingMessages.clear();
    _listeners.clear();
  }
}
