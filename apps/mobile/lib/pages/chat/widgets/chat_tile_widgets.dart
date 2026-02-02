import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:vector_math/vector_math_64.dart' show Matrix4;
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/chat_group.dart';
import 'package:thittam1hub/models/circle.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/services/chat_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/unread_badge.dart';
import 'package:thittam1hub/utils/icon_mappings.dart';

// ============================================================================
// ENHANCED DM TILE
// ============================================================================

class EnhancedDMTile extends StatefulWidget {
  final DMThread thread;
  final int unreadCount;
  final bool isPinned;
  final bool isMuted;
  final VoidCallback onPin;
  final VoidCallback onMute;

  const EnhancedDMTile({
    super.key,
    required this.thread,
    required this.unreadCount,
    required this.isPinned,
    required this.isMuted,
    required this.onPin,
    required this.onMute,
  });

  @override
  State<EnhancedDMTile> createState() => _EnhancedDMTileState();
}

class _EnhancedDMTileState extends State<EnhancedDMTile> {
  double _dragExtent = 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final last = widget.thread.lastMessage;
    final time = last != null ? _formatTime(last.sentAt) : '';
    final hasUnread = widget.unreadCount > 0;
    
    // Build semantic label for accessibility
    final semanticLabel = StringBuffer(widget.thread.partnerName);
    if (hasUnread) {
      semanticLabel.write(', ${widget.unreadCount} unread message${widget.unreadCount > 1 ? 's' : ''}');
    } else {
      semanticLabel.write(', no unread messages');
    }
    if (widget.isPinned) semanticLabel.write(', pinned');
    if (widget.isMuted) semanticLabel.write(', muted');
    if (widget.thread.isOnline == true) semanticLabel.write(', online');

    return Semantics(
      button: true,
      label: semanticLabel.toString(),
      child: GestureDetector(
        onHorizontalDragUpdate: (d) => setState(() {
          _dragExtent = (_dragExtent + d.delta.dx).clamp(-80.0, 80.0);
        }),
        onHorizontalDragEnd: (d) {
          if (_dragExtent > 50) widget.onPin();
          if (_dragExtent < -50) widget.onMute();
          setState(() => _dragExtent = 0);
        },
        onLongPress: () {
          HapticFeedback.mediumImpact();
          _showContextMenu(context);
        },
      child: Stack(
        children: [
          // Swipe backgrounds
          Positioned.fill(
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    color: theme.colorScheme.primary.withOpacity(0.15),
                    alignment: Alignment.centerLeft,
                    padding: const EdgeInsets.only(left: 20),
                    child: Icon(
                      widget.isPinned ? Icons.push_pin_outlined : Icons.push_pin,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ),
                Expanded(
                  child: Container(
                    color: theme.colorScheme.surfaceContainerHighest,
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    child: Icon(
                      widget.isMuted ? Icons.notifications : Icons.notifications_off,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Main tile
          AnimatedContainer(
            duration: const Duration(milliseconds: 100),
            transform: Matrix4.translationValues(_dragExtent, 0, 0),
            child: Material(
              color: widget.isPinned
                  ? theme.colorScheme.primaryContainer.withOpacity(0.3)
                  : hasUnread
                      ? theme.colorScheme.primary.withOpacity(0.05)
                      : theme.colorScheme.surface,
              child: InkWell(
                onTap: () {
                  HapticFeedback.lightImpact();
                  context.push(AppRoutes.chatChannel(widget.thread.channelId), extra: {
                    'dmUserId': widget.thread.partnerUserId,
                    'dmUserName': widget.thread.partnerName,
                    'dmUserAvatar': widget.thread.partnerAvatar,
                  });
                },
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    children: [
                      // Avatar with Hero for smooth transition
                      Hero(
                        tag: 'chat_avatar_${widget.thread.channelId}',
                        child: Stack(
                          children: [
                            Container(
                              width: 52,
                              height: 52,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                color: theme.colorScheme.surfaceContainerHighest,
                              ),
                              clipBehavior: Clip.antiAlias,
                              child: widget.thread.partnerAvatar != null
                                  ? CachedNetworkImage(
                                      imageUrl: widget.thread.partnerAvatar!,
                                      fit: BoxFit.cover,
                                      errorWidget: (_, __, ___) => _buildInitials(theme),
                                    )
                                  : _buildInitials(theme),
                            ),
                            if (widget.thread.isOnline == true)
                              Positioned(
                                right: 0,
                                bottom: 0,
                                child: Container(
                                  width: 14,
                                  height: 14,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF4CAF50),
                                    shape: BoxShape.circle,
                                    border: Border.all(color: theme.colorScheme.surface, width: 2),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),
                      // Content
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    widget.thread.partnerName,
                                    style: context.textStyles.titleSmall?.copyWith(
                                      fontWeight: hasUnread ? FontWeight.w700 : FontWeight.w600,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (widget.isPinned)
                                  Padding(
                                    padding: const EdgeInsets.only(right: 4),
                                    child: Icon(Icons.push_pin, size: 12, color: theme.colorScheme.primary),
                                  ),
                                if (widget.isMuted)
                                  Padding(
                                    padding: const EdgeInsets.only(right: 4),
                                    child: Icon(Icons.notifications_off, size: 12, color: theme.colorScheme.onSurfaceVariant),
                                  ),
                                Text(
                                  time,
                                  style: context.textStyles.labelSmall?.copyWith(
                                    color: hasUnread ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant,
                                    fontWeight: hasUnread ? FontWeight.w600 : FontWeight.normal,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Expanded(child: _buildMessagePreview(last, theme, hasUnread)),
                                if (hasUnread) ...[
                                  const SizedBox(width: 8),
                                  UnreadBadge(count: widget.unreadCount, size: 20),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
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

  Widget _buildMessagePreview(Message? message, ThemeData theme, bool hasUnread) {
    if (message == null) {
      return Text(
        'Start a conversation',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: context.textStyles.bodySmall?.copyWith(
          color: theme.colorScheme.onSurfaceVariant,
        ),
      );
    }

    if (message.attachments.isNotEmpty) {
      final attachment = message.attachments.first;
      final icon = _getAttachmentIcon(attachment.type);
      final label = _getAttachmentLabel(attachment.type);
      return Row(
        children: [
          Icon(icon, size: 14, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 4),
          Text(
            label,
            style: context.textStyles.bodySmall?.copyWith(
              color: hasUnread
                  ? theme.colorScheme.onSurface.withOpacity(0.8)
                  : theme.colorScheme.onSurfaceVariant,
              fontWeight: hasUnread ? FontWeight.w500 : FontWeight.normal,
            ),
          ),
        ],
      );
    }

    return Text(
      message.content,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: context.textStyles.bodySmall?.copyWith(
        color: hasUnread
            ? theme.colorScheme.onSurface.withOpacity(0.8)
            : theme.colorScheme.onSurfaceVariant,
        fontWeight: hasUnread ? FontWeight.w500 : FontWeight.normal,
      ),
    );
  }

  IconData _getAttachmentIcon(String type) => switch (type.toLowerCase()) {
    'image' || 'photo' => Icons.image_rounded,
    'video' => Icons.videocam_rounded,
    'audio' || 'voice' => Icons.mic_rounded,
    'file' || 'document' => Icons.attach_file_rounded,
    'location' => Icons.location_on_rounded,
    'gif' => Icons.gif_rounded,
    _ => Icons.attachment_rounded,
  };

  String _getAttachmentLabel(String type) => switch (type.toLowerCase()) {
    'image' || 'photo' => 'Photo',
    'video' => 'Video',
    'audio' || 'voice' => 'Voice message',
    'file' || 'document' => 'Document',
    'location' => 'Location',
    'gif' => 'GIF',
    _ => 'Attachment',
  };

  Widget _buildInitials(ThemeData theme) {
    final colors = [AppColors.indigo500, AppColors.teal500, AppColors.pink500, AppColors.violet500];
    final hash = widget.thread.partnerName.codeUnits.fold(0, (p, c) => p + c);
    return Container(
      color: colors[hash % colors.length].withOpacity(0.15),
      child: Center(
        child: Text(
          widget.thread.partnerName.isNotEmpty ? widget.thread.partnerName[0].toUpperCase() : '?',
          style: TextStyle(color: colors[hash % colors.length], fontWeight: FontWeight.w600, fontSize: 18),
        ),
      ),
    );
  }

  void _showContextMenu(BuildContext context) {
    final theme = Theme.of(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(20)),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(width: 40, height: 4, decoration: BoxDecoration(color: theme.colorScheme.outlineVariant, borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 16),
              ListTile(
                leading: Icon(widget.isPinned ? Icons.push_pin_outlined : Icons.push_pin),
                title: Text(widget.isPinned ? 'Unpin' : 'Pin to top'),
                onTap: () { Navigator.pop(context); widget.onPin(); },
              ),
              ListTile(
                leading: Icon(widget.isMuted ? Icons.notifications : Icons.notifications_off),
                title: Text(widget.isMuted ? 'Unmute' : 'Mute'),
                onTap: () { Navigator.pop(context); widget.onMute(); },
              ),
              if (widget.unreadCount > 0)
                ListTile(
                  leading: const Icon(Icons.mark_chat_read),
                  title: const Text('Mark as read'),
                  onTap: () async {
                    Navigator.pop(context);
                    await ChatService.updateLastRead(widget.thread.channelId);
                  },
                ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    if (dt.day == now.day && dt.month == now.month && dt.year == now.year) {
      final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
      final m = dt.minute.toString().padLeft(2, '0');
      final am = dt.hour >= 12 ? 'PM' : 'AM';
      return '$h:$m $am';
    }
    final diff = now.difference(dt);
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dt.weekday - 1];
    return '${dt.month}/${dt.day}';
  }
}

// ============================================================================
// ENHANCED GROUP TILE
// ============================================================================

class EnhancedGroupTile extends StatelessWidget {
  final ChatGroup group;
  final bool isPinned;
  final bool isMuted;
  final VoidCallback onPin;
  final VoidCallback onMute;

  const EnhancedGroupTile({
    super.key,
    required this.group,
    required this.isPinned,
    required this.isMuted,
    required this.onPin,
    required this.onMute,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasUnread = group.unreadCount > 0;
    final time = group.lastMessageAt != null ? _formatTime(group.lastMessageAt!) : '';
    
    // Build semantic label for accessibility
    final semanticLabel = StringBuffer(group.name);
    semanticLabel.write(', group');
    if (hasUnread) {
      semanticLabel.write(', ${group.unreadCount} unread message${group.unreadCount > 1 ? 's' : ''}');
    }
    semanticLabel.write(', ${group.memberCount} members');
    if (isPinned) semanticLabel.write(', pinned');
    if (isMuted) semanticLabel.write(', muted');

    return Semantics(
      button: true,
      label: semanticLabel.toString(),
      child: Material(
        color: isPinned
            ? theme.colorScheme.primaryContainer.withOpacity(0.3)
            : hasUnread
                ? theme.colorScheme.primary.withOpacity(0.05)
                : theme.colorScheme.surface,
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            context.push(AppRoutes.chatGroup(group.id), extra: group);
          },
          onLongPress: () {
            HapticFeedback.mediumImpact();
            _showContextMenu(context);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
              // Hero-wrapped avatar for smooth transition to GroupSettingsPage
              Hero(
                tag: 'group_icon_${group.id}',
                child: Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: group.iconUrl != null
                      ? CachedNetworkImage(imageUrl: group.iconUrl!, fit: BoxFit.cover)
                      : _buildInitials(theme),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.group, size: 14, color: theme.colorScheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            group.name,
                            style: context.textStyles.titleSmall?.copyWith(
                              fontWeight: hasUnread ? FontWeight.w700 : FontWeight.w600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isPinned) Icon(Icons.push_pin, size: 12, color: theme.colorScheme.primary),
                        if (isMuted) Icon(Icons.notifications_off, size: 12, color: theme.colorScheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text(
                          time,
                          style: context.textStyles.labelSmall?.copyWith(
                            color: hasUnread ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            group.lastMessage ?? '${group.memberCount} members',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: context.textStyles.bodySmall?.copyWith(
                              color: hasUnread ? theme.colorScheme.onSurface.withOpacity(0.8) : theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ),
                        if (hasUnread) UnreadBadge(count: group.unreadCount, size: 20),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        ),
      ),
    );
  }

  Widget _buildInitials(ThemeData theme) {
    final colors = [AppColors.indigo500, AppColors.teal500, AppColors.pink500, AppColors.violet500];
    final hash = group.name.codeUnits.fold(0, (p, c) => p + c);
    return Center(
      child: Text(
        group.name.isNotEmpty ? group.name[0].toUpperCase() : '?',
        style: TextStyle(color: colors[hash % colors.length], fontWeight: FontWeight.w600, fontSize: 18),
      ),
    );
  }

  void _showContextMenu(BuildContext context) {
    final theme = Theme.of(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(20)),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(width: 40, height: 4, decoration: BoxDecoration(color: theme.colorScheme.outlineVariant, borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 16),
              ListTile(leading: Icon(isPinned ? Icons.push_pin_outlined : Icons.push_pin), title: Text(isPinned ? 'Unpin' : 'Pin'), onTap: () { Navigator.pop(context); onPin(); }),
              ListTile(leading: Icon(isMuted ? Icons.notifications : Icons.notifications_off), title: Text(isMuted ? 'Unmute' : 'Mute'), onTap: () { Navigator.pop(context); onMute(); }),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    if (dt.day == now.day && dt.month == now.month && dt.year == now.year) {
      final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
      return '$h:${dt.minute.toString().padLeft(2, '0')} ${dt.hour >= 12 ? 'PM' : 'AM'}';
    }
    if (now.difference(dt).inDays == 1) return 'Yesterday';
    if (now.difference(dt).inDays < 7) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dt.weekday - 1];
    return '${dt.month}/${dt.day}';
  }
}

// ============================================================================
// ENHANCED CHANNEL TILE
// ============================================================================

class EnhancedChannelTile extends StatelessWidget {
  final WorkspaceChannel channel;
  final Message? last;
  final int unreadCount;
  final bool isPinned;
  final bool isMuted;
  final VoidCallback onPin;
  final VoidCallback onMute;

  const EnhancedChannelTile({
    super.key,
    required this.channel,
    required this.last,
    required this.unreadCount,
    required this.isPinned,
    required this.isMuted,
    required this.onPin,
    required this.onMute,
  });

  IconData get _icon => switch (channel.type) {
    ChannelType.ANNOUNCEMENT => Icons.campaign_outlined,
    ChannelType.GENERAL => Icons.forum_outlined,
    ChannelType.ROLE_BASED => Icons.groups_outlined,
    ChannelType.TASK_SPECIFIC => Icons.checklist_outlined,
  };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasUnread = unreadCount > 0;
    final time = last != null ? _formatTime(last!.sentAt) : '';

    return Material(
      color: isPinned
          ? theme.colorScheme.primaryContainer.withOpacity(0.3)
          : hasUnread
              ? theme.colorScheme.primary.withOpacity(0.05)
              : theme.colorScheme.surface,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          context.push('/chat/${channel.id}', extra: channel);
        },
        onLongPress: () => _showContextMenu(context),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(_icon, color: theme.colorScheme.primary, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '#${channel.name}',
                            style: context.textStyles.titleSmall?.copyWith(
                              fontWeight: hasUnread ? FontWeight.w700 : FontWeight.w600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isPinned) Icon(Icons.push_pin, size: 12, color: theme.colorScheme.primary),
                        if (isMuted) Icon(Icons.notifications_off, size: 12, color: theme.colorScheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text(
                          time,
                          style: context.textStyles.labelSmall?.copyWith(
                            color: hasUnread ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            last?.content ?? channel.description ?? '',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: context.textStyles.bodySmall?.copyWith(
                              color: hasUnread ? theme.colorScheme.onSurface.withOpacity(0.8) : theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ),
                        if (hasUnread) UnreadBadge(count: unreadCount, size: 20),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showContextMenu(BuildContext context) {
    final theme = Theme.of(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(20)),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(width: 40, height: 4, decoration: BoxDecoration(color: theme.colorScheme.outlineVariant, borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 16),
              ListTile(leading: Icon(isPinned ? Icons.push_pin_outlined : Icons.push_pin), title: Text(isPinned ? 'Unpin' : 'Pin'), onTap: () { Navigator.pop(context); onPin(); }),
              ListTile(leading: Icon(isMuted ? Icons.notifications : Icons.notifications_off), title: Text(isMuted ? 'Unmute' : 'Mute'), onTap: () { Navigator.pop(context); onMute(); }),
              if (unreadCount > 0)
                ListTile(
                  leading: const Icon(Icons.mark_chat_read),
                  title: const Text('Mark as read'),
                  onTap: () async { Navigator.pop(context); await ChatService.updateLastRead(channel.id); },
                ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    if (dt.day == now.day && dt.month == now.month && dt.year == now.year) {
      final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
      return '$h:${dt.minute.toString().padLeft(2, '0')} ${dt.hour >= 12 ? 'PM' : 'AM'}';
    }
    if (now.difference(dt).inDays == 1) return 'Yesterday';
    if (now.difference(dt).inDays < 7) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dt.weekday - 1];
    return '${dt.month}/${dt.day}';
  }
}

// ============================================================================
// CIRCLE TILE
// ============================================================================

class CircleTile extends StatelessWidget {
  final Circle circle;

  const CircleTile({super.key, required this.circle});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final categoryColor = IconMappings.getCircleCategoryColor(circle.category);
    
    return InkWell(
      onTap: () => context.push('/circles/${circle.id}', extra: circle),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: categoryColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: categoryColor.withOpacity(0.3), width: 1),
              ),
              child: Center(child: Text(circle.icon, style: const TextStyle(fontSize: 24))),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          circle.name,
                          style: context.textStyles.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: categoryColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Circle',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: categoryColor),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Icon(Icons.people_outline_rounded, size: 14, color: theme.colorScheme.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Text(
                        '${circle.memberCount} members',
                        style: context.textStyles.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      ),
                      if (circle.description != null && circle.description!.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Text('•', style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            circle.description!,
                            style: context.textStyles.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded, size: 14, color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5)),
          ],
        ),
      ),
    );
  }
}

// OnlineIndicator is imported from lib/widgets/unread_badge.dart
