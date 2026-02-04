import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/services/supabase_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/styled_widgets.dart';
import 'package:thittam1hub/widgets/chat/organizer_broadcast_badge.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';

/// Session chat page for participants to discuss during a specific session.
///
/// Shows messages with special treatment for organizer announcements and
/// supports read-only mode for announcement-type channels.
class SessionChatPage extends StatefulWidget {
  final String eventId;
  final String channelId;
  final String channelName;
  final bool canWrite;
  final bool isAnnouncement;

  const SessionChatPage({
    super.key,
    required this.eventId,
    required this.channelId,
    required this.channelName,
    this.canWrite = true,
    this.isAnnouncement = false,
  });

  @override
  State<SessionChatPage> createState() => _SessionChatPageState();
}

class _SessionChatPageState extends State<SessionChatPage> {
  final _supabase = SupabaseService.instance.client;
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  bool _loading = true;
  bool _sending = false;
  String? _error;
  List<ChannelMessage> _messages = [];
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _initializeChat() async {
    try {
      final user = _supabase.auth.currentUser;
      _currentUserId = user?.id;

      await _loadMessages();
      _setupRealtime();
    } catch (e) {
      debugPrint('Failed to initialize chat: $e');
    }
  }

  Future<void> _loadMessages() async {
    try {
      setState(() {
        _loading = true;
        _error = null;
      });

      final response = await _supabase.functions.invoke(
        'participant-messages-api',
        body: {
          'action': 'list',
          'channelId': widget.channelId,
          'limit': 50,
        },
      );

      if (response.data == null) {
        throw Exception('Failed to load messages');
      }

      final data = response.data as Map<String, dynamic>;
      final messages = (data['messages'] as List? ?? [])
          .map((m) => ChannelMessage.fromJson(m))
          .toList();

      // Mark as read
      await _supabase.functions.invoke(
        'participant-messages-api',
        body: {
          'action': 'mark-read',
          'channelId': widget.channelId,
        },
      );

      if (mounted) {
        setState(() {
          _messages = messages.reversed.toList();
          _loading = false;
        });

        // Scroll to bottom
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
          }
        });
      }
    } catch (e) {
      debugPrint('Failed to load messages: $e');
      if (mounted) {
        setState(() {
          _error = 'Failed to load messages';
          _loading = false;
        });
      }
    }
  }

  void _setupRealtime() {
    _supabase
        .channel('session-chat-${widget.channelId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'channel_messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'channel_id',
            value: widget.channelId,
          ),
          callback: (payload) {
            if (payload.newRecord.isNotEmpty) {
              final message = ChannelMessage.fromJson(payload.newRecord);
              if (mounted) {
                setState(() {
                  _messages.add(message);
                });

                // Scroll to bottom for new message
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (_scrollController.hasClients) {
                    _scrollController.animateTo(
                      _scrollController.position.maxScrollExtent,
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOut,
                    );
                  }
                });
              }
            }
          },
        )
        .subscribe();
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty || _sending) return;

    try {
      setState(() => _sending = true);
      HapticFeedback.lightImpact();

      await _supabase.functions.invoke(
        'participant-messages-api',
        body: {
          'action': 'send',
          'channelId': widget.channelId,
          'content': content,
        },
      );

      _messageController.clear();
    } catch (e) {
      debugPrint('Failed to send message: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to send message'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(
              widget.isAnnouncement ? Icons.campaign_rounded : Icons.tag_rounded,
              size: 20,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                _formatChannelName(widget.channelName),
                style: context.textStyles.titleMedium,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline_rounded),
            onPressed: _showChannelInfo,
            tooltip: 'Channel info',
          ),
        ],
      ),
      body: Column(
        children: [
          // Read-only banner
          if (!widget.canWrite)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: theme.colorScheme.surfaceContainerHighest,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.visibility_outlined,
                    size: 16,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'This channel is read-only',
                    style: context.textStyles.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),

          // Messages list
          Expanded(child: _buildMessagesList(theme)),

          // Message input
          if (widget.canWrite) _buildMessageInput(theme),
        ],
      ),
    );
  }

  Widget _buildMessagesList(ThemeData theme) {
    if (_loading) {
      return const Center(child: StyledLoadingIndicator());
    }

    if (_error != null) {
      return EnhancedEmptyState(
        icon: Icons.error_outline_rounded,
        title: 'Unable to Load',
        subtitle: _error,
        actionLabel: 'Try Again',
        onAction: _loadMessages,
      );
    }

    if (_messages.isEmpty) {
      return EnhancedEmptyState(
        icon: Icons.chat_bubble_outline_rounded,
        title: 'No Messages Yet',
        subtitle: widget.canWrite
            ? 'Start the conversation!'
            : 'Messages will appear here when posted',
      );
    }

    return BrandedRefreshIndicator(
      onRefresh: _loadMessages,
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        itemCount: _messages.length,
        itemBuilder: (context, index) {
          final message = _messages[index];
          final isOwnMessage = message.senderId == _currentUserId;
          final isBroadcast = message.messageType == 'broadcast' ||
              message.messageType == 'important' ||
              message.messageType == 'urgent';

          if (isBroadcast) {
            return _buildBroadcastMessage(theme, message);
          }

          return _buildMessage(theme, message, isOwnMessage);
        },
      ),
    );
  }

  Widget _buildBroadcastMessage(ThemeData theme, ChannelMessage message) {
    final priority = (message.messageType ?? 'normal').toBroadcastPriority();

    return BroadcastMessageWrapper(
      priority: priority,
      senderName: message.senderName ?? 'Organizer',
      timestamp: message.createdAt,
      child: Text(
        message.content,
        style: context.textStyles.bodyMedium,
      ),
    );
  }

  Widget _buildMessage(ThemeData theme, ChannelMessage message, bool isOwn) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isOwn ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isOwn) ...[
            StyledAvatar(
              name: message.senderName ?? 'User',
              size: 32,
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isOwn
                    ? theme.colorScheme.primary
                    : theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(16).copyWith(
                  bottomRight: isOwn ? const Radius.circular(4) : null,
                  bottomLeft: !isOwn ? const Radius.circular(4) : null,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!isOwn)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(
                        message.senderName ?? 'User',
                        style: context.textStyles.labelSmall?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  Text(
                    message.content,
                    style: context.textStyles.bodyMedium?.copyWith(
                      color: isOwn
                          ? theme.colorScheme.onPrimary
                          : theme.colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatTime(message.createdAt),
                    style: context.textStyles.bodySmall?.copyWith(
                      color: isOwn
                          ? theme.colorScheme.onPrimary.withOpacity(0.7)
                          : theme.colorScheme.onSurfaceVariant,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageInput(ThemeData theme) {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(
          top: BorderSide(color: theme.colorScheme.outlineVariant),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: StyledTextField(
              controller: _messageController,
              hintText: 'Type a message...',
              maxLines: 4,
              minLines: 1,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: _sending ? null : _sendMessage,
            icon: _sending
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: theme.colorScheme.primary,
                    ),
                  )
                : Icon(
                    Icons.send_rounded,
                    color: theme.colorScheme.primary,
                  ),
          ),
        ],
      ),
    );
  }

  String _formatChannelName(String name) {
    final prefixes = ['announce-', 'session-', 'network-', 'help-', 'booth-'];
    String formatted = name;

    for (final prefix in prefixes) {
      if (name.startsWith(prefix)) {
        formatted = name.substring(prefix.length);
        break;
      }
    }

    return formatted
        .split('-')
        .map((word) => word.isEmpty ? '' : word[0].toUpperCase() + word.substring(1))
        .join(' ');
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 1) {
      return 'Just now';
    } else if (diff.inHours < 1) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inDays < 1) {
      final hour = time.hour.toString().padLeft(2, '0');
      final minute = time.minute.toString().padLeft(2, '0');
      return '$hour:$minute';
    } else {
      return '${time.month}/${time.day}';
    }
  }

  void _showChannelInfo() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  widget.isAnnouncement
                      ? Icons.campaign_rounded
                      : Icons.tag_rounded,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _formatChannelName(widget.channelName),
                    style: context.textStyles.titleLarge,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildInfoRow(
              Icons.visibility_outlined,
              widget.canWrite ? 'You can post messages' : 'Read-only channel',
            ),
            const SizedBox(height: 8),
            _buildInfoRow(
              Icons.people_outline_rounded,
              '${_messages.map((m) => m.senderId).toSet().length} participants',
            ),
            const SizedBox(height: 8),
            _buildInfoRow(
              Icons.chat_outlined,
              '${_messages.length} messages',
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, size: 18, color: theme.colorScheme.onSurfaceVariant),
        const SizedBox(width: 12),
        Text(text, style: context.textStyles.bodyMedium),
      ],
    );
  }
}

/// Channel message model
class ChannelMessage {
  final String id;
  final String channelId;
  final String senderId;
  final String? senderName;
  final String content;
  final String? messageType;
  final DateTime createdAt;
  final bool isEdited;

  ChannelMessage({
    required this.id,
    required this.channelId,
    required this.senderId,
    this.senderName,
    required this.content,
    this.messageType,
    required this.createdAt,
    this.isEdited = false,
  });

  factory ChannelMessage.fromJson(Map<String, dynamic> json) {
    return ChannelMessage(
      id: json['id'] as String,
      channelId: json['channel_id'] as String,
      senderId: json['sender_id'] as String,
      senderName: json['sender_name'] as String?,
      content: json['content'] as String,
      messageType: json['message_type'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      isEdited: json['is_edited'] as bool? ?? false,
    );
  }
}
