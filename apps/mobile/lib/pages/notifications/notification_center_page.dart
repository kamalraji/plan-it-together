import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:thittam1hub/models/models.dart' show NotificationPreferences;
import 'package:thittam1hub/models/notification_item.dart';
import 'package:thittam1hub/nav.dart';
import 'package:thittam1hub/services/notification_service.dart';
import 'package:thittam1hub/widgets/branded_refresh_indicator.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';
import 'package:thittam1hub/widgets/glassmorphism_bottom_sheet.dart';
import 'package:thittam1hub/theme.dart';

/// Notification Center page with category filtering
/// 
/// Supports deep linking via `?category=` query parameter.
/// Valid categories: all, followers, reactions, invites, achievements, matches
class NotificationCenterPage extends StatefulWidget {
  /// Category name for deep linking (e.g., 'reactions', 'followers')
  final String? initialCategory;

  const NotificationCenterPage({super.key, this.initialCategory});

  @override
  State<NotificationCenterPage> createState() => _NotificationCenterPageState();
}

class _NotificationCenterPageState extends State<NotificationCenterPage> {
  final NotificationService _notificationService = NotificationService.instance;
  List<NotificationItem> _notifications = [];
  bool _isLoading = true;
  NotificationType? _selectedCategory;
  NotificationPreferences? _preferences;

  // Category name to NotificationType mapping
  static const Map<String, NotificationType?> _categoryNameMap = {
    'all': null,
    'followers': NotificationType.followRequest,
    'reactions': NotificationType.sparkReaction,
    'invites': NotificationType.circleInvite,
    'achievements': NotificationType.newBadge,
    'matches': NotificationType.highMatchOnline,
  };

  // Category filters with icons
  static const Map<NotificationType?, ({String label, IconData icon, String name})> _categoryFilters = {
    null: (label: 'All', icon: Icons.all_inbox_rounded, name: 'all'),
    NotificationType.followRequest: (label: 'Followers', icon: Icons.person_add_rounded, name: 'followers'),
    NotificationType.sparkReaction: (label: 'Reactions', icon: Icons.favorite_rounded, name: 'reactions'),
    NotificationType.circleInvite: (label: 'Invites', icon: Icons.groups_rounded, name: 'invites'),
    NotificationType.newBadge: (label: 'Achievements', icon: Icons.emoji_events_rounded, name: 'achievements'),
    NotificationType.highMatchOnline: (label: 'Matches', icon: Icons.local_fire_department_rounded, name: 'matches'),
  };

  /// Syncs current category state to URL
  void _syncUrlState() {
    if (!mounted) return;
    final categoryName = _categoryFilters[_selectedCategory]?.name ?? 'all';
    context.replace(AppRoutes.notificationsWithCategory(categoryName == 'all' ? null : categoryName));
  }

  @override
  void initState() {
    super.initState();
    // Initialize category from deep link
    if (widget.initialCategory != null) {
      _selectedCategory = _categoryNameMap[widget.initialCategory!.toLowerCase()];
    }
    _loadNotifications();
    _loadPreferences();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    final notifications = await _notificationService.getNotifications();
    if (mounted) {
      setState(() {
        _notifications = notifications;
        _isLoading = false;
      });
    }
  }

  Future<void> _loadPreferences() async {
    final prefs = await _notificationService.getPreferences();
    if (mounted) {
      setState(() => _preferences = prefs);
    }
  }

  List<NotificationItem> get _filteredNotifications {
    if (_selectedCategory == null) return _notifications;
    return _notifications.where((n) => n.type == _selectedCategory).toList();
  }

  Future<void> _markAllAsRead() async {
    HapticFeedback.mediumImpact();
    await _notificationService.markAllAsRead();
    setState(() {
      _notifications = _notifications
          .map((n) => n.copyWith(isRead: true))
          .toList();
    });
  }

  Future<void> _deleteNotification(NotificationItem notification) async {
    HapticFeedback.lightImpact();
    await _notificationService.deleteNotification(notification.id);
    setState(() {
      _notifications.removeWhere((n) => n.id == notification.id);
    });
  }

  void _onNotificationTap(NotificationItem notification) async {
    // Mark as read
    if (!notification.isRead) {
      await _notificationService.markAsRead(notification.id);
      setState(() {
        final index = _notifications.indexWhere((n) => n.id == notification.id);
        if (index >= 0) {
          _notifications[index] = notification.copyWith(isRead: true);
        }
      });
    }

    // Navigate based on action URL
    if (notification.actionUrl != null && mounted) {
      context.push(notification.actionUrl!);
    }
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  void _showPreferencesSheet() {
    final prefs = _preferences;
    if (prefs == null) return;
    
    showGlassBottomSheet(
      context: context,
      title: 'Notification Preferences',
      child: _NotificationPreferencesSheet(
        preferences: prefs,
        onPreferenceChanged: (key, value) async {
          await _notificationService.updatePreference(key, value);
          _loadPreferences();
        },
        onClearAll: () async {
          await _notificationService.clearAllNotifications();
          setState(() => _notifications = []);
          if (mounted) Navigator.pop(context);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: cs.surface,
      appBar: AppBar(
        backgroundColor: cs.surface,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'Notifications',
          style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        actions: [
          TextButton.icon(
            onPressed: _notifications.any((n) => !n.isRead) ? _markAllAsRead : null,
            icon: Icon(Icons.done_all_rounded, size: 18, color: cs.primary),
            label: Text(
              'Read all',
              style: TextStyle(color: cs.primary, fontSize: 13),
            ),
          ),
          IconButton(
            icon: Icon(Icons.settings_outlined, color: cs.onSurfaceVariant),
            onPressed: _showPreferencesSheet,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: BrandedRefreshIndicator(
        onRefresh: _loadNotifications,
        child: CustomScrollView(
          slivers: [
            // Category Filter Chips
            SliverToBoxAdapter(
              child: SizedBox(
                height: AppLayout.filterChipsHeight,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: EdgeInsets.symmetric(horizontal: context.horizontalPadding),
                  itemCount: _categoryFilters.length,
                  itemBuilder: (context, index) {
                    final entry = _categoryFilters.entries.elementAt(index);
                    final isSelected = _selectedCategory == entry.key;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: _CategoryChip(
                        label: entry.value.label,
                        icon: entry.value.icon,
                        isSelected: isSelected,
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() => _selectedCategory = entry.key);
                          _syncUrlState();
                        },
                      ),
                    );
                  },
                ),
              ),
            ),

            // Loading State
            if (_isLoading)
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => const _NotificationCardSkeleton(),
                    childCount: 6,
                  ),
                ),
              )
            // Empty State
            else if (_filteredNotifications.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: _EmptyNotifications(
                  category: _selectedCategory,
                  onClearFilter: () => setState(() => _selectedCategory = null),
                ),
              )
            // Grouped Notifications
            else
              ..._buildGroupedNotifications(),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildGroupedNotifications() {
    final today = DateTime.now();
    final yesterday = today.subtract(const Duration(days: 1));

    final todayItems = _filteredNotifications.where(
      (n) => _isSameDay(n.createdAt, today),
    ).toList();

    final yesterdayItems = _filteredNotifications.where(
      (n) => _isSameDay(n.createdAt, yesterday),
    ).toList();

    final earlierItems = _filteredNotifications.where(
      (n) => !_isSameDay(n.createdAt, today) && !_isSameDay(n.createdAt, yesterday),
    ).toList();

    return [
      if (todayItems.isNotEmpty) ...[
        _SectionHeader(title: 'Today'),
        _NotificationList(
          notifications: todayItems,
          onTap: _onNotificationTap,
          onDelete: _deleteNotification,
        ),
      ],
      if (yesterdayItems.isNotEmpty) ...[
        _SectionHeader(title: 'Yesterday'),
        _NotificationList(
          notifications: yesterdayItems,
          onTap: _onNotificationTap,
          onDelete: _deleteNotification,
        ),
      ],
      if (earlierItems.isNotEmpty) ...[
        _SectionHeader(title: 'Earlier'),
        _NotificationList(
          notifications: earlierItems,
          onTap: _onNotificationTap,
          onDelete: _deleteNotification,
        ),
      ],
    ];
  }
}

// ============================================
// SECTION HEADER
// ============================================
class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: cs.onSurfaceVariant,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}

// ============================================
// NOTIFICATION LIST
// ============================================
class _NotificationList extends StatelessWidget {
  final List<NotificationItem> notifications;
  final Function(NotificationItem) onTap;
  final Function(NotificationItem) onDelete;

  const _NotificationList({
    required this.notifications,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) => _NotificationCard(
            notification: notifications[index],
            onTap: () => onTap(notifications[index]),
            onDelete: () => onDelete(notifications[index]),
          ),
          childCount: notifications.length,
        ),
      ),
    );
  }
}

// ============================================
// NOTIFICATION CARD
// ============================================
class _NotificationCard extends StatelessWidget {
  final NotificationItem notification;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _NotificationCard({
    required this.notification,
    required this.onTap,
    required this.onDelete,
  });

  IconData _getTypeIcon() {
    switch (notification.type) {
      // Follower notifications (with legacy fallbacks)
      case NotificationType.newFollower:
        return Icons.person_add_rounded;
      case NotificationType.followRequest:
      case NotificationType.connectionRequest:
        return Icons.person_add_rounded;
      case NotificationType.followAccepted:
      case NotificationType.connectionAccepted:
        return Icons.how_to_reg_rounded;
      case NotificationType.mutualFollow:
      case NotificationType.mutualConnection:
        return Icons.sync_alt_rounded;
      // Social notifications
      case NotificationType.circleInvite:
        return Icons.groups_rounded;
      case NotificationType.sparkReaction:
        return Icons.favorite_rounded;
      case NotificationType.highMatchOnline:
        return Icons.local_fire_department_rounded;
      // Comment notifications
      case NotificationType.comment:
      case NotificationType.commentReply:
        return Icons.chat_bubble_rounded;
      case NotificationType.mention:
        return Icons.alternate_email_rounded;
      // Achievement notifications
      case NotificationType.newBadge:
        return Icons.emoji_events_rounded;
      case NotificationType.levelUp:
        return Icons.arrow_upward_rounded;
      // Group notifications
      case NotificationType.groupInvite:
      case NotificationType.groupMemberJoined:
      case NotificationType.groupMemberLeft:
      case NotificationType.groupRoleChanged:
      case NotificationType.groupRemoved:
      case NotificationType.groupEvent:
        return Icons.group_rounded;
      // System notifications
      case NotificationType.system:
      case NotificationType.eventReminder:
      case NotificationType.workspaceUpdate:
        return Icons.notifications_rounded;
    }
  }

  Color _getTypeColor(ColorScheme cs) {
    switch (notification.type) {
      // Follower notifications (with legacy fallbacks)
      case NotificationType.newFollower:
      case NotificationType.followRequest:
      case NotificationType.connectionRequest:
      case NotificationType.followAccepted:
      case NotificationType.connectionAccepted:
        return cs.primary;
      case NotificationType.mutualFollow:
      case NotificationType.mutualConnection:
        return Colors.greenAccent;
      // Social notifications
      case NotificationType.circleInvite:
        return cs.secondary;
      case NotificationType.sparkReaction:
        return Colors.redAccent;
      case NotificationType.highMatchOnline:
        return Colors.orangeAccent;
      // Comment notifications
      case NotificationType.comment:
      case NotificationType.commentReply:
      case NotificationType.mention:
        return cs.tertiary;
      // Achievement notifications
      case NotificationType.newBadge:
      case NotificationType.levelUp:
        return Colors.amber;
      // Group notifications
      case NotificationType.groupInvite:
      case NotificationType.groupMemberJoined:
      case NotificationType.groupMemberLeft:
      case NotificationType.groupRoleChanged:
      case NotificationType.groupRemoved:
      case NotificationType.groupEvent:
        return cs.tertiary;
      // System notifications
      case NotificationType.system:
      case NotificationType.eventReminder:
      case NotificationType.workspaceUpdate:
        return cs.onSurfaceVariant;
    }
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    
    if (diff.inMinutes < 1) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return '${time.month}/${time.day}';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final typeColor = _getTypeColor(cs);

    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: cs.error,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(Icons.delete_rounded, color: cs.onError),
      ),
      onDismissed: (_) => onDelete(),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: notification.isRead
                ? (isDark ? cs.surfaceContainerHigh : cs.surfaceContainerLow)
                : (isDark ? cs.primary.withOpacity(0.08) : cs.primary.withOpacity(0.05)),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: notification.isRead
                  ? cs.outline.withOpacity(0.1)
                  : cs.primary.withOpacity(0.2),
            ),
          ),
          child: Row(
            children: [
              // Avatar or Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: typeColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: notification.avatarUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Image.network(
                          notification.avatarUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Icon(
                            _getTypeIcon(),
                            color: typeColor,
                            size: 22,
                          ),
                        ),
                      )
                    : Icon(_getTypeIcon(), color: typeColor, size: 22),
              ),
              const SizedBox(width: 12),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notification.title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: notification.isRead ? FontWeight.w500 : FontWeight.w600,
                        color: cs.onSurface,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      notification.message,
                      style: TextStyle(
                        fontSize: 13,
                        color: cs.onSurfaceVariant,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Time and Unread indicator
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _formatTime(notification.createdAt),
                    style: TextStyle(
                      fontSize: 11,
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                  if (!notification.isRead) ...[
                    const SizedBox(height: 6),
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: cs.primary,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ============================================
// NOTIFICATION CARD SKELETON
// ============================================
class _NotificationCardSkeleton extends StatelessWidget {
  const _NotificationCardSkeleton();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          ShimmerLoading(
            child: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: cs.outline.withOpacity(0.1),
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerLoading(
                  child: Container(
                    height: 14,
                    width: 120,
                    decoration: BoxDecoration(
                      color: cs.outline.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                ShimmerLoading(
                  child: Container(
                    height: 12,
                    width: 180,
                    decoration: BoxDecoration(
                      color: cs.outline.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================
// CATEGORY CHIP
// ============================================
class _CategoryChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? cs.primary
              : isDark
                  ? cs.surfaceContainerHighest
                  : cs.surfaceContainerLow,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? Colors.transparent : cs.outline.withOpacity(0.2),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? cs.onPrimary : cs.onSurfaceVariant,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? cs.onPrimary : cs.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================
// EMPTY STATE
// ============================================
class _EmptyNotifications extends StatelessWidget {
  final NotificationType? category;
  final VoidCallback onClearFilter;

  const _EmptyNotifications({
    required this.category,
    required this.onClearFilter,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: cs.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.notifications_off_outlined,
              size: 48,
              color: cs.primary,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            category != null ? 'No ${_categoryFilters[category]?.label ?? ''} notifications' : 'All caught up!',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: cs.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            category != null 
                ? 'Try a different filter'
                : 'You have no notifications right now',
            style: TextStyle(
              fontSize: 14,
              color: cs.onSurfaceVariant,
            ),
          ),
          if (category != null) ...[
            const SizedBox(height: 24),
            OutlinedButton(
              onPressed: onClearFilter,
              child: const Text('Clear filter'),
            ),
          ],
        ],
      ),
    );
  }

  static const Map<NotificationType?, ({String label, IconData icon, String name})> _categoryFilters = 
      _NotificationCenterPageState._categoryFilters;
}

// ============================================
// PREFERENCES SHEET
// ============================================
class _NotificationPreferencesSheet extends StatefulWidget {
  final NotificationPreferences preferences;
  final Function(String key, bool value) onPreferenceChanged;
  final VoidCallback onClearAll;

  const _NotificationPreferencesSheet({
    required this.preferences,
    required this.onPreferenceChanged,
    required this.onClearAll,
  });

  @override
  State<_NotificationPreferencesSheet> createState() => _NotificationPreferencesSheetState();
}

class _NotificationPreferencesSheetState extends State<_NotificationPreferencesSheet> {
  late NotificationPreferences _prefs;

  @override
  void initState() {
    super.initState();
    _prefs = widget.preferences;
  }

  void _updatePref(String key, bool value) {
    HapticFeedback.selectionClick();
    widget.onPreferenceChanged(key, value);
    setState(() {
      switch (key) {
        case 'connection_requests':
          _prefs = _prefs.copyWith(followRequests: value);
          break;
        case 'connection_accepted':
          _prefs = _prefs.copyWith(followAccepted: value);
          break;
        case 'circle_invites':
          _prefs = _prefs.copyWith(circleInvites: value);
          break;
        case 'spark_reactions':
          _prefs = _prefs.copyWith(sparkReactions: value);
          break;
        case 'achievements':
          _prefs = _prefs.copyWith(achievements: value);
          break;
        case 'high_match_online':
          _prefs = _prefs.copyWith(highMatchOnline: value);
          break;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _PreferenceToggle(
          icon: Icons.person_add_rounded,
          title: 'Follow Requests',
          subtitle: 'When someone wants to follow you',
          value: _prefs.followRequests,
          onChanged: (v) => _updatePref('connection_requests', v),
        ),
        _PreferenceToggle(
          icon: Icons.how_to_reg_rounded,
          title: 'Follow Accepted',
          subtitle: 'When your follow request is accepted',
          value: _prefs.followAccepted,
          onChanged: (v) => _updatePref('connection_accepted', v),
        ),
        _PreferenceToggle(
          icon: Icons.groups_rounded,
          title: 'Circle Invites',
          subtitle: 'Invitations to join circles',
          value: _prefs.circleInvites,
          onChanged: (v) => _updatePref('circle_invites', v),
        ),
        _PreferenceToggle(
          icon: Icons.favorite_rounded,
          title: 'Spark Reactions',
          subtitle: 'When someone sparks your posts',
          value: _prefs.sparkReactions,
          onChanged: (v) => _updatePref('spark_reactions', v),
        ),
        _PreferenceToggle(
          icon: Icons.emoji_events_rounded,
          title: 'Achievements',
          subtitle: 'Badges, level ups, and milestones',
          value: _prefs.achievements,
          onChanged: (v) => _updatePref('achievements', v),
        ),
        _PreferenceToggle(
          icon: Icons.local_fire_department_rounded,
          title: 'High Match Online',
          subtitle: 'When 70%+ matches come online',
          value: _prefs.highMatchOnline,
          onChanged: (v) => _updatePref('high_match_online', v),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () {
              HapticFeedback.heavyImpact();
              widget.onClearAll();
            },
            icon: Icon(Icons.clear_all_rounded, color: cs.error),
            label: Text(
              'Clear All Notifications',
              style: TextStyle(color: cs.error),
            ),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: cs.error.withOpacity(0.5)),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}

class _PreferenceToggle extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _PreferenceToggle({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: cs.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: cs.primary, size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
      ),
      trailing: Switch.adaptive(
        value: value,
        onChanged: onChanged,
        activeColor: cs.primary,
      ),
    );
  }
}
