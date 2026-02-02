import 'package:flutter/material.dart';
import 'package:thittam1hub/models/zone_notification_models.dart';

/// Notification bell with unread count badge
class ZoneNotificationsBell extends StatelessWidget {
  final int unreadCount;
  final VoidCallback? onPressed;

  const ZoneNotificationsBell({
    super.key,
    required this.unreadCount,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return IconButton(
      onPressed: onPressed,
      icon: Stack(
        clipBehavior: Clip.none,
        children: [
          const Icon(Icons.notifications_outlined),
          if (unreadCount > 0)
            Positioned(
              top: -4,
              right: -4,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: theme.colorScheme.error,
                  shape: BoxShape.circle,
                ),
                constraints: const BoxConstraints(
                  minWidth: 16,
                  minHeight: 16,
                ),
                child: Text(
                  unreadCount > 99 ? '99+' : unreadCount.toString(),
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onError,
                    fontSize: 10,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Zone notifications list sheet
class ZoneNotificationsSheet extends StatelessWidget {
  final List<ZoneNotification> notifications;
  final Function(String)? onMarkAsRead;
  final VoidCallback? onMarkAllRead;
  final Function(ZoneNotification)? onNotificationTap;
  final bool isLoading;

  const ZoneNotificationsSheet({
    super.key,
    required this.notifications,
    this.onMarkAsRead,
    this.onMarkAllRead,
    this.onNotificationTap,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final unreadCount = notifications.where((n) => !n.read).length;

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.95,
      minChildSize: 0.4,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle
              Center(
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.onSurfaceVariant.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Icon(Icons.notifications, color: theme.colorScheme.primary),
                    const SizedBox(width: 8),
                    Text(
                      'Zone Notifications',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (unreadCount > 0) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.error,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          unreadCount.toString(),
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.onError,
                          ),
                        ),
                      ),
                    ],
                    const Spacer(),
                    if (unreadCount > 0 && onMarkAllRead != null)
                      TextButton(
                        onPressed: onMarkAllRead,
                        child: const Text('Mark all read'),
                      ),
                  ],
                ),
              ),
              const Divider(),

              // List
              Expanded(
                child: isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : notifications.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.notifications_none,
                                  size: 64,
                                  color: theme.colorScheme.onSurfaceVariant
                                      .withOpacity(0.5),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'No notifications yet',
                                  style: theme.textTheme.bodyLarge?.copyWith(
                                    color: theme.colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
                            controller: scrollController,
                            itemCount: notifications.length,
                            separatorBuilder: (_, __) => const Divider(height: 1),
                            itemBuilder: (context, index) {
                              final notification = notifications[index];
                              return _NotificationTile(
                                notification: notification,
                                onTap: () {
                                  if (!notification.read) {
                                    onMarkAsRead?.call(notification.id);
                                  }
                                  onNotificationTap?.call(notification);
                                },
                              );
                            },
                          ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final ZoneNotification notification;
  final VoidCallback? onTap;

  const _NotificationTile({
    required this.notification,
    this.onTap,
  });

  IconData _getIcon() {
    switch (notification.type) {
      case ZoneNotificationType.announcement:
        return Icons.campaign;
      case ZoneNotificationType.sessionStart:
        return Icons.play_circle;
      case ZoneNotificationType.sessionReminder:
        return Icons.access_time;
      case ZoneNotificationType.pollLive:
        return Icons.bar_chart;
      case ZoneNotificationType.badgeEarned:
        return Icons.emoji_events;
      case ZoneNotificationType.leaderboardRankUp:
        return Icons.trending_up;
      case ZoneNotificationType.streakMilestone:
        return Icons.local_fire_department;
      case ZoneNotificationType.icebreakerNew:
        return Icons.message;
    }
  }

  Color _getIconColor(ThemeData theme) {
    switch (notification.type) {
      case ZoneNotificationType.announcement:
        return Colors.blue;
      case ZoneNotificationType.sessionStart:
        return Colors.green;
      case ZoneNotificationType.sessionReminder:
        return Colors.orange;
      case ZoneNotificationType.pollLive:
        return Colors.purple;
      case ZoneNotificationType.badgeEarned:
        return Colors.amber;
      case ZoneNotificationType.leaderboardRankUp:
        return theme.colorScheme.primary;
      case ZoneNotificationType.streakMilestone:
        return Colors.red;
      case ZoneNotificationType.icebreakerNew:
        return Colors.teal;
    }
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${time.day}/${time.month}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      child: Container(
        color: notification.read
            ? null
            : theme.colorScheme.primaryContainer.withOpacity(0.1),
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: _getIconColor(theme).withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _getIcon(),
                color: _getIconColor(theme),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight:
                                notification.read ? FontWeight.normal : FontWeight.bold,
                          ),
                        ),
                      ),
                      Text(
                        _formatTime(notification.createdAt),
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.body,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (!notification.read)
              Container(
                margin: const EdgeInsets.only(left: 8),
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Notification preferences settings
class ZoneNotificationPreferencesSheet extends StatelessWidget {
  final ZoneNotificationPreferences preferences;
  final Function(ZoneNotificationPreferences)? onSave;

  const ZoneNotificationPreferencesSheet({
    super.key,
    required this.preferences,
    this.onSave,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return StatefulBuilder(
      builder: (context, setState) {
        var currentPrefs = preferences;

        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          maxChildSize: 0.9,
          minChildSize: 0.4,
          builder: (context, scrollController) {
            return Container(
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.all(16),
                children: [
                  // Handle
                  Center(
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.onSurfaceVariant.withOpacity(0.4),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),

                  Text(
                    'Notification Preferences',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 24),

                  SwitchListTile(
                    title: const Text('Announcements'),
                    subtitle: const Text('Event announcements and updates'),
                    value: currentPrefs.announcementsEnabled,
                    onChanged: (value) {
                      setState(() {
                        currentPrefs = currentPrefs.copyWith(
                          announcementsEnabled: value,
                        );
                      });
                    },
                  ),

                  SwitchListTile(
                    title: const Text('Session Reminders'),
                    subtitle: const Text('Reminders before sessions start'),
                    value: currentPrefs.sessionRemindersEnabled,
                    onChanged: (value) {
                      setState(() {
                        currentPrefs = currentPrefs.copyWith(
                          sessionRemindersEnabled: value,
                        );
                      });
                    },
                  ),

                  SwitchListTile(
                    title: const Text('Poll Notifications'),
                    subtitle: const Text('When new polls are available'),
                    value: currentPrefs.pollNotificationsEnabled,
                    onChanged: (value) {
                      setState(() {
                        currentPrefs = currentPrefs.copyWith(
                          pollNotificationsEnabled: value,
                        );
                      });
                    },
                  ),

                  SwitchListTile(
                    title: const Text('Badge Notifications'),
                    subtitle: const Text('When you earn new badges'),
                    value: currentPrefs.badgeNotificationsEnabled,
                    onChanged: (value) {
                      setState(() {
                        currentPrefs = currentPrefs.copyWith(
                          badgeNotificationsEnabled: value,
                        );
                      });
                    },
                  ),

                  SwitchListTile(
                    title: const Text('Leaderboard Updates'),
                    subtitle: const Text('When your rank changes'),
                    value: currentPrefs.leaderboardUpdatesEnabled,
                    onChanged: (value) {
                      setState(() {
                        currentPrefs = currentPrefs.copyWith(
                          leaderboardUpdatesEnabled: value,
                        );
                      });
                    },
                  ),

                  const SizedBox(height: 24),

                  FilledButton(
                    onPressed: () {
                      onSave?.call(currentPrefs);
                      Navigator.of(context).pop();
                    },
                    child: const Text('Save Preferences'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
