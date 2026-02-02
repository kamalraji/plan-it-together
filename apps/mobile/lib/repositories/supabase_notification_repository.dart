import '../models/models.dart' show NotificationPreferences;
import '../models/notification_item.dart';
import '../utils/result.dart';
import '../services/notification_service.dart';
import 'base_repository.dart';
import 'notification_repository.dart';

/// Supabase implementation of [NotificationRepository].
/// 
/// Extends [BaseRepository] for standardized error handling and logging.
/// Wraps [NotificationService] with consistent Result<T> return types.
class SupabaseNotificationRepository extends BaseRepository implements NotificationRepository {
  @override
  String get tag => 'NotificationRepository';
  
  final NotificationService _notificationService;

  SupabaseNotificationRepository({
    NotificationService? notificationService,
  }) : _notificationService = notificationService ?? NotificationService.instance;

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATION RETRIEVAL
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<NotificationItem>>> getNotifications() {
    return execute(() async {
      final notifications = await _notificationService.getNotifications();
      logDbOperation('SELECT', 'notifications', rowCount: notifications.length);
      return notifications;
    }, operationName: 'getNotifications');
  }

  @override
  Future<Result<List<AggregatedNotification>>> getAggregatedNotifications({
    int limit = 50,
  }) {
    return execute(() async {
      final notifications = await _notificationService.getAggregatedNotifications(
        limit: limit,
      );
      logDbOperation('SELECT', 'notifications', rowCount: notifications.length);
      return notifications;
    }, operationName: 'getAggregatedNotifications');
  }

  @override
  Future<Result<int>> getUnreadCount() {
    return execute(() async {
      return await _notificationService.getUnreadCount();
    }, operationName: 'getUnreadCount');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATION CREATION
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> createNotification({
    required String targetUserId,
    required NotificationType type,
    required String title,
    required String message,
    String? avatarUrl,
    String? actionUrl,
    String? groupKey,
    bool skipPreferenceCheck = false,
  }) {
    return execute(() async {
      await _notificationService.createNotification(
        targetUserId: targetUserId,
        type: type,
        title: title,
        message: message,
        avatarUrl: avatarUrl,
        actionUrl: actionUrl,
        groupKey: groupKey,
        skipPreferenceCheck: skipPreferenceCheck,
      );
      logDebug('Created notification for user: $targetUserId');
    }, operationName: 'createNotification');
  }

  @override
  Future<Result<void>> createNotificationsBatch(
    List<({
      String targetUserId,
      NotificationType type,
      String title,
      String message,
      String? avatarUrl,
      String? actionUrl,
    })> notifications,
  ) {
    return execute(() async {
      await _notificationService.createNotificationsBatch(notifications);
      logDebug('Created ${notifications.length} notifications in batch');
    }, operationName: 'createNotificationsBatch');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> markAsRead(String notificationId) {
    return execute(() async {
      await _notificationService.markAsRead(notificationId);
      logDebug('Marked notification as read: $notificationId');
    }, operationName: 'markAsRead');
  }

  @override
  Future<Result<void>> markAllAsRead() {
    return execute(() async {
      await _notificationService.markAllAsRead();
      logInfo('Marked all notifications as read');
    }, operationName: 'markAllAsRead');
  }

  @override
  Future<Result<void>> deleteNotification(String notificationId) {
    return execute(() async {
      await _notificationService.deleteNotification(notificationId);
      logDebug('Deleted notification: $notificationId');
    }, operationName: 'deleteNotification');
  }

  @override
  Future<Result<void>> clearAllNotifications() {
    return execute(() async {
      await _notificationService.clearAllNotifications();
      logInfo('Cleared all notifications');
    }, operationName: 'clearAllNotifications');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PREFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<NotificationPreferences?>> getPreferences(String userId) {
    return execute(() async {
      // NotificationService.getPreferences() uses current user internally
      return await _notificationService.getPreferences();
    }, operationName: 'getPreferences');
  }

  @override
  Future<Result<void>> updatePreferences(NotificationPreferences preferences) {
    return execute(() async {
      await _notificationService.updatePreferences(preferences);
      logInfo('Updated notification preferences');
    }, operationName: 'updatePreferences');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REAL-TIME
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Stream<int> streamUnreadCount() {
    return _notificationService.streamUnreadCount();
  }

  @override
  Stream<List<NotificationItem>> streamNotifications() {
    return _notificationService.streamNotifications();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> flushPendingNotifications() {
    return execute(() async {
      await NotificationService.flushNow();
      logDebug('Flushed pending notifications');
    }, operationName: 'flushPendingNotifications');
  }

  @override
  void dispose() {
    NotificationService.dispose();
    logDebug('Disposed notification repository');
  }
}
