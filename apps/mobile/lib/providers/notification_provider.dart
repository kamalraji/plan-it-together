import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/notification_item.dart';
import '../repositories/notification_repository.dart';
import '../services/notification_service.dart';
import '../utils/result.dart';
import '../utils/result_extensions.dart';
import '../services/logging_service.dart';
import '../supabase/supabase_config.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// State of the notification loading process.
enum NotificationLoadState {
  initial,
  loading,
  loaded,
  error,
  refreshing,
}

/// Provider for notification state management using ChangeNotifier.
/// 
/// Centralizes notification data (list, unread count, real-time updates) and 
/// notifies listeners when state changes. Designed for cross-page sharing
/// (e.g., badge counts in navigation, notification center).
/// 
/// Usage:
/// ```dart
/// // In main.dart
/// ChangeNotifierProvider(
///   create: (_) => NotificationProvider(SupabaseNotificationRepository()),
///   child: MyApp(),
/// )
/// 
/// // In widgets - show badge
/// final notifProvider = context.watch<NotificationProvider>();
/// Badge(count: notifProvider.unreadCount)
/// ```
class NotificationProvider extends ChangeNotifier {
  static const _tag = 'NotificationProvider';

  final NotificationRepository _repository;
  final NotificationService _service;

  NotificationProvider(
    this._repository, {
    NotificationService? service,
  }) : _service = service ?? NotificationService.instance;

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  NotificationLoadState _state = NotificationLoadState.initial;
  List<AggregatedNotification> _notifications = [];
  int _unreadCount = 0;
  String? _errorMessage;
  RealtimeChannel? _realtimeChannel;
  StreamSubscription? _unreadSubscription;

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  NotificationLoadState get state => _state;
  List<AggregatedNotification> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  String? get errorMessage => _errorMessage;

  // Computed properties
  bool get isLoading => _state == NotificationLoadState.loading;
  bool get isRefreshing => _state == NotificationLoadState.refreshing;
  bool get hasError => _state == NotificationLoadState.error;
  bool get hasNotifications => _notifications.isNotEmpty;
  bool get hasUnread => _unreadCount > 0;

  /// Current user ID from auth.
  String? get currentUserId => SupabaseConfig.auth.currentUser?.id;

  /// Notifications grouped by category.
  Map<String, List<AggregatedNotification>> get notificationsByCategory {
    final grouped = <String, List<AggregatedNotification>>{};
    for (final notification in _notifications) {
      final category = notification.type.category;
      grouped.putIfAbsent(category, () => []).add(notification);
    }
    return grouped;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  /// Initializes the provider and subscribes to real-time updates.
  Future<void> initialize() async {
    if (currentUserId == null) return;

    await loadNotifications();
    await _loadUnreadCount();
    _subscribeToRealtimeUpdates();
    _subscribeToUnreadCount();
    
    log.info('NotificationProvider initialized', tag: _tag);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATION LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  /// Loads aggregated notifications.
  Future<void> loadNotifications({bool forceRefresh = false}) async {
    if (_state == NotificationLoadState.loading) return;

    _state = forceRefresh 
        ? NotificationLoadState.refreshing 
        : NotificationLoadState.loading;
    _errorMessage = null;
    notifyListeners();

    final result = await _repository.getAggregatedNotifications(limit: 50);

    result.handle(
      onSuccess: (notifications) {
        _notifications = notifications;
        _state = NotificationLoadState.loaded;
        log.info('Loaded ${notifications.length} notifications', tag: _tag);
      },
      onFailure: (message, error) {
        _errorMessage = message;
        _state = NotificationLoadState.error;
        log.error('Failed to load notifications: $message', tag: _tag, error: error);
      },
    );

    notifyListeners();
  }

  /// Refreshes notifications from server.
  Future<void> refresh() async {
    await loadNotifications(forceRefresh: true);
    await _loadUnreadCount();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READ STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Marks a single notification as read by its group key.
  Future<void> markAsRead(String notificationId) async {
    // Optimistic update
    final index = _notifications.indexWhere((n) => n.groupKey == notificationId);
    if (index != -1 && !_notifications[index].isRead) {
      _unreadCount = (_unreadCount - _notifications[index].count).clamp(0, 999);
      notifyListeners();
    }

    final result = await _repository.markAsRead(notificationId);
    
    if (!result.isSuccess) {
      // Revert on failure - reload to get accurate count
      await _loadUnreadCount();
      log.warning('Failed to mark notification as read', tag: _tag);
    }
  }

  /// Marks all notifications as read.
  Future<void> markAllAsRead() async {
    if (_unreadCount == 0) return;

    // Optimistic update
    final previousCount = _unreadCount;
    _unreadCount = 0;
    notifyListeners();

    final result = await _repository.markAllAsRead();

    if (!result.isSuccess) {
      // Revert on failure
      _unreadCount = previousCount;
      notifyListeners();
      log.warning('Failed to mark all as read', tag: _tag);
    } else {
      log.info('Marked all notifications as read', tag: _tag);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETION
  // ═══════════════════════════════════════════════════════════════════════════

  /// Deletes a notification by its group key.
  Future<void> deleteNotification(String notificationId) async {
    // Optimistic update
    final index = _notifications.indexWhere((n) => n.groupKey == notificationId);
    AggregatedNotification? removed;
    
    if (index != -1) {
      removed = _notifications[index];
      _notifications.removeAt(index);
      if (!removed.isRead) {
        _unreadCount = (_unreadCount - removed.count).clamp(0, 999);
      }
      notifyListeners();
    }

    final result = await _repository.deleteNotification(notificationId);

    if (!result.isSuccess && removed != null) {
      // Revert on failure
      _notifications.insert(index, removed);
      if (!removed.isRead) {
        _unreadCount += removed.count;
      }
      notifyListeners();
      log.warning('Failed to delete notification', tag: _tag);
    }
  }

  /// Clears all notifications.
  Future<void> clearAllNotifications() async {
    // Optimistic update
    final previousNotifications = List<AggregatedNotification>.from(_notifications);
    final previousCount = _unreadCount;
    
    _notifications.clear();
    _unreadCount = 0;
    notifyListeners();

    final result = await _repository.clearAllNotifications();

    if (!result.isSuccess) {
      // Revert on failure
      _notifications = previousNotifications;
      _unreadCount = previousCount;
      notifyListeners();
      log.warning('Failed to clear notifications', tag: _tag);
    } else {
      log.info('Cleared all notifications', tag: _tag);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REAL-TIME UPDATES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Called when a new notification is received via push/realtime.
  void onNewNotificationReceived(NotificationItem notification) {
    // Increment unread count
    _unreadCount++;
    
    // Add to the top of the list as a single-item aggregated notification
    final aggregated = AggregatedNotification(
      groupKey: notification.groupKey ?? notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      items: [notification],
      latestAt: notification.createdAt,
      isRead: false,
      actionUrl: notification.actionUrl,
    );
    
    _notifications.insert(0, aggregated);
    notifyListeners();
    
    log.debug('New notification received: ${notification.type.name}', tag: _tag);
  }

  void _subscribeToRealtimeUpdates() {
    final userId = currentUserId;
    if (userId == null) return;

    _realtimeChannel = _service.subscribeToNotifications(
      (notification) {
        onNewNotificationReceived(notification);
      },
    );
  }

  void _subscribeToUnreadCount() {
    _unreadSubscription = _service.subscribeToUnreadCount(
      onUpdate: (count) {
        if (_unreadCount != count) {
          _unreadCount = count;
          notifyListeners();
        }
      },
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  /// Clears all notification state (call on logout).
  void clearAll() {
    _unsubscribe();
    _notifications = [];
    _unreadCount = 0;
    _state = NotificationLoadState.initial;
    _errorMessage = null;
    notifyListeners();
    log.info('Notification state cleared', tag: _tag);
  }

  void _unsubscribe() {
    _realtimeChannel?.unsubscribe();
    _realtimeChannel = null;
    _unreadSubscription?.cancel();
    _unreadSubscription = null;
  }

  @override
  void dispose() {
    _unsubscribe();
    super.dispose();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> _loadUnreadCount() async {
    final result = await _repository.getUnreadCount();
    result.handle(
      onSuccess: (count) {
        _unreadCount = count;
        notifyListeners();
      },
      onFailure: (_, __) {
        log.warning('Failed to load unread count', tag: _tag);
      },
    );
  }
}
