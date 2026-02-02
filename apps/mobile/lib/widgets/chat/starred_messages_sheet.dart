import 'package:flutter/material.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/chat_service.dart';
import 'package:thittam1hub/theme.dart';

/// Sheet displaying starred messages for the current user
/// 
/// Can be used in two ways:
/// 1. With pre-loaded messages: pass `messages` directly
/// 2. With channelId: loads starred messages for that channel
class StarredMessagesSheet extends StatefulWidget {
  final List<StarredMessage>? messages;
  final String? channelId;
  final Function(Message message)? onMessageTap;
  final Function(String messageId)? onUnstar;

  const StarredMessagesSheet({
    super.key,
    this.messages,
    this.channelId,
    this.onMessageTap,
    this.onUnstar,
  });

  static Future<void> show(
    BuildContext context, {
    List<StarredMessage>? messages,
    String? channelId,
    Function(Message message)? onMessageTap,
    Function(String messageId)? onUnstar,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StarredMessagesSheet(
        messages: messages,
        channelId: channelId,
        onMessageTap: onMessageTap,
        onUnstar: onUnstar,
      ),
    );
  }

  @override
  State<StarredMessagesSheet> createState() => _StarredMessagesSheetState();
}

class _StarredMessagesSheetState extends State<StarredMessagesSheet> {
  List<Message> _loadedMessages = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (widget.channelId != null && widget.messages == null) {
      _loadMessages();
    }
  }

  Future<void> _loadMessages() async {
    setState(() => _loading = true);
    try {
      final starred = await ChatService.getStarredMessages();
      if (mounted) {
        setState(() {
          _loadedMessages = starred;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    // Use either pre-loaded messages or messages loaded from channelId
    final hasPreloadedMessages = widget.messages != null && widget.messages!.isNotEmpty;
    final messageCount = hasPreloadedMessages ? widget.messages!.length : _loadedMessages.length;

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: cs.onSurface.withOpacity(0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(Icons.star, color: AppColors.amber500),
                const SizedBox(width: 8),
                Text(
                  'Starred Messages',
                  style: context.textStyles.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Text(
                  '$messageCount',
                  style: context.textStyles.titleMedium?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),

          Divider(color: cs.outline.withOpacity(0.2), height: 1),

          // Messages
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : (messageCount == 0)
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.star_border,
                              size: 56,
                              color: cs.onSurfaceVariant.withOpacity(0.5),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No starred messages',
                              style: context.textStyles.titleMedium?.copyWith(
                                color: cs.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Long press any message to star it',
                              style: context.textStyles.bodySmall?.copyWith(
                                color: cs.onSurfaceVariant.withOpacity(0.7),
                              ),
                            ),
                          ],
                        ),
                      )
                    : hasPreloadedMessages
                        ? _buildPreloadedMessagesList()
                        : _buildLoadedMessagesList(),
          ),
        ],
      ),
    );
  }

  Widget _buildPreloadedMessagesList() {
    final cs = Theme.of(context).colorScheme;
    
    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: widget.messages!.length,
      separatorBuilder: (_, __) => Divider(
        color: cs.outline.withOpacity(0.1),
        height: 1,
        indent: 72,
      ),
      itemBuilder: (context, index) {
        final msg = widget.messages![index];
        return _StarredMessageTile(
          message: msg,
          onTap: () {
            Navigator.pop(context);
            // Create a Message from StarredMessage for compatibility
          },
          onUnstar: widget.onUnstar != null ? () => widget.onUnstar!(msg.id) : null,
        );
      },
    );
  }

  Widget _buildLoadedMessagesList() {
    final cs = Theme.of(context).colorScheme;
    
    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _loadedMessages.length,
      separatorBuilder: (_, __) => Divider(
        color: cs.outline.withOpacity(0.1),
        height: 1,
        indent: 72,
      ),
      itemBuilder: (context, index) {
        final msg = _loadedMessages[index];
        return _LoadedMessageTile(
          message: msg,
          onTap: () {
            Navigator.pop(context);
            widget.onMessageTap?.call(msg);
          },
          onUnstar: widget.onUnstar != null ? () => widget.onUnstar!(msg.id) : null,
        );
      },
    );
  }
}

class _LoadedMessageTile extends StatelessWidget {
  final Message message;
  final VoidCallback onTap;
  final VoidCallback? onUnstar;

  const _LoadedMessageTile({
    required this.message,
    required this.onTap,
    this.onUnstar,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar
            CircleAvatar(
              radius: 20,
              backgroundColor: cs.primary.withOpacity(0.1),
              backgroundImage: message.senderAvatar != null
                  ? NetworkImage(message.senderAvatar!)
                  : null,
              child: message.senderAvatar == null
                  ? Text(
                      (message.senderName ?? 'U')[0].toUpperCase(),
                      style: TextStyle(
                        color: cs.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        message.senderName ?? 'Unknown',
                        style: context.textStyles.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        _formatDate(message.sentAt),
                        style: context.textStyles.labelSmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message.content,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: context.textStyles.bodyMedium?.copyWith(
                      color: cs.onSurface.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),

            // Unstar button
            if (onUnstar != null)
              IconButton(
                onPressed: onUnstar,
                icon: Icon(
                  Icons.star,
                  size: 20,
                  color: AppColors.amber500,
                ),
                tooltip: 'Unstar',
              ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    if (dt.day == now.day && dt.month == now.month && dt.year == now.year) {
      return 'Today';
    }
    final diff = now.difference(dt);
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.month}/${dt.day}';
  }
}

class _StarredMessageTile extends StatelessWidget {
  final StarredMessage message;
  final VoidCallback onTap;
  final VoidCallback? onUnstar;

  const _StarredMessageTile({
    required this.message,
    required this.onTap,
    this.onUnstar,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar
            CircleAvatar(
              radius: 20,
              backgroundColor: cs.primary.withOpacity(0.1),
              backgroundImage: message.senderAvatar != null
                  ? NetworkImage(message.senderAvatar!)
                  : null,
              child: message.senderAvatar == null
                  ? Text(
                      message.senderName[0].toUpperCase(),
                      style: TextStyle(
                        color: cs.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        message.senderName,
                        style: context.textStyles.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '• ${message.channelName}',
                        style: context.textStyles.labelSmall?.copyWith(
                          color: cs.primary,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        _formatDate(message.starredAt),
                        style: context.textStyles.labelSmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message.content,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: context.textStyles.bodyMedium?.copyWith(
                      color: cs.onSurface.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),

            // Unstar button
            if (onUnstar != null)
              IconButton(
                onPressed: onUnstar,
                icon: Icon(
                  Icons.star,
                  size: 20,
                  color: AppColors.amber500,
                ),
                tooltip: 'Unstar',
              ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    if (dt.day == now.day && dt.month == now.month && dt.year == now.year) {
      return 'Today';
    }
    final diff = now.difference(dt);
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.month}/${dt.day}';
  }
}

/// Model for starred message with extra metadata
class StarredMessage {
  final String id;
  final String content;
  final String senderName;
  final String? senderAvatar;
  final String channelName;
  final String channelId;
  final DateTime sentAt;
  final DateTime starredAt;

  const StarredMessage({
    required this.id,
    required this.content,
    required this.senderName,
    this.senderAvatar,
    required this.channelName,
    required this.channelId,
    required this.sentAt,
    required this.starredAt,
  });
}