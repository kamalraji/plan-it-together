import 'package:flutter/material.dart';
import 'package:thittam1hub/services/offline_action_queue.dart';
import 'package:thittam1hub/services/connectivity_service.dart';

/// A compact indicator that shows pending offline actions
/// Use in AppBars or anywhere sync status needs to be visible
class PendingSyncIndicator extends StatefulWidget {
  final bool showWhenEmpty;
  final VoidCallback? onTap;

  const PendingSyncIndicator({
    super.key,
    this.showWhenEmpty = false,
    this.onTap,
  });

  @override
  State<PendingSyncIndicator> createState() => _PendingSyncIndicatorState();
}

class _PendingSyncIndicatorState extends State<PendingSyncIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  int _pendingCount = 0;
  bool _isOnline = true;

  @override
  void initState() {
    super.initState();
    
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _updateState();
    
    // Listen for queue changes
    OfflineActionQueue.instance.addOnQueueChangedListener(_updateState);
  }

  void _updateState() {
    if (!mounted) return;
    
    setState(() {
      _pendingCount = OfflineActionQueue.instance.pendingCount;
      _isOnline = ConnectivityService.instance.isOnline;
    });

    // Pulse animation when offline with pending actions
    if (!_isOnline && _pendingCount > 0) {
      _pulseController.repeat(reverse: true);
    } else {
      _pulseController.stop();
      _pulseController.reset();
    }
  }

  @override
  void dispose() {
    OfflineActionQueue.instance.removeOnQueueChangedListener(_updateState);
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_pendingCount == 0 && !widget.showWhenEmpty) {
      return const SizedBox.shrink();
    }

    final colorScheme = Theme.of(context).colorScheme;
    final isOffline = !_isOnline;

    return GestureDetector(
      onTap: widget.onTap ?? () => _showPendingActionsSheet(context),
      child: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: isOffline ? _pulseAnimation.value : 1.0,
            child: child,
          );
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: isOffline 
                ? colorScheme.errorContainer.withOpacity(0.9)
                : colorScheme.primaryContainer.withOpacity(0.9),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isOffline
                  ? colorScheme.error.withOpacity(0.3)
                  : colorScheme.primary.withOpacity(0.3),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: (isOffline ? colorScheme.error : colorScheme.primary)
                    .withOpacity(0.2),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isOffline ? Icons.cloud_off_rounded : Icons.cloud_sync_rounded,
                size: 16,
                color: isOffline
                    ? colorScheme.onErrorContainer
                    : colorScheme.onPrimaryContainer,
              ),
              const SizedBox(width: 6),
              Text(
                _pendingCount > 0 ? '$_pendingCount pending' : 'Synced',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isOffline
                      ? colorScheme.onErrorContainer
                      : colorScheme.onPrimaryContainer,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showPendingActionsSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => const _PendingActionsSheet(),
    );
  }
}

/// Bottom sheet showing pending action details
class _PendingActionsSheet extends StatefulWidget {
  const _PendingActionsSheet();

  @override
  State<_PendingActionsSheet> createState() => _PendingActionsSheetState();
}

class _PendingActionsSheetState extends State<_PendingActionsSheet> {
  List<OfflineAction> _actions = [];
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    _loadActions();
    OfflineActionQueue.instance.addOnQueueChangedListener(_loadActions);
  }

  @override
  void dispose() {
    OfflineActionQueue.instance.removeOnQueueChangedListener(_loadActions);
    super.dispose();
  }

  void _loadActions() {
    if (!mounted) return;
    setState(() {
      _actions = OfflineActionQueue.instance.getPendingActions();
    });
  }

  Future<void> _syncNow() async {
    if (_isSyncing) return;
    
    setState(() => _isSyncing = true);
    
    try {
      await OfflineActionQueue.instance.forceSyncNow();
    } finally {
      if (mounted) {
        setState(() => _isSyncing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isOnline = ConnectivityService.instance.isOnline;

    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: colorScheme.onSurfaceVariant.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Icon(
                  Icons.cloud_sync_rounded,
                  color: colorScheme.primary,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Pending Sync',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: colorScheme.onSurface,
                        ),
                      ),
                      Text(
                        isOnline 
                            ? '${_actions.length} actions waiting'
                            : 'Offline - will sync when connected',
                        style: TextStyle(
                          fontSize: 13,
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                if (isOnline && _actions.isNotEmpty)
                  TextButton.icon(
                    onPressed: _isSyncing ? null : _syncNow,
                    icon: _isSyncing
                        ? SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: colorScheme.primary,
                            ),
                          )
                        : const Icon(Icons.sync_rounded, size: 18),
                    label: Text(_isSyncing ? 'Syncing...' : 'Sync Now'),
                  ),
              ],
            ),
          ),
          
          // Action list
          if (_actions.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 32),
              child: Column(
                children: [
                  Icon(
                    Icons.check_circle_outline_rounded,
                    size: 48,
                    color: colorScheme.primary.withOpacity(0.5),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'All synced!',
                    style: TextStyle(
                      fontSize: 16,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            )
          else
            ConstrainedBox(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.4,
              ),
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                itemCount: _actions.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final action = _actions[index];
                  return _ActionTile(
                    action: action,
                    onCancel: () async {
                      await OfflineActionQueue.instance.cancelAction(action.id);
                    },
                  );
                },
              ),
            ),
          
          SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
        ],
      ),
    );
  }
}

/// Individual action tile in the pending list
class _ActionTile extends StatelessWidget {
  final OfflineAction action;
  final VoidCallback onCancel;

  const _ActionTile({
    required this.action,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    
    final (icon, label, description) = _getActionInfo();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: colorScheme.outlineVariant.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 18, color: colorScheme.onPrimaryContainer),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                  ),
                ),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 12,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          if (action.retryCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '${action.retryCount}x',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: colorScheme.onErrorContainer,
                ),
              ),
            ),
          IconButton(
            onPressed: onCancel,
            icon: Icon(
              Icons.close_rounded,
              size: 18,
              color: colorScheme.onSurfaceVariant,
            ),
            style: IconButton.styleFrom(
              padding: const EdgeInsets.all(4),
              minimumSize: const Size(28, 28),
            ),
          ),
        ],
      ),
    );
  }

  (IconData, String, String) _getActionInfo() {
    switch (action.type) {
      case OfflineActionType.saveEvent:
        return (
          Icons.bookmark_add_rounded,
          'Save Event',
          'Event will be bookmarked',
        );
      case OfflineActionType.unsaveEvent:
        return (
          Icons.bookmark_remove_rounded,
          'Remove Bookmark',
          'Event will be removed from saved',
        );
      case OfflineActionType.sparkPost:
        return (
          Icons.bolt_rounded,
          'Spark Post',
          'Reaction will be added',
        );
      case OfflineActionType.toggleReminder:
        final enabled = action.payload['enabled'] == true;
        return (
          enabled ? Icons.notifications_active_rounded : Icons.notifications_off_rounded,
          enabled ? 'Enable Reminder' : 'Disable Reminder',
          'Reminder preference will update',
        );
      case OfflineActionType.addComment:
        return (
          Icons.comment_rounded,
          'Add Comment',
          'Comment will be posted',
        );
    }
  }
}

/// Compact badge-only indicator for tight spaces (like AppBar actions)
class PendingSyncBadge extends StatefulWidget {
  final Widget child;
  
  const PendingSyncBadge({
    super.key,
    required this.child,
  });

  @override
  State<PendingSyncBadge> createState() => _PendingSyncBadgeState();
}

class _PendingSyncBadgeState extends State<PendingSyncBadge> {
  int _count = 0;

  @override
  void initState() {
    super.initState();
    _updateCount();
    OfflineActionQueue.instance.addOnQueueChangedListener(_updateCount);
  }

  @override
  void dispose() {
    OfflineActionQueue.instance.removeOnQueueChangedListener(_updateCount);
    super.dispose();
  }

  void _updateCount() {
    if (!mounted) return;
    setState(() {
      _count = OfflineActionQueue.instance.pendingCount;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_count == 0) return widget.child;

    return Badge(
      label: Text(
        _count > 9 ? '9+' : '$_count',
        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
      ),
      backgroundColor: Theme.of(context).colorScheme.error,
      child: widget.child,
    );
  }
}
