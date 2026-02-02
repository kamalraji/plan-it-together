import 'dart:async';
import 'package:flutter/material.dart';
import 'package:thittam1hub/theme.dart';
import '../chat_page_controller.dart';

// ============================================================================
// TAB BAR DELEGATE
// ============================================================================

class ChatTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabController tabController;
  final int dmUnread;
  final int groupUnread;
  final int channelUnread;

  ChatTabBarDelegate({
    required this.tabController,
    required this.dmUnread,
    required this.groupUnread,
    required this.channelUnread,
  });

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final theme = Theme.of(context);
    
    return Container(
      color: theme.scaffoldBackgroundColor,
      child: TabBar(
        controller: tabController,
        labelColor: theme.colorScheme.primary,
        unselectedLabelColor: theme.colorScheme.onSurfaceVariant,
        indicatorColor: theme.colorScheme.primary,
        indicatorSize: TabBarIndicatorSize.label,
        labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
        tabs: [
          const Tab(text: 'All'),
          TabWithBadge(label: 'Direct', count: dmUnread),
          TabWithBadge(label: 'Groups', count: groupUnread),
          TabWithBadge(label: 'Channels', count: channelUnread),
        ],
      ),
    );
  }

  @override
  double get maxExtent => 48;
  @override
  double get minExtent => 48;
  @override
  bool shouldRebuild(covariant ChatTabBarDelegate oldDelegate) =>
      dmUnread != oldDelegate.dmUnread ||
      groupUnread != oldDelegate.groupUnread ||
      channelUnread != oldDelegate.channelUnread;
}

class TabWithBadge extends StatelessWidget {
  final String label;
  final int count;

  const TabWithBadge({super.key, required this.label, required this.count});

  @override
  Widget build(BuildContext context) {
    return Tab(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label),
          if (count > 0) ...[
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.error,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                count > 99 ? '99+' : '$count',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onError,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ============================================================================
// ENHANCED SEARCH BAR
// ============================================================================

class EnhancedSearchBar extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final VoidCallback? onClear;
  
  const EnhancedSearchBar({
    super.key,
    required this.controller, 
    required this.onChanged,
    this.onClear,
  });
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Row(children: [
        Icon(
          Icons.search_rounded,
          color: theme.colorScheme.onSurfaceVariant,
          size: 20,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: TextField(
            controller: controller,
            onChanged: onChanged,
            style: context.textStyles.bodyMedium,
            decoration: InputDecoration(
              hintText: 'Search messages, people...',
              hintStyle: context.textStyles.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant.withOpacity(0.6),
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
        if (controller.text.isNotEmpty)
          GestureDetector(
            onTap: () {
              controller.clear();
              onChanged('');
              onClear?.call();
            },
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.close_rounded,
                size: 16,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
      ]),
    );
  }
}

// ============================================================================
// FILTER DROPDOWN
// ============================================================================

class FilterDropdown extends StatelessWidget {
  final ChatListFilter value;
  final ValueChanged<ChatListFilter> onChanged;
  
  const FilterDropdown({super.key, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return PopupMenuButton<ChatListFilter>(
      initialValue: value,
      onSelected: onChanged,
      offset: const Offset(0, 45),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.filter_list_rounded, size: 18, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(width: 6),
            Text(
              _filterLabel(value),
              style: context.textStyles.labelMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
      itemBuilder: (_) => [
        _buildItem(ChatListFilter.all, 'All', Icons.all_inbox_rounded),
        _buildItem(ChatListFilter.unread, 'Unread', Icons.mark_email_unread_rounded),
        _buildItem(ChatListFilter.media, 'With Media', Icons.photo_library_rounded),
        _buildItem(ChatListFilter.pinned, 'Pinned', Icons.push_pin_rounded),
        _buildItem(ChatListFilter.muted, 'Muted', Icons.notifications_off_rounded),
        _buildItem(ChatListFilter.archived, 'Archived', Icons.archive_rounded),
      ],
    );
  }

  PopupMenuItem<ChatListFilter> _buildItem(ChatListFilter filter, String label, IconData icon) {
    return PopupMenuItem(
      value: filter,
      child: Row(
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: 10),
          Text(label),
        ],
      ),
    );
  }

  String _filterLabel(ChatListFilter f) => switch (f) {
    ChatListFilter.all => 'All',
    ChatListFilter.unread => 'Unread',
    ChatListFilter.media => 'Media',
    ChatListFilter.pinned => 'Pinned',
    ChatListFilter.muted => 'Muted',
    ChatListFilter.archived => 'Archived',
  };
}

// ============================================================================
// CONNECTION BANNER
// ============================================================================

class ConnectionBanner extends StatelessWidget {
  final bool isConnected;

  const ConnectionBanner({super.key, required this.isConnected});

  @override
  Widget build(BuildContext context) {
    if (isConnected) return const SizedBox.shrink();
    
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer,
        border: Border(
          bottom: BorderSide(color: theme.colorScheme.error.withOpacity(0.2)),
        ),
      ),
      child: Row(
        children: [
          Icon(Icons.wifi_off_rounded, color: theme.colorScheme.error, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'No internet connection',
              style: context.textStyles.bodySmall?.copyWith(
                color: theme.colorScheme.onErrorContainer,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Text(
            'Messages will be sent when online',
            style: context.textStyles.labelSmall?.copyWith(
              color: theme.colorScheme.onErrorContainer.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }
}
