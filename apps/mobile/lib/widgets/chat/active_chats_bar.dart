import 'package:flutter/material.dart';
import '../../theme.dart';
import '../styled_avatar.dart';

/// Active/Recent chats horizontal bar (Stories-style pattern)
class ActiveChatsBar extends StatelessWidget {
  final List<ActiveChatItem> items;
  final VoidCallback? onNewChatTap;
  final Function(ActiveChatItem)? onItemTap;

  const ActiveChatsBar({
    super.key,
    required this.items,
    this.onNewChatTap,
    this.onItemTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return SizedBox(
      height: 88,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: items.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) {
            return _NewChatButton(onTap: onNewChatTap);
          }
          final item = items[index - 1];
          return _ActiveChatItem(
            item: item,
            onTap: () => onItemTap?.call(item),
          );
        },
      ),
    );
  }
}

class _NewChatButton extends StatelessWidget {
  final VoidCallback? onTap;

  const _NewChatButton({this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    theme.colorScheme.primary,
                    theme.colorScheme.primary.withOpacity(0.7),
                  ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: theme.colorScheme.primary.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(
                Icons.add_rounded,
                color: theme.colorScheme.onPrimary,
                size: 28,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'New',
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _ActiveChatItem extends StatelessWidget {
  final ActiveChatItem item;
  final VoidCallback? onTap;

  const _ActiveChatItem({
    required this.item,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              children: [
                Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: item.hasUnread
                        ? Border.all(
                            color: theme.colorScheme.primary,
                            width: 2,
                          )
                        : null,
                  ),
                  child: StyledAvatar(
                    imageUrl: item.avatarUrl,
                    name: item.name,
                    size: 52,
                  ),
                ),
                if (item.isOnline)
                  Positioned(
                    bottom: 2,
                    right: 2,
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
                if (item.unreadCount > 0)
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 5,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.error,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        item.unreadCount > 99 ? '99+' : '${item.unreadCount}',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.onError,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            SizedBox(
              width: 60,
              child: Text(
                item.name.split(' ').first,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontWeight: item.hasUnread ? FontWeight.w600 : FontWeight.w400,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Data model for active chat items
class ActiveChatItem {
  final String id;
  final String name;
  final String? avatarUrl;
  final bool isOnline;
  final bool hasUnread;
  final int unreadCount;
  final bool isGroup;
  final String? channelId;

  const ActiveChatItem({
    required this.id,
    required this.name,
    this.avatarUrl,
    this.isOnline = false,
    this.hasUnread = false,
    this.unreadCount = 0,
    this.isGroup = false,
    this.channelId,
  });
}
