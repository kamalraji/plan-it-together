import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/models/enhanced_circle_message.dart';
import 'package:thittam1hub/models/circle_message_attachment.dart';
import 'package:thittam1hub/models/circle_message_reaction.dart';
import 'package:thittam1hub/supabase/circle_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/utils/logging_mixin.dart';
import 'package:thittam1hub/utils/result.dart';

/// Result of sending a message
sealed class CircleSendResult {}

class CircleSendSuccess extends CircleSendResult {
  final EnhancedCircleMessage message;
  CircleSendSuccess(this.message);
}

class CircleSendEmpty extends CircleSendResult {}

class CircleSendFailed extends CircleSendResult {
  final String error;
  CircleSendFailed(this.error);
}

/// Controller for Circle chat page
class CircleChatController extends ChangeNotifier with LoggingMixin {
  final String circleId;
  final CircleService _circleService = CircleService();

  @override
  String get tag => 'CircleChatController';

  // Message stream
  StreamController<List<EnhancedCircleMessage>>? _messagesController;
  Stream<List<EnhancedCircleMessage>>? _messageStream;
  StreamSubscription? _dbSubscription;

  // Reactions cache
  Map<String, List<GroupedCircleReaction>> reactions = {};

  // Reply state
  EnhancedCircleMessage? replyingTo;

  // Typing indicator
  final Set<String> _typingUsers = {};
  StreamSubscription? _typingSubscription;

  // State
  bool isLoading = true;
  bool canSendMessages = true;
  String? currentUserRole;
  Circle? circle;

  CircleChatController({required this.circleId}) {
    _initialize();
  }

  String? get currentUserId => SupabaseConfig.client.auth.currentUser?.id;

  Stream<List<EnhancedCircleMessage>> get messageStream {
    _messageStream ??= _createMessageStream();
    return _messageStream!;
  }

  Set<String> get typingUsers => _typingUsers;

  Stream<List<EnhancedCircleMessage>> _createMessageStream() {
    _messagesController = StreamController<List<EnhancedCircleMessage>>.broadcast();

    // Initial load
    _loadMessages();

    // Subscribe to realtime updates
    _subscribeToMessages();

    return _messagesController!.stream;
  }

  Future<void> _initialize() async {
    try {
      // Load circle details
      circle = await _circleService.getCircleById(circleId);

      // Check user role
      currentUserRole = await _circleService.getUserRole(circleId);

      // Check if user can send messages
      canSendMessages = currentUserRole != null;

      isLoading = false;
      notifyListeners();

      // Subscribe to typing indicators
      _subscribeToTyping();
    } catch (e) {
      logError('Failed to initialize chat controller', error: e);
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _loadMessages() async {
    try {
      final messages = await _circleService.getEnhancedMessages(circleId, limit: 50);
      
      // Load reactions for all messages
      await _loadReactions(messages.map((m) => m.id).toList());
      
      // Attach reactions to messages
      final enrichedMessages = messages.map((m) {
        return m.copyWith(reactions: reactions[m.id] ?? []);
      }).toList();
      
      _messagesController?.add(enrichedMessages);
    } catch (e) {
      logError('Failed to load messages', error: e);
    }
  }

  void _subscribeToMessages() {
    _dbSubscription?.cancel();
    _dbSubscription = SupabaseConfig.client
        .from('circle_messages')
        .stream(primaryKey: ['id'])
        .eq('circle_id', circleId)
        .order('created_at', ascending: true)
        .listen((data) {
      _loadMessages(); // Reload all messages to get proper enrichment
    });
  }

  void _subscribeToTyping() {
    // Use Supabase Realtime broadcast for typing indicators
    final channel = SupabaseConfig.client.channel('circle:$circleId:typing');
    
    channel.onBroadcast(
      event: 'typing',
      callback: (payload) {
        final userId = payload['user_id'] as String?;
        final isTyping = payload['is_typing'] as bool? ?? false;
        
        if (userId != null && userId != currentUserId) {
          if (isTyping) {
            _typingUsers.add(userId);
          } else {
            _typingUsers.remove(userId);
          }
          notifyListeners();
        }
      },
    );
    
    channel.subscribe();
  }

  Future<void> _loadReactions(List<String> messageIds) async {
    if (messageIds.isEmpty) return;
    
    try {
      final userId = currentUserId ?? '';
      final reactionData = await _circleService.getReactionsForMessages(messageIds);
      
      for (final messageId in messageIds) {
        final messageReactions = reactionData
            .where((r) => r.messageId == messageId)
            .toList();
        reactions[messageId] = GroupedCircleReaction.groupReactions(
          messageReactions,
          userId,
        );
      }
    } catch (e) {
      logWarning('Failed to load reactions', error: e);
    }
  }

  Future<CircleSendResult> sendMessage(
    String content, {
    List<CircleMessageAttachment>? attachments,
  }) async {
    final trimmed = content.trim();
    if (trimmed.isEmpty && (attachments == null || attachments.isEmpty)) {
      return CircleSendEmpty();
    }

    try {
      final message = await _circleService.sendEnhancedMessage(
        circleId,
        trimmed,
        attachments: attachments,
        replyToId: replyingTo?.id,
      );

      if (message != null) {
        replyingTo = null;
        notifyListeners();
        return CircleSendSuccess(message);
      }
      return CircleSendFailed('Failed to send message');
    } catch (e, stack) {
      logError('Failed to send message', error: e, stackTrace: stack);
      return CircleSendFailed(e.toString());
    }
  }

  Future<CircleSendResult> sendGif(String gifUrl) async {
    final attachment = CircleMessageAttachment(
      filename: 'gif',
      url: gifUrl,
      mimeType: 'image/gif',
    );
    return sendMessage('', attachments: [attachment]);
  }

  Future<Result<void>> toggleReaction(String messageId, String emoji) async {
    try {
      final userId = currentUserId;
      if (userId == null) return Result.failure('Not authenticated');

      // Check if already reacted
      final existing = reactions[messageId]
          ?.firstWhere((r) => r.emoji == emoji, orElse: () => GroupedCircleReaction(
            emoji: emoji,
            count: 0,
            reactedByMe: false,
            userIds: [],
          ));

      if (existing?.reactedByMe == true) {
        await _circleService.removeReaction(messageId, emoji);
      } else {
        await _circleService.addReaction(messageId, emoji);
      }

      // Reload reactions for this message
      await _loadReactions([messageId]);
      _loadMessages(); // Refresh message list
      
      return Result.success(null);
    } catch (e, stack) {
      logError('Failed to toggle reaction', error: e, stackTrace: stack);
      return Result.failure('Failed to add reaction');
    }
  }

  Future<Result<void>> editMessage(String messageId, String newContent) async {
    try {
      await _circleService.editMessage(messageId, newContent);
      return Result.success(null);
    } catch (e, stack) {
      logError('Failed to edit message', error: e, stackTrace: stack);
      return Result.failure('Failed to edit message');
    }
  }

  Future<Result<void>> deleteMessage(String messageId, {bool forEveryone = false}) async {
    try {
      if (forEveryone) {
        await _circleService.softDeleteMessage(messageId);
      } else {
        await _circleService.deleteMessage(messageId);
      }
      return Result.success(null);
    } catch (e, stack) {
      logError('Failed to delete message', error: e, stackTrace: stack);
      return Result.failure('Failed to delete message');
    }
  }

  void setReplyingTo(EnhancedCircleMessage? message) {
    replyingTo = message;
    notifyListeners();
  }

  void cancelReply() {
    replyingTo = null;
    notifyListeners();
  }

  void sendTypingIndicator(bool isTyping) {
    SupabaseConfig.client.channel('circle:$circleId:typing').sendBroadcastMessage(
      event: 'typing',
      payload: {
        'user_id': currentUserId,
        'is_typing': isTyping,
      },
    );
  }

  /// Build message list with date separators
  List<dynamic> buildMessageList(List<EnhancedCircleMessage> messages) {
    if (messages.isEmpty) return [];

    final result = <dynamic>[];
    DateTime? lastDate;

    for (final message in messages) {
      final messageDate = DateTime(
        message.createdAt.year,
        message.createdAt.month,
        message.createdAt.day,
      );

      if (lastDate == null || messageDate != lastDate) {
        result.add(CircleDateSeparator(date: messageDate));
        lastDate = messageDate;
      }

      result.add(message);
    }

    return result;
  }

  Future<void> markAsRead() async {
    try {
      await _circleService.markAsRead(circleId);
    } catch (e) {
      logWarning('Failed to mark as read', error: e);
    }
  }

  @override
  void dispose() {
    _dbSubscription?.cancel();
    _typingSubscription?.cancel();
    _messagesController?.close();
    super.dispose();
  }
}
