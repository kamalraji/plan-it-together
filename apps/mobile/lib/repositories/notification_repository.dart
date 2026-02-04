import '../models/models.dart' show NotificationPreferences;
import '../models/notification_item.dart';
import '../services/notification_service.dart' show AggregatedNotification;
import '../utils/result.dart';

/// Abstract repository interface for notification operations.
/// 
/// This provides a clean abstraction over the notification data layer, enabling:
/// - Consistent error handling via Result<T> pattern
/// - Easy testing through mock implementations
/// - Separation of concerns between UI and data access
abstract class NotificationRepository {
  // ═══════════════════════════════════════════════════════════════════════════
  // RETRIEVAL
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets all notifications for the current user.
  Future<Result<List<NotificationItem>>> getNotifications();

  /// Gets aggregated notifications (grouped by type/target).
  Future<Result<List<AggregatedNotification>>> getAggregatedNotifications({
    int limit = 50,
  });

  /// Gets the unread notification count.
  Future<Result<int>> getUnreadCount();

  /// Streams the unread count in real-time.
  Stream<int> streamUnreadCount();

  /// Streams notifications in real-time.
  Stream<List<NotificationItem>> streamNotifications();

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Marks a single notification as read.
  Future<Result<void>> markAsRead(String notificationId);

  /// Marks all notifications as read.
  Future<Result<void>> markAllAsRead();

  /// Deletes a notification.
  Future<Result<void>> deleteNotification(String notificationId);

  /// Clears all notifications for the current user.
  Future<Result<void>> clearAllNotifications();

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATION
  // ═══════════════════════════════════════════════════════════════════════════

  /// Creates a notification (queued for batch insert).
  Future<Result<void>> createNotification({
    required String targetUserId,
    required NotificationType type,
    required String title,
    required String message,
    String? avatarUrl,
    String? actionUrl,
    String? groupKey,
    bool skipPreferenceCheck = false,
  });

  /// Creates multiple notifications at once (batch).
  Future<Result<void>> createNotificationsBatch(
    List<({
      String targetUserId,
      NotificationType type,
      String title,
      String message,
      String? avatarUrl,
      String? actionUrl,
    })> notifications,
  );

  /// Forces immediate flush of pending notifications.
  Future<Result<void>> flushPendingNotifications();

  // ═══════════════════════════════════════════════════════════════════════════
  // PREFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets notification preferences for a user.
  Future<Result<NotificationPreferences?>> getPreferences(String userId);

  /// Updates notification preferences.
  Future<Result<void>> updatePreferences(NotificationPreferences preferences);

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  /// Disposes batch processing resources.
  void dispose();
}
