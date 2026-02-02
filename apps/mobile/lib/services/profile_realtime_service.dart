import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/services/logging_service.dart';
import 'package:thittam1hub/services/cache_service.dart';

/// Service for real-time profile synchronization across devices.
/// 
/// Subscribes to Supabase Realtime to listen for profile updates,
/// invalidating the cache and notifying listeners when changes occur.
/// 
/// ## Usage
/// ```dart
/// final service = ProfileRealtimeService.instance;
/// service.subscribe(userId);
/// service.onProfileUpdated.listen((userId) {
///   // Refresh profile data
/// });
/// ```
class ProfileRealtimeService {
  static ProfileRealtimeService? _instance;
  static ProfileRealtimeService get instance => _instance ??= ProfileRealtimeService._();
  ProfileRealtimeService._();
  
  static final _log = LoggingService.instance;
  static const String _tag = 'ProfileRealtimeService';
  
  RealtimeChannel? _profileChannel;
  final _profileUpdateController = StreamController<String>.broadcast();
  String? _subscribedUserId;
  
  /// Stream of user IDs that have been updated
  Stream<String> get onProfileUpdated => _profileUpdateController.stream;
  
  /// Whether currently subscribed to a profile
  bool get isSubscribed => _profileChannel != null;
  
  /// The user ID currently subscribed to
  String? get subscribedUserId => _subscribedUserId;

  /// Subscribe to real-time profile updates for the given user.
  /// 
  /// Automatically unsubscribes from any previous subscription.
  void subscribe(String userId) {
    // Skip if already subscribed to this user
    if (_subscribedUserId == userId && _profileChannel != null) {
      _log.debug('Already subscribed to profile updates', tag: _tag);
      return;
    }
    
    unsubscribe();
    _subscribedUserId = userId;
    
    _profileChannel = SupabaseConfig.client
        .channel('profile:$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'user_profiles',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'id',
            value: userId,
          ),
          callback: (payload) {
            _log.info('Profile updated via realtime', tag: _tag, metadata: {
              'userId': userId,
              'oldRecord': payload.oldRecord,
            });
            
            // Invalidate cache so next fetch gets fresh data
            CacheService.instance.invalidateUserProfile(userId);
            
            // Notify listeners
            _profileUpdateController.add(userId);
          },
        )
        .subscribe((status, error) {
          if (status == RealtimeSubscribeStatus.subscribed) {
            _log.info('Subscribed to profile updates', tag: _tag, metadata: {'userId': userId});
          } else if (status == RealtimeSubscribeStatus.closed) {
            _log.debug('Profile subscription closed', tag: _tag);
          } else if (error != null) {
            _log.error('Profile subscription error', tag: _tag, error: error);
          }
        });
  }
  
  /// Unsubscribe from current profile updates
  void unsubscribe() {
    if (_profileChannel != null) {
      _profileChannel!.unsubscribe();
      _profileChannel = null;
      _subscribedUserId = null;
      _log.debug('Unsubscribed from profile updates', tag: _tag);
    }
  }
  
  /// Dispose the service and clean up resources
  void dispose() {
    unsubscribe();
    _profileUpdateController.close();
    _instance = null;
  }
}
