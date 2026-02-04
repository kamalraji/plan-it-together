import 'package:flutter/widgets.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/cache_service.dart';
import 'package:thittam1hub/services/connectivity_service.dart';
import 'package:thittam1hub/services/event_service.dart';
import 'package:thittam1hub/services/profile_service.dart';
import 'package:thittam1hub/services/saved_events_service.dart';
import 'package:thittam1hub/supabase/supabase_config.dart';

/// Background sync service that syncs data when:
/// - App resumes from background
/// - Device comes back online
class BackgroundSyncService extends BaseService with WidgetsBindingObserver {
  static BackgroundSyncService? _instance;
  static BackgroundSyncService get instance => _instance ??= BackgroundSyncService._();
  BackgroundSyncService._();

  @override
  String get tag => 'BackgroundSync';

  final _profileService = ProfileService.instance;
  final _eventService = EventService.instance;
  final _savedEventsService = SavedEventsService.instance;
  final _cache = CacheService.instance;

  bool _initialized = false;
  bool _isSyncing = false;

  /// Initialize background sync
  void init() {
    if (_initialized) return;
    
    WidgetsBinding.instance.addObserver(this);
    ConnectivityService.instance.addOnReconnectListener(_syncAll);
    
    _initialized = true;
    logInfo('Background sync initialized');
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      logDebug('App resumed - checking for sync');
      _syncIfNeeded();
    }
  }

  /// Sync only stale caches
  Future<void> _syncIfNeeded() async {
    if (_isSyncing) return;
    if (!ConnectivityService.instance.isOnline) {
      logDebug('Offline - skipping sync');
      return;
    }

    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    _isSyncing = true;
    logDebug('Checking stale caches...');

    try {
      final futures = <Future>[];

      // Sync profile if stale
      final profileKey = '${CacheService.userProfileKey}_$userId';
      if (!_cache.isCacheValid(profileKey, CacheService.profileTTL)) {
        logDebug('Profile cache stale, syncing...');
        futures.add(_profileService.getUserProfile(userId, forceRefresh: true));
      }

      // Sync events if stale
      if (!_cache.isCacheValid(CacheService.eventsListKey, CacheService.eventsTTL)) {
        logDebug('Events cache stale, syncing...');
        futures.add(_eventService.getAllEvents(forceRefresh: true));
      }

      // Sync saved events if stale
      final savedEventsKey = '${CacheService.savedEventsKey}_$userId';
      if (!_cache.isCacheValid(savedEventsKey, CacheService.savedEventsTTL)) {
        logDebug('Saved events cache stale, syncing...');
        futures.add(_savedEventsService.getSavedEvents(forceRefresh: true));
      }

      if (futures.isNotEmpty) {
        await Future.wait(futures);
        logInfo('Stale cache sync completed', metadata: {'syncedCount': futures.length});
      } else {
        logDebug('All caches are fresh');
      }
    } catch (e) {
      logError('Background sync error', error: e);
    } finally {
      _isSyncing = false;
    }
  }

  /// Force sync all data (called on reconnect)
  Future<void> _syncAll() async {
    if (_isSyncing) return;
    if (!ConnectivityService.instance.isOnline) return;

    final userId = SupabaseConfig.auth.currentUser?.id;
    if (userId == null) return;

    _isSyncing = true;
    logInfo('Background sync triggered - syncing all data...');

    try {
      await Future.wait([
        _profileService.getUserProfile(userId, forceRefresh: true),
        _eventService.getAllEvents(forceRefresh: true),
        _savedEventsService.getSavedEvents(forceRefresh: true),
      ]);
      logInfo('Background sync completed');
    } catch (e) {
      logError('Background sync error', error: e);
    } finally {
      _isSyncing = false;
    }
  }

  /// Manual trigger for sync (can be used by UI)
  Future<void> syncNow() => _syncAll();

  /// Clean up resources
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    ConnectivityService.instance.removeOnReconnectListener(_syncAll);
    _initialized = false;
  }
}
