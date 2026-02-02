import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme.dart';
import '../styled_avatar.dart';
import '../unread_badge.dart';

/// Enhanced conversation tile with swipe actions and visual states
class ConversationTile extends StatefulWidget {
  final String id;
  final String name;
  final String? avatarUrl;
  final String? subtitle;
  final String? time;
  final int unreadCount;
  final bool isOnline;
  final bool isPinned;
  final bool isMuted;
  final bool isTyping;
  final String? draftMessage;
  final MessageStatus? messageStatus;
  final bool isGroup;
  final int? memberCount;
  final VoidCallback? onTap;
  final VoidCallback? onPin;
  final VoidCallback? onMute;
  final VoidCallback? onArchive;
  final VoidCallback? onMarkRead;

  const ConversationTile({
    super.key,
    required this.id,
    required this.name,
    this.avatarUrl,
    this.subtitle,
    this.time,
    this.unreadCount = 0,
    this.isOnline = false,
    this.isPinned = false,
    this.isMuted = false,
    this.isTyping = false,
    this.draftMessage,
    this.messageStatus,
    this.isGroup = false,
    this.memberCount,
    this.onTap,
    this.onPin,
    this.onMute,
    this.onArchive,
    this.onMarkRead,
  });

  @override
  State<ConversationTile> createState() => _ConversationTileState();
}

class _ConversationTileState extends State<ConversationTile> {
  double _dragExtent = 0;
  bool _showLeftActions = false;
  bool _showRightActions = false;

  void _handleDragUpdate(DragUpdateDetails details) {
    setState(() {
      _dragExtent += details.delta.dx;
      _dragExtent = _dragExtent.clamp(-100.0, 100.0);
      _showLeftActions = _dragExtent > 50;
      _showRightActions = _dragExtent < -50;
    });
  }

  void _handleDragEnd(DragEndDetails details) {
    if (_showLeftActions) {
      widget.onPin?.call();
    } else if (_showRightActions) {
      widget.onMute?.call();
    }
    setState(() {
      _dragExtent = 0;
      _showLeftActions = false;
      _showRightActions = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    // Build semantic label for accessibility
    final semanticLabel = StringBuffer(widget.name);
    if (widget.isGroup) semanticLabel.write(', group');
    if (widget.unreadCount > 0) {
      semanticLabel.write(', ${widget.unreadCount} unread message${widget.unreadCount > 1 ? 's' : ''}');
    }
    if (widget.isTyping) semanticLabel.write(', typing');
    if (widget.isPinned) semanticLabel.write(', pinned');
    if (widget.isMuted) semanticLabel.write(', muted');
    if (widget.isOnline) semanticLabel.write(', online');
    
    return Semantics(
      button: true,
      label: semanticLabel.toString(),
      child: GestureDetector(
        onHorizontalDragUpdate: _handleDragUpdate,
        onHorizontalDragEnd: _handleDragEnd,
        onLongPress: () {
          HapticFeedback.mediumImpact();
          _showContextMenu(context);
        },
        child: Stack(
          children: [
            // Left action (Pin)
            Positioned.fill(
              child: Container(
                alignment: Alignment.centerLeft,
                padding: const EdgeInsets.only(left: 20),
                color: theme.colorScheme.primary.withOpacity(0.15),
                child: Icon(
                  widget.isPinned ? Icons.push_pin_outlined : Icons.push_pin,
                  color: theme.colorScheme.primary,
                ),
              ),
            ),
            // Right action (Mute)
            Positioned.fill(
              child: Container(
                alignment: Alignment.centerRight,
                padding: const EdgeInsets.only(right: 20),
                color: theme.colorScheme.surfaceContainerHighest,
                child: Icon(
                  widget.isMuted ? Icons.notifications : Icons.notifications_off,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
            // Main tile
            AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              transform: Matrix4.translationValues(_dragExtent, 0, 0),
              child: Material(
                color: widget.isPinned
                    ? theme.colorScheme.primaryContainer.withOpacity(0.3)
                    : theme.colorScheme.surface,
                child: InkWell(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    widget.onTap?.call();
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    child: Row(
                      children: [
                        _buildAvatar(theme),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildContent(theme),
                        ),
                        _buildTrailing(theme),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar(ThemeData theme) {
    return Stack(
      children: [
        StyledAvatar(
          imageUrl: widget.avatarUrl,
          name: widget.name,
          size: 52,
        ),
        if (widget.isOnline)
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                color: const Color(0xFF4CAF50),
                shape: BoxShape.circle,
                border: Border.all(
                  color: theme.colorScheme.surface,
                  width: 2,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildContent(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (widget.isGroup)
              Padding(
                padding: const EdgeInsets.only(right: 4),
                child: Icon(
                  Icons.group,
                  size: 14,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            Expanded(
              child: Text(
                widget.name,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: widget.unreadCount > 0
                      ? FontWeight.w600
                      : FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        _buildSubtitle(theme),
      ],
    );
  }

  Widget _buildSubtitle(ThemeData theme) {
    if (widget.isTyping) {
      return Row(
        children: [
          _TypingIndicator(),
          const SizedBox(width: 6),
          Text(
            'typing...',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.primary,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      );
    }

    if (widget.draftMessage != null) {
      return Row(
        children: [
          Text(
            'Draft: ',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.error,
              fontWeight: FontWeight.w500,
            ),
          ),
          Expanded(
            child: Text(
              widget.draftMessage!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      );
    }

    return Row(
      children: [
        if (widget.messageStatus != null) ...[
          _MessageStatusIcon(status: widget.messageStatus!),
          const SizedBox(width: 4),
        ],
        Expanded(
          child: Text(
            widget.subtitle ?? '',
            style: theme.textTheme.bodySmall?.copyWith(
              color: widget.unreadCount > 0
                  ? theme.colorScheme.onSurface
                  : theme.colorScheme.onSurfaceVariant,
              fontWeight:
                  widget.unreadCount > 0 ? FontWeight.w500 : FontWeight.normal,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildTrailing(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.isPinned)
              Padding(
                padding: const EdgeInsets.only(right: 4),
                child: Icon(
                  Icons.push_pin,
                  size: 12,
                  color: theme.colorScheme.primary,
                ),
              ),
            if (widget.isMuted)
              Padding(
                padding: const EdgeInsets.only(right: 4),
                child: Icon(
                  Icons.notifications_off,
                  size: 12,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            Text(
              widget.time ?? '',
              style: theme.textTheme.labelSmall?.copyWith(
                color: widget.unreadCount > 0
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurfaceVariant,
                fontWeight:
                    widget.unreadCount > 0 ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
        if (widget.unreadCount > 0) ...[
          const SizedBox(height: 6),
          UnreadBadge(count: widget.unreadCount),
        ],
      ],
    );
  }

  void _showContextMenu(BuildContext context) {
    final theme = Theme.of(context);
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: theme.colorScheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              _ContextMenuItem(
                icon: widget.isPinned
                    ? Icons.push_pin_outlined
                    : Icons.push_pin,
                label: widget.isPinned ? 'Unpin' : 'Pin to top',
                onTap: () {
                  Navigator.pop(context);
                  widget.onPin?.call();
                },
              ),
              _ContextMenuItem(
                icon: widget.isMuted
                    ? Icons.notifications
                    : Icons.notifications_off,
                label: widget.isMuted ? 'Unmute' : 'Mute notifications',
                onTap: () {
                  Navigator.pop(context);
                  widget.onMute?.call();
                },
              ),
              if (widget.unreadCount > 0)
                _ContextMenuItem(
                  icon: Icons.mark_chat_read,
                  label: 'Mark as read',
                  onTap: () {
                    Navigator.pop(context);
                    widget.onMarkRead?.call();
                  },
                ),
              _ContextMenuItem(
                icon: Icons.archive_outlined,
                label: 'Archive chat',
                onTap: () {
                  Navigator.pop(context);
                  widget.onArchive?.call();
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _ContextMenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  const _ContextMenuItem({
    required this.icon,
    required this.label,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 22, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(width: 16),
            Text(
              label,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypingIndicator extends StatefulWidget {
  const _TypingIndicator();

  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        return AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            final delay = index * 0.2;
            final value = ((_controller.value - delay) % 1.0).clamp(0.0, 1.0);
            final opacity = 0.3 + 0.7 * (1 - (value * 2 - 1).abs());
            
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 1),
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withOpacity(opacity),
                shape: BoxShape.circle,
              ),
            );
          },
        );
      }),
    );
  }
}

class _MessageStatusIcon extends StatelessWidget {
  final MessageStatus status;

  const _MessageStatusIcon({required this.status});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    IconData icon;
    Color color;
    
    switch (status) {
      case MessageStatus.sending:
        icon = Icons.access_time;
        color = theme.colorScheme.onSurfaceVariant;
        break;
      case MessageStatus.sent:
        icon = Icons.check;
        color = theme.colorScheme.onSurfaceVariant;
        break;
      case MessageStatus.delivered:
        icon = Icons.done_all;
        color = theme.colorScheme.onSurfaceVariant;
        break;
      case MessageStatus.read:
        icon = Icons.done_all;
        color = theme.colorScheme.primary;
        break;
    }

    return Icon(icon, size: 14, color: color);
  }
}

enum MessageStatus { sending, sent, delivered, read }
