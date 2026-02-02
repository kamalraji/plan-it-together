import 'dart:async';
import 'package:thittam1hub/models/notification_item.dart';
import 'package:thittam1hub/models/models.dart' show NotificationPreferences;
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// ============================================
// NOTIFICATION AGGREGATION MODELS
// ============================================

/// Aggregated notification group (e.g., "3 people liked your post")
class AggregatedNotification {
  final String groupKey;
  final NotificationType type;
  final String title;
  final String message;
  final List<NotificationItem> items;
  final DateTime latestAt;
  final bool isRead;
  final String? targetId;
  final String? actionUrl;

  const AggregatedNotification({
    required this.groupKey,
    required this.type,
    required this.title,
    required this.message,
    required this.items,
    required this.latestAt,
    required this.isRead,
    this.targetId,
    this.actionUrl,
  });

  int get count => items.length;
  bool get isAggregated => items.length > 1;

  /// Get avatars for display (max 3)
  List<String?> get displayAvatars =>
      items.take(3).map((n) => n.avatarUrl).toList();

  /// Get first notification for single items
  NotificationItem? get singleItem => items.length == 1 ? items.first : null;
}

/// Pending notification for batch insert
class _PendingNotification {
  final String targetUserId;
  final NotificationType type;
  final String title;
  final String message;
  final String? avatarUrl;
  final String? actionUrl;
  final String? groupKey;
  final DateTime createdAt;

  const _PendingNotification({
    required this.targetUserId,
    required this.type,
    required this.title,
    required this.message,
    this.avatarUrl,
    this.actionUrl,
    this.groupKey,
    required this.createdAt,
  });

  Map<String, dynamic> toInsertMap() => {
        'user_id': targetUserId,
        'type': type.name,
        'title': title,
        'message': message,
        'avatar_url': avatarUrl,
        'action_url': actionUrl,
        'group_key': groupKey,
        'read': false,
      };
}

// ============================================
// NOTIFICATION SERVICE WITH BATCH PROCESSING
// ============================================

/// Notification service with batch processing and aggregation.
/// 
/// Extends [BaseService] for standardized error handling and [Result<T>]
/// return types. Uses batch inserts and rate limiting for efficiency.
class NotificationService extends BaseService {
  static NotificationService? _instance;
  static NotificationService get instance => _instance ??= NotificationService._();
  NotificationService._();
  
  @override
  String get tag => 'NotificationService';
  
  // Backward compatibility accessors for existing code
  static const String _tag = 'NotificationService';
  static final LoggingService _log = LoggingService.instance;
  
  final _supabase = SupabaseConfig.client;

  // ============================================
  // BATCH INSERT CONFIGURATION
  // ============================================

  /// Queue for pending notifications
  static final List<_PendingNotification> _pendingQueue = [];

  /// Batch flush timer
  static Timer? _flushTimer;

  /// Maximum batch size before auto-flush
  static const int _maxBatchSize = 25;

  /// Flush interval
  static const Duration _flushInterval = Duration(seconds: 5);

  /// Rate limiting: max notifications per user per minute
  static const int _maxNotificationsPerUserPerMinute = 30;

  /// User notification timestamps for rate limiting
  static final Map<String, List<DateTime>> _userNotificationTimestamps = {};

  // ============================================
  // AGGREGATION CONFIGURATION
  // ============================================

  /// Types that can be aggregated
  static const Set<NotificationType> _aggregatableTypes = {
    NotificationType.sparkReaction,
    NotificationType.comment,
    NotificationType.connectionRequest, // Legacy compatibility
    NotificationType.followRequest,     // New follower system
    NotificationType.circleInvite,
  };

  /// Aggregation window (group notifications within this time)
  static const Duration _aggregationWindow = Duration(hours: 24);

  // ============================================
  // RATE LIMITING
  // ============================================

  static bool _isRateLimited(String userId) {
    final timestamps = _userNotificationTimestamps[userId] ?? [];
    final cutoff = DateTime.now().subtract(const Duration(minutes: 1));
    final recentCount = timestamps.where((t) => t.isAfter(cutoff)).length;
    return recentCount >= _maxNotificationsPerUserPerMinute;
  }

  static void _recordNotificationTimestamp(String userId) {
    _userNotificationTimestamps.putIfAbsent(userId, () => []);
    _userNotificationTimestamps[userId]!.add(DateTime.now());

    // Cleanup old timestamps
    final cutoff = DateTime.now().subtract(const Duration(minutes: 2));
    _userNotificationTimestamps[userId]!.removeWhere((t) => t.isBefore(cutoff));
  }

  // ============================================
  // BATCH PROCESSING
  // ============================================

  /// Start the batch flush timer
  static void _startFlushTimer() {
    _flushTimer?.cancel();
    _flushTimer = Timer(_flushInterval, () async {
      await _flushPendingNotifications();
    });
  }

  /// Flush all pending notifications to database
  static Future<void> _flushPendingNotifications() async {
    if (_pendingQueue.isEmpty) return;

    final toFlush = List<_PendingNotification>.from(_pendingQueue);
    _pendingQueue.clear();

    try {
      final supabase = SupabaseConfig.client;

      // Group by user for rate limit check
      final byUser = <String, List<_PendingNotification>>{};
      for (final notif in toFlush) {
        byUser.putIfAbsent(notif.targetUserId, () => []);
        byUser[notif.targetUserId]!.add(notif);
      }

      // Filter out rate-limited users and record timestamps
      final toInsert = <Map<String, dynamic>>[];
      for (final entry in byUser.entries) {
        if (!_isRateLimited(entry.key)) {
          for (final notif in entry.value) {
            toInsert.add(notif.toInsertMap());
            _recordNotificationTimestamp(entry.key);
          }
        } else {
          _log.warning('Rate limited notifications for user', tag: _tag, metadata: {'userId': entry.key});
        }
      }

      if (toInsert.isNotEmpty) {
        await supabase.from('notifications').insert(toInsert);
        _log.dbOperation('INSERT batch', 'notifications', rowCount: toInsert.length, tag: _tag);
      }
    } catch (e) {
      _log.error('Batch notification insert failed', tag: _tag, error: e);
      // Re-queue failed notifications
      _pendingQueue.addAll(toFlush);
    }
  }

  /// Force flush pending notifications
  static Future<void> flushNow() async {
    _flushTimer?.cancel();
    await _flushPendingNotifications();
  }

  /// Dispose batch processing resources
  static void dispose() {
    _flushTimer?.cancel();
    _pendingQueue.clear();
    _userNotificationTimestamps.clear();
  }

  // ============================================
  // NOTIFICATION CREATION (QUEUED)
  // ============================================

  /// Queue a notification for batch insert with preference checking
  Future<void> createNotification({
    required String targetUserId,
    required NotificationType type,
    required String title,
    required String message,
    String? avatarUrl,
    String? actionUrl,
    String? groupKey,
    bool skipPreferenceCheck = false,
  }) async {
    // Check user preferences before queuing (optional)
    if (!skipPreferenceCheck) {
      final prefs = await _getUserPreferencesQuick(targetUserId);
      if (prefs != null && !prefs.shouldNotify(type.name)) {
        _log.debug('Notification skipped (user preference)', tag: _tag, metadata: {'type': type.name});
        return;
      }
      
      // Check quiet hours (skip urgent notifications)
      if (prefs != null && prefs.isInQuietHours()) {
        final isUrgent = type == NotificationType.connectionRequest ||
                         type == NotificationType.followRequest ||
                         type == NotificationType.groupInvite ||
                         type == NotificationType.system;
        if (!isUrgent && !prefs.allowUrgentInQuietHours) {
          _log.debug('Notification deferred (quiet hours)', tag: _tag, metadata: {'type': type.name});
          return;
        }
      }
    }

    // Generate group key for aggregatable types
    final effectiveGroupKey = groupKey ?? _generateGroupKey(type, actionUrl);

    _pendingQueue.add(_PendingNotification(
      targetUserId: targetUserId,
      type: type,
      title: title,
      message: message,
      avatarUrl: avatarUrl,
      actionUrl: actionUrl,
      groupKey: effectiveGroupKey,
      createdAt: DateTime.now(),
    ));

    // Auto-flush if batch is full
    if (_pendingQueue.length >= _maxBatchSize) {
      await _flushPendingNotifications();
    } else {
      _startFlushTimer();
    }
  }

  /// Quick preference lookup with cache
  Future<NotificationPreferences?> _getUserPreferencesQuick(String userId) async {
    // Check cache first
    if (_prefsCache.containsKey(userId)) {
      final cachedTime = _prefsCacheTime[userId];
      if (cachedTime != null && 
          DateTime.now().difference(cachedTime) < _prefsCacheTTL) {
        return _prefsCache[userId];
      }
    }
    
    try {
      final response = await _supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
      
      if (response == null) return null;
      
      final prefs = NotificationPreferences.fromJson(response);
      _prefsCache[userId] = prefs;
      _prefsCacheTime[userId] = DateTime.now();
      return prefs;
    } catch (e) {
      _log.warning('Error fetching user preferences', tag: _tag, error: e);
      return null;
    }
  }


  /// Create multiple notifications at once (batch)
  Future<void> createNotificationsBatch(
    List<({
      String targetUserId,
      NotificationType type,
      String title,
      String message,
      String? avatarUrl,
      String? actionUrl,
    })> notifications,
  ) async {
    for (final notif in notifications) {
      _pendingQueue.add(_PendingNotification(
        targetUserId: notif.targetUserId,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        avatarUrl: notif.avatarUrl,
        actionUrl: notif.actionUrl,
        groupKey: _generateGroupKey(notif.type, notif.actionUrl),
        createdAt: DateTime.now(),
      ));
    }

    // Flush immediately for batch operations
    await _flushPendingNotifications();
  }

  /// Generate group key for notification aggregation
  String? _generateGroupKey(NotificationType type, String? actionUrl) {
    if (!_aggregatableTypes.contains(type)) return null;
    if (actionUrl == null) return null;

    // Group key = type + target (e.g., "sparkReaction_post_123")
    return '${type.name}_$actionUrl';
  }

  // ============================================
  // AGGREGATED RETRIEVAL
  // ============================================

  /// Get aggregated notifications for current user
  Future<List<AggregatedNotification>> getAggregatedNotifications({
    int limit = 50,
  }) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return [];

      final response = await _supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(limit);

      final notifications = (response as List)
          .map((data) => NotificationItem.fromMap(data as Map<String, dynamic>))
          .toList();

      _log.dbOperation('SELECT aggregated', 'notifications', rowCount: notifications.length, tag: _tag);
      return _aggregateNotifications(notifications);
    } catch (e) {
      _log.error('Fetch aggregated notifications failed', tag: _tag, error: e);
      return [];
    }
  }

  /// Aggregate notifications by group key
  List<AggregatedNotification> _aggregateNotifications(
    List<NotificationItem> notifications,
  ) {
    final groups = <String, List<NotificationItem>>{};
    final standalone = <NotificationItem>[];
    final cutoff = DateTime.now().subtract(_aggregationWindow);

    for (final notif in notifications) {
      // Only aggregate recent notifications of aggregatable types
      if (_aggregatableTypes.contains(notif.type) &&
          notif.createdAt.isAfter(cutoff)) {
        // Use actionUrl as group key fallback
        final groupKey = '${notif.type.name}_${notif.actionUrl ?? notif.id}';
        groups.putIfAbsent(groupKey, () => []);
        groups[groupKey]!.add(notif);
      } else {
        standalone.add(notif);
      }
    }

    final result = <AggregatedNotification>[];

    // Create aggregated notifications
    for (final entry in groups.entries) {
      final items = entry.value;
      items.sort((a, b) => b.createdAt.compareTo(a.createdAt));

      final aggregated = AggregatedNotification(
        groupKey: entry.key,
        type: items.first.type,
        title: _getAggregatedTitle(items),
        message: _getAggregatedMessage(items),
        items: items,
        latestAt: items.first.createdAt,
        isRead: items.every((n) => n.read),
        targetId: items.first.actionUrl,
        actionUrl: items.first.actionUrl,
      );
      result.add(aggregated);
    }

    // Add standalone notifications as single-item aggregates
    for (final notif in standalone) {
      result.add(AggregatedNotification(
        groupKey: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        items: [notif],
        latestAt: notif.createdAt,
        isRead: notif.read,
        actionUrl: notif.actionUrl,
      ));
    }

    // Sort by latest activity
    result.sort((a, b) => b.latestAt.compareTo(a.latestAt));

    return result;
  }

  /// Generate aggregated title
  String _getAggregatedTitle(List<NotificationItem> items) {
    if (items.length == 1) return items.first.title;

    final type = items.first.type;
    final count = items.length;

    switch (type) {
      case NotificationType.sparkReaction:
        return '$count people sparked your post';
      case NotificationType.comment:
        return '$count new comments';
      case NotificationType.connectionRequest:
        return '$count follow requests';
      case NotificationType.circleInvite:
        return '$count circle invites';
      default:
        return '$count notifications';
    }
  }

  /// Generate aggregated message
  String _getAggregatedMessage(List<NotificationItem> items) {
    if (items.length == 1) return items.first.message;

    // Get first few names
    final names = items
        .take(3)
        .map((n) => n.title.split(' ').first)
        .where((n) => n.isNotEmpty)
        .toList();

    if (names.isEmpty) return items.first.message;

    final remaining = items.length - names.length;
    if (remaining > 0) {
      return '${names.join(", ")} and $remaining others';
    }
    return names.join(", ");
  }

  // ============================================
  // STANDARD RETRIEVAL (NON-AGGREGATED)
  // ============================================

  /// Get all notifications for current user
  Future<List<NotificationItem>> getNotifications() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return [];

      final response = await _supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(50);

      final items = (response as List)
          .map((data) => NotificationItem.fromMap(data as Map<String, dynamic>))
          .toList();
      
      _log.dbOperation('SELECT', 'notifications', rowCount: items.length, tag: _tag);
      return items;
    } catch (e) {
      _log.error('Fetch notifications failed', tag: _tag, error: e);
      return [];
    }
  }

  /// Get unread count (optimized single query)
  Future<int> getUnreadCount() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return 0;

      final response = await _supabase
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('read', false);

      return (response as List).length;
    } catch (e) {
      _log.error('Fetch unread count failed', tag: _tag, error: e);
      return 0;
    }
  }

  // ============================================
  // MARK AS READ (BATCH OPTIMIZED)
  // ============================================

  /// Mark notification as read
  Future<void> markAsRead(String notificationId) async {
    try {
      await _supabase
          .from('notifications')
          .update({'read': true}).eq('id', notificationId);
      _log.debug('Notification marked as read', tag: _tag);
    } catch (e) {
      _log.error('Mark as read failed', tag: _tag, error: e);
    }
  }

  /// Mark multiple notifications as read (batch)
  Future<void> markMultipleAsRead(List<String> notificationIds) async {
    if (notificationIds.isEmpty) return;

    try {
      await _supabase
          .from('notifications')
          .update({'read': true}).inFilter('id', notificationIds);
      _log.dbOperation('UPDATE batch read', 'notifications', rowCount: notificationIds.length, tag: _tag);
    } catch (e) {
      _log.error('Mark multiple as read failed', tag: _tag, error: e);
    }
  }

  /// Mark all as read (single query)
  Future<void> markAllAsRead() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return;

      await _supabase
          .from('notifications')
          .update({'read': true})
          .eq('user_id', userId)
          .eq('read', false);
      _log.info('All notifications marked as read', tag: _tag);
    } catch (e) {
      _log.error('Mark all as read failed', tag: _tag, error: e);
    }
  }

  /// Mark aggregated group as read
  Future<void> markGroupAsRead(AggregatedNotification group) async {
    final ids = group.items.map((n) => n.id).toList();
    await markMultipleAsRead(ids);
  }

  // ============================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================

  /// Subscribe to new notifications
  RealtimeChannel subscribeToNotifications(
      Function(NotificationItem) onNewNotification) {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      throw Exception('User not authenticated');
    }

    final channel = _supabase.channel('notifications_$userId').onPostgresChanges(
      event: PostgresChangeEvent.insert,
      schema: 'public',
      table: 'notifications',
      filter: PostgresChangeFilter(
        type: PostgresChangeFilterType.eq,
        column: 'user_id',
        value: userId,
      ),
      callback: (payload) {
        try {
          final data = payload.newRecord;
          final notification = NotificationItem.fromMap(data);
          onNewNotification(notification);
        } catch (e) {
          _log.error('Notification callback error', tag: _tag, error: e);
        }
      },
    ).subscribe();
    return channel;
  }

  // ============================================
  // DELETION (BATCH OPTIMIZED)
  // ============================================

  /// Delete a single notification
  Future<void> deleteNotification(String notificationId) async {
    try {
      await _supabase.from('notifications').delete().eq('id', notificationId);
      _log.debug('Notification deleted', tag: _tag);
    } catch (e) {
      _log.error('Delete notification failed', tag: _tag, error: e);
    }
  }

  /// Delete multiple notifications (batch)
  Future<void> deleteMultiple(List<String> notificationIds) async {
    if (notificationIds.isEmpty) return;

    try {
      await _supabase
          .from('notifications')
          .delete()
          .inFilter('id', notificationIds);
      _log.dbOperation('DELETE batch', 'notifications', rowCount: notificationIds.length, tag: _tag);
    } catch (e) {
      _log.error('Delete multiple notifications failed', tag: _tag, error: e);
    }
  }

  /// Delete aggregated group
  Future<void> deleteGroup(AggregatedNotification group) async {
    final ids = group.items.map((n) => n.id).toList();
    await deleteMultiple(ids);
  }

  /// Clear all notifications for current user
  Future<void> clearAllNotifications() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return;

      await _supabase.from('notifications').delete().eq('user_id', userId);
      _log.info('All notifications cleared', tag: _tag);
    } catch (e) {
      _log.error('Clear all notifications failed', tag: _tag, error: e);
    }
  }

  // ============================================
  // PREFERENCES
  // ============================================

  /// Preferences cache for quick lookup
  static final Map<String, NotificationPreferences> _prefsCache = {};
  static final Map<String, DateTime> _prefsCacheTime = {};
  static const Duration _prefsCacheTTL = Duration(minutes: 5);

  /// Get notification preferences for current user
  Future<NotificationPreferences> getPreferences() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) {
        return NotificationPreferences(userId: '');
      }

      // Check cache first
      if (_prefsCache.containsKey(userId)) {
        final cachedTime = _prefsCacheTime[userId];
        if (cachedTime != null && 
            DateTime.now().difference(cachedTime) < _prefsCacheTTL) {
          return _prefsCache[userId]!;
        }
      }

      final response = await _supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

      if (response == null) {
        return NotificationPreferences(userId: userId);
      }
      
      final prefs = NotificationPreferences.fromJson(response);
      
      // Cache the result
      _prefsCache[userId] = prefs;
      _prefsCacheTime[userId] = DateTime.now();
      
      return prefs;
    } catch (e) {
      _log.error('Fetch notification preferences failed', tag: _tag, error: e);
      return NotificationPreferences(userId: _supabase.auth.currentUser?.id ?? '');
    }
  }

  /// Update a specific notification preference
  Future<void> updatePreference(String key, bool value) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return;

      await _supabase.from('notification_preferences').upsert({
        'user_id': userId,
        key: value,
        'updated_at': DateTime.now().toIso8601String(),
      });
      
      // Invalidate cache
      _prefsCache.remove(userId);
      _prefsCacheTime.remove(userId);
      
      _log.debug('Preference updated', tag: _tag, metadata: {'key': key, 'value': value});
    } catch (e) {
      _log.error('Update preference failed', tag: _tag, error: e);
    }
  }

  /// Update full preferences object
  Future<void> updatePreferences(NotificationPreferences prefs) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return;

      await _supabase.from('notification_preferences').upsert(prefs.toJson());
      
      // Update cache
      _prefsCache[userId] = prefs;
      _prefsCacheTime[userId] = DateTime.now();
      
      _log.info('Preferences updated', tag: _tag);
    } catch (e) {
      _log.error('Update preferences failed', tag: _tag, error: e);
    }
  }

  // ============================================
  // STATIC INITIALIZATION
  // ============================================

  /// Initialize batch processing (call once at app startup)
  static void initializeBatchProcessing() {
    _flushTimer?.cancel();
    _startFlushTimer();
    _log.info('Batch processing initialized', tag: _tag);
  }

  /// Reinitialize after app comes to foreground
  static void reinitialize() {
    _flushTimer?.cancel();
    _startFlushTimer();
  }

  /// Stream unread notification count for current user
  Stream<int> streamUnreadCount() {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return Stream.value(0);
    
    return _supabase
        .from('notifications')
        .stream(primaryKey: ['id'])
        .eq('user_id', userId)
        .map((rows) => rows.where((r) => r['read'] != true).length);
  }

  /// Stream notifications for current user
  Stream<List<NotificationItem>> streamNotifications() {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return Stream.value([]);
    
    return _supabase
        .from('notifications')
        .stream(primaryKey: ['id'])
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .map((rows) => rows.map((r) => NotificationItem.fromMap(r)).toList());
  }

  /// Subscribe to unread count changes for badge updates
  StreamSubscription subscribeToUnreadCount({
    required Function(int count) onUpdate,
  }) {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('User not authenticated');
    
    return _supabase
        .from('notifications')
        .stream(primaryKey: ['id'])
        .eq('user_id', userId)
        .listen((data) {
          final unreadCount = data.where((n) => n['read'] == false).length;
          onUpdate(unreadCount);
        });
  }
}
