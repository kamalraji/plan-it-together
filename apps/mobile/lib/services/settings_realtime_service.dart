import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Event types for settings updates
enum SettingsUpdateType {
  notification,
  privacy,
  accessibility,
  security,
  aiMatching,
}

/// Payload for settings update events
class SettingsUpdateEvent {
  final SettingsUpdateType type;
  final String userId;
  final Map<String, dynamic>? newData;

  const SettingsUpdateEvent({
    required this.type,
    required this.userId,
    this.newData,
  });
}

/// Service for real-time settings synchronization across devices.
/// 
/// Subscribes to Supabase Realtime to listen for settings updates across
/// multiple tables (notification_preferences, accessibility_settings, etc.),
/// notifying listeners when changes occur from another device.
/// 
/// ## Usage
/// ```dart
/// final service = SettingsRealtimeService.instance;
/// service.subscribe(userId);
/// service.onSettingsUpdated.listen((event) {
///   switch (event.type) {
///     case SettingsUpdateType.notification:
///       // Refresh notification preferences
///       break;
///     case SettingsUpdateType.accessibility:
///       // Refresh accessibility settings
///       break;
///   }
/// });
/// ```
class SettingsRealtimeService {
  static SettingsRealtimeService? _instance;
  static SettingsRealtimeService get instance => _instance ??= SettingsRealtimeService._();
  SettingsRealtimeService._();
  
  static final _log = LoggingService.instance;
  static const String _tag = 'SettingsRealtimeService';
  
  RealtimeChannel? _settingsChannel;
  final _settingsUpdateController = StreamController<SettingsUpdateEvent>.broadcast();
  String? _subscribedUserId;
  
  /// Stream of settings update events
  Stream<SettingsUpdateEvent> get onSettingsUpdated => _settingsUpdateController.stream;
  
  /// Whether currently subscribed to settings updates
  bool get isSubscribed => _settingsChannel != null;
  
  /// The user ID currently subscribed to
  String? get subscribedUserId => _subscribedUserId;

  /// Subscribe to real-time settings updates for the given user.
  /// 
  /// Listens to multiple settings tables:
  /// - notification_preferences
  /// - accessibility_settings
  /// - security_notification_preferences
  /// - ai_matching_privacy_settings
  /// 
  /// Automatically unsubscribes from any previous subscription.
  void subscribe(String userId) {
    // Skip if already subscribed to this user
    if (_subscribedUserId == userId && _settingsChannel != null) {
      _log.debug('Already subscribed to settings updates', tag: _tag);
      return;
    }
    
    unsubscribe();
    _subscribedUserId = userId;
    
    // Create a multiplexed channel for all settings tables
    _settingsChannel = SupabaseConfig.client
        .channel('settings:$userId')
        // Notification preferences
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'notification_preferences',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) => _handleUpdate(
            SettingsUpdateType.notification,
            userId,
            payload,
          ),
        )
        // Accessibility settings
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'accessibility_settings',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) => _handleUpdate(
            SettingsUpdateType.accessibility,
            userId,
            payload,
          ),
        )
        // Security notification preferences
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'security_notification_preferences',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) => _handleUpdate(
            SettingsUpdateType.security,
            userId,
            payload,
          ),
        )
        // AI Matching privacy settings
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'ai_matching_privacy_settings',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) => _handleUpdate(
            SettingsUpdateType.aiMatching,
            userId,
            payload,
          ),
        )
        .subscribe((status, error) {
          if (status == RealtimeSubscribeStatus.subscribed) {
            _log.info('Subscribed to settings updates', tag: _tag, metadata: {'userId': userId});
          } else if (status == RealtimeSubscribeStatus.closed) {
            _log.debug('Settings subscription closed', tag: _tag);
          } else if (error != null) {
            _log.error('Settings subscription error', tag: _tag, error: error);
          }
        });
  }
  
  /// Handle a settings update from any table
  void _handleUpdate(
    SettingsUpdateType type,
    String userId,
    PostgresChangePayload payload,
  ) {
    final tableName = _getTableName(type);
    _log.info('Settings updated via realtime', tag: _tag, metadata: {
      'type': type.name,
      'table': tableName,
      'userId': userId,
      'eventType': payload.eventType.name,
    });
    
    // Emit the update event
    _settingsUpdateController.add(SettingsUpdateEvent(
      type: type,
      userId: userId,
      newData: payload.newRecord,
    ));
  }
  
  /// Get table name for a settings type
  String _getTableName(SettingsUpdateType type) {
    switch (type) {
      case SettingsUpdateType.notification:
        return 'notification_preferences';
      case SettingsUpdateType.privacy:
        return 'impact_profiles'; // Privacy settings stored here
      case SettingsUpdateType.accessibility:
        return 'accessibility_settings';
      case SettingsUpdateType.security:
        return 'security_notification_preferences';
      case SettingsUpdateType.aiMatching:
        return 'ai_matching_privacy_settings';
    }
  }
  
  /// Unsubscribe from current settings updates
  void unsubscribe() {
    if (_settingsChannel != null) {
      _settingsChannel!.unsubscribe();
      _settingsChannel = null;
      _subscribedUserId = null;
      _log.debug('Unsubscribed from settings updates', tag: _tag);
    }
  }
  
  /// Dispose the service and clean up resources
  void dispose() {
    unsubscribe();
    _settingsUpdateController.close();
    _instance = null;
  }
}
