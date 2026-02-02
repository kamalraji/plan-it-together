import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:thittam1hub/services/activity_feed_service.dart';
import 'package:thittam1hub/theme.dart';
import 'package:thittam1hub/widgets/shimmer_loading.dart';
import 'package:thittam1hub/widgets/styled_avatar.dart';
import 'package:thittam1hub/utils/time_formatter.dart' as timeago;

/// Live activity feed section showing real-time event happenings
class ActivityFeedSection extends StatefulWidget {
  final String eventId;

  const ActivityFeedSection({super.key, required this.eventId});

  @override
  State<ActivityFeedSection> createState() => _ActivityFeedSectionState();
}

class _ActivityFeedSectionState extends State<ActivityFeedSection>
    with TickerProviderStateMixin {
  final _activityService = ActivityFeedService.instance;
  
  List<ActivityFeedEvent> _activities = [];
  bool _isLoading = true;
  String? _error;
  StreamSubscription<ActivityFeedEvent>? _subscription;

  // Animation controllers
  late AnimationController _listAnimController;
  late AnimationController _newItemController;
  int _newItemIndex = -1;

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _loadActivities();
    _subscribeToRealtime();
  }

  void _initAnimations() {
    _listAnimController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _newItemController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _listAnimController.dispose();
    _newItemController.dispose();
    _subscription?.cancel();
    _activityService.unsubscribe();
    super.dispose();
  }

  Future<void> _loadActivities() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final activities = await _activityService.getRecentActivity(widget.eventId);
      if (mounted) {
        setState(() {
          _activities = activities;
          _isLoading = false;
        });
        _listAnimController.forward();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load activity feed';
          _isLoading = false;
        });
      }
    }
  }

  void _subscribeToRealtime() {
    _activityService.subscribeToEvent(widget.eventId);
    _subscription = _activityService.activityStream.listen((event) {
      if (mounted) {
        HapticFeedback.lightImpact();
        setState(() {
          _activities.insert(0, event);
          _newItemIndex = 0;
          // Keep only last 100 items
          if (_activities.length > 100) {
            _activities = _activities.sublist(0, 100);
          }
        });
        // Animate new item
        _newItemController.forward(from: 0).then((_) {
          if (mounted) setState(() => _newItemIndex = -1);
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    if (_isLoading) {
      return const _ActivitySkeleton();
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: cs.error),
            const SizedBox(height: 16),
            Text(_error!, style: textTheme.bodyMedium),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: _loadActivities,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_activities.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: cs.primaryContainer.withOpacity(0.3),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.timeline_rounded,
                  size: 48,
                  color: cs.primary,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'No Activity Yet',
                style: textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Activity will appear here as people interact with the event',
                style: textTheme.bodyMedium?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadActivities,
      child: ListView.builder(
        padding: EdgeInsets.only(
          top: 16,
          bottom: MediaQuery.of(context).padding.bottom + 100,
        ),
        itemCount: _activities.length,
        itemBuilder: (context, index) {
          final activity = _activities[index];
          final showTimeDivider = index == 0 ||
              !_isSameTimeGroup(_activities[index - 1].createdAt, activity.createdAt);

          // Staggered animation for initial load
          final itemDelay = (index * 0.08).clamp(0.0, 0.7);
          final itemAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
            CurvedAnimation(
              parent: _listAnimController,
              curve: Interval(
                itemDelay,
                (itemDelay + 0.3).clamp(0.0, 1.0),
                curve: Curves.easeOutCubic,
              ),
            ),
          );

          // New item highlight animation
          final isNewItem = index == _newItemIndex;

          Widget itemWidget = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (showTimeDivider)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                  child: Text(
                    _formatTimeGroup(activity.createdAt),
                    style: textTheme.labelSmall?.copyWith(
                      color: cs.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              _ActivityItem(
                activity: activity,
                isNew: isNewItem,
              ),
            ],
          );

          // Apply staggered animation for initial load
          if (!_listAnimController.isCompleted) {
            itemWidget = AnimatedBuilder(
              animation: itemAnimation,
              builder: (context, child) => Transform.translate(
                offset: Offset(0, 24 * (1 - itemAnimation.value)),
                child: Opacity(
                  opacity: itemAnimation.value,
                  child: child,
                ),
              ),
              child: itemWidget,
            );
          }

          // Apply pop-in animation for new realtime items
          if (isNewItem) {
            itemWidget = AnimatedBuilder(
              animation: _newItemController,
              builder: (context, child) {
                final scale = Tween<double>(begin: 0.8, end: 1.0)
                    .animate(CurvedAnimation(
                      parent: _newItemController,
                      curve: Curves.easeOutBack,
                    ));
                final opacity = Tween<double>(begin: 0.0, end: 1.0)
                    .animate(CurvedAnimation(
                      parent: _newItemController,
                      curve: const Interval(0, 0.5),
                    ));
                return Transform.scale(
                  scale: scale.value,
                  child: Opacity(
                    opacity: opacity.value,
                    child: child,
                  ),
                );
              },
              child: itemWidget,
            );
          }

          return itemWidget;
        },
      ),
    );
  }

  bool _isSameTimeGroup(DateTime a, DateTime b) {
    // Group by 5-minute intervals
    return a.year == b.year &&
        a.month == b.month &&
        a.day == b.day &&
        a.hour == b.hour &&
        (a.minute ~/ 5) == (b.minute ~/ 5);
  }

  String _formatTimeGroup(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 5) {
      return 'Just now';
    } else if (diff.inHours < 1) {
      return '${diff.inMinutes} minutes ago';
    } else if (time.day == now.day) {
      return 'Today at ${_formatTime(time)}';
    } else if (time.day == now.day - 1) {
      return 'Yesterday at ${_formatTime(time)}';
    } else {
      return timeago.format(time);
    }
  }

  String _formatTime(DateTime time) {
    final hour = time.hour > 12 ? time.hour - 12 : time.hour;
    final minute = time.minute.toString().padLeft(2, '0');
    final period = time.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $period';
  }
}

/// Activity item widget with micro-interactions
class _ActivityItem extends StatefulWidget {
  final ActivityFeedEvent activity;
  final bool isNew;

  const _ActivityItem({
    required this.activity,
    this.isNew = false,
  });

  @override
  State<_ActivityItem> createState() => _ActivityItemState();
}

class _ActivityItemState extends State<_ActivityItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _tapController;
  late Animation<double> _tapScale;

  @override
  void initState() {
    super.initState();
    _tapController = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _tapScale = Tween<double>(begin: 1.0, end: 0.98).animate(
      CurvedAnimation(parent: _tapController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _tapController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final (icon, color) = _getActivityIconAndColor(widget.activity.activityType);

    return GestureDetector(
      onTapDown: (_) => _tapController.forward(),
      onTapUp: (_) => _tapController.reverse(),
      onTapCancel: () => _tapController.reverse(),
      child: AnimatedBuilder(
        animation: _tapScale,
        builder: (context, child) => Transform.scale(
          scale: _tapScale.value,
          child: child,
        ),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: widget.isNew
                ? color.withOpacity(0.15)
                : widget.activity.isHighlighted
                    ? color.withOpacity(0.1)
                    : cs.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: widget.isNew
                  ? color.withOpacity(0.4)
                  : widget.activity.isHighlighted
                      ? color.withOpacity(0.3)
                      : cs.outline.withOpacity(0.1),
              width: widget.isNew ? 2 : 1,
            ),
            boxShadow: widget.isNew
                ? [
                    BoxShadow(
                      color: color.withOpacity(0.2),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Row(
            children: [
              // Animated activity icon
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0.8, end: 1.0),
                duration: const Duration(milliseconds: 400),
                curve: Curves.easeOutBack,
                builder: (context, value, child) => Transform.scale(
                  scale: value,
                  child: child,
                ),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, size: 18, color: color),
                ),
              ),
              const SizedBox(width: 12),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text.rich(
                      TextSpan(
                        children: [
                          if (widget.activity.userProfile?.fullName != null)
                            TextSpan(
                              text: widget.activity.userProfile!.fullName!,
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                          if (widget.activity.userProfile?.fullName != null)
                            const TextSpan(text: ' '),
                          TextSpan(text: widget.activity.title),
                        ],
                      ),
                      style: textTheme.bodyMedium,
                    ),
                    if (widget.activity.description != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          widget.activity.description!,
                          style: textTheme.bodySmall?.copyWith(
                            color: cs.onSurfaceVariant,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                  ],
                ),
              ),

              // Timestamp with "NEW" badge for realtime items
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (widget.isNew)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      margin: const EdgeInsets.only(bottom: 4),
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'NEW',
                        style: textTheme.labelSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 9,
                        ),
                      ),
                    ),
                  Text(
                    _formatRelativeTime(widget.activity.createdAt),
                    style: textTheme.labelSmall?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  (IconData, Color) _getActivityIconAndColor(ActivityType type) {
    switch (type) {
      case ActivityType.checkIn:
        return (Icons.login_rounded, Colors.green);
      case ActivityType.checkOut:
        return (Icons.logout_rounded, Colors.grey);
      case ActivityType.pollVote:
        return (Icons.how_to_vote_rounded, Colors.purple);
      case ActivityType.pollResult:
        return (Icons.poll_rounded, Colors.purple);
      case ActivityType.sessionStart:
        return (Icons.play_circle_rounded, Colors.blue);
      case ActivityType.sessionEnd:
        return (Icons.stop_circle_rounded, Colors.blueGrey);
      case ActivityType.achievement:
        return (Icons.emoji_events_rounded, Colors.amber);
      case ActivityType.announcement:
        return (Icons.campaign_rounded, Colors.red);
      case ActivityType.icebreakerResponse:
        return (Icons.wb_sunny_rounded, Colors.cyan);
      case ActivityType.milestone:
        return (Icons.flag_rounded, Colors.orange);
      case ActivityType.sponsorVisit:
        return (Icons.storefront_rounded, Colors.indigo);
    }
  }

  String _formatRelativeTime(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inSeconds < 60) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}

/// Enhanced loading skeleton with staggered shimmer
class _ActivitySkeleton extends StatelessWidget {
  const _ActivitySkeleton();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Time group header skeleton
          ShimmerLoading(
            child: Container(
              width: 80,
              height: 12,
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          const SizedBox(height: 12),
          
          // Activity items with varying widths for realism
          ...List.generate(6, (index) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: ShimmerLoading(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: cs.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: cs.outline.withOpacity(0.05)),
                ),
                child: Row(
                  children: [
                    // Icon skeleton
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerHighest,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Content skeleton
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 120 + (index * 15.0) % 80,
                            height: 14,
                            decoration: BoxDecoration(
                              color: cs.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            width: 80 + (index * 20.0) % 60,
                            height: 10,
                            decoration: BoxDecoration(
                              color: cs.surfaceContainerHigh,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Timestamp skeleton
                    Container(
                      width: 24,
                      height: 12,
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerHigh,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )),
        ],
      ),
    );
  }
}
