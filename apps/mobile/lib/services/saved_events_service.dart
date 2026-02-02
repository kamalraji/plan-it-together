import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/models/saved_event.dart';
import 'package:thittam1hub/services/cache_service.dart';
import 'package:thittam1hub/services/connectivity_service.dart';
import 'package:thittam1hub/services/offline_action_queue.dart';
import 'package:thittam1hub/services/logging_service.dart';

/// Service for managing saved/bookmarked events with optimistic updates
class SavedEventsService {
  static SavedEventsService? _instance;
  static SavedEventsService get instance => _instance ??= SavedEventsService._();
  SavedEventsService._();
  
  static const String _tag = 'SavedEventsService';
  static final LoggingService _log = LoggingService.instance;
  
  final _supabase = SupabaseConfig.client;
  final CacheService _cache = CacheService.instance;
  final OfflineActionQueue _queue = OfflineActionQueue.instance;

  // Local optimistic state for instant UI updates
  final Set<String> _optimisticSavedEvents = {};
  final Set<String> _optimisticUnsavedEvents = {};

  /// Check if event is optimistically saved (for instant UI)
  bool isOptimisticallySaved(String eventId) {
    if (_optimisticUnsavedEvents.contains(eventId)) return false;
    if (_optimisticSavedEvents.contains(eventId)) return true;
    return false;
  }

  /// Get all saved events for the current user with cache-first strategy
  Future<List<SavedEvent>> getSavedEvents({bool forceRefresh = false}) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return [];

      // Try cache first (unless forced refresh)
      if (!forceRefresh) {
        final cached = await _cache.getCachedSavedEvents(userId);
        if (cached != null) {
          _log.debug('Saved events loaded from cache', tag: _tag, metadata: {'count': cached.length});
          return cached;
        }
      }

      final response = await _supabase
          .from('saved_events')
          .select('''
            id,
            event_id,
            reminder_enabled,
            reminder_time,
            notes,
            created_at,
            events!inner(
              id,
              name,
              start_date,
              end_date,
              branding,
              mode
            )
          ''')
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      final savedEvents = (response as List)
          .map((data) => SavedEvent.fromMap(data as Map<String, dynamic>))
          .toList();
      
      // Cache the results
      await _cache.cacheSavedEvents(savedEvents, userId);
      
      // Clear optimistic state since we have fresh data
      _optimisticSavedEvents.clear();
      _optimisticUnsavedEvents.clear();
      
      _log.dbOperation('SELECT', 'saved_events', rowCount: savedEvents.length, tag: _tag);
      return savedEvents;
    } catch (e) {
      _log.error('Get saved events failed', tag: _tag, error: e);
      
      // On network error, return stale cache if available
      final userId = _supabase.auth.currentUser?.id;
      if (userId != null) {
        final staleCache = await _cache.getCachedSavedEventsStale(userId);
        if (staleCache != null) {
          _log.debug('Returning stale cache due to network error', tag: _tag);
          return staleCache;
        }
      }
      
      return [];
    }
  }

  /// Save an event with optimistic update
  /// Returns immediately, queues for sync if offline
  Future<bool> saveEvent(String eventId) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;

    // Optimistic update - instant UI feedback
    _optimisticSavedEvents.add(eventId);
    _optimisticUnsavedEvents.remove(eventId);
    _log.debug('Optimistic save', tag: _tag, metadata: {'eventId': eventId});

    // If offline, queue for later
    if (!ConnectivityService.instance.isOnline) {
      await _queue.enqueue(OfflineAction(
        id: 'save_${eventId}_${DateTime.now().millisecondsSinceEpoch}',
        type: OfflineActionType.saveEvent,
        payload: {'eventId': eventId},
        createdAt: DateTime.now(),
      ));
      _log.debug('Save event queued for offline sync', tag: _tag);
      return true;
    }

    // Online - sync immediately
    try {
      await _supabase.from('saved_events').insert({
        'user_id': userId,
        'event_id': eventId,
      });
      
      // Invalidate cache
      await _cache.invalidateCache('${CacheService.savedEventsKey}_$userId');
      
      _log.info('Event saved', tag: _tag, metadata: {'eventId': eventId});
      return true;
    } catch (e) {
      _log.error('Save event failed', tag: _tag, error: e);
      
      // Revert optimistic update on failure
      _optimisticSavedEvents.remove(eventId);
      
      // Queue for retry
      await _queue.enqueue(OfflineAction(
        id: 'save_${eventId}_${DateTime.now().millisecondsSinceEpoch}',
        type: OfflineActionType.saveEvent,
        payload: {'eventId': eventId},
        createdAt: DateTime.now(),
      ));
      
      return false;
    }
  }

  /// Unsave an event with optimistic update
  Future<bool> unsaveEvent(String eventId) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;

    // Optimistic update - instant UI feedback
    _optimisticUnsavedEvents.add(eventId);
    _optimisticSavedEvents.remove(eventId);
    _log.debug('Optimistic unsave', tag: _tag, metadata: {'eventId': eventId});

    // If offline, queue for later
    if (!ConnectivityService.instance.isOnline) {
      await _queue.enqueue(OfflineAction(
        id: 'unsave_${eventId}_${DateTime.now().millisecondsSinceEpoch}',
        type: OfflineActionType.unsaveEvent,
        payload: {'eventId': eventId},
        createdAt: DateTime.now(),
      ));
      _log.debug('Unsave event queued for offline sync', tag: _tag);
      return true;
    }

    // Online - sync immediately
    try {
      await _supabase
          .from('saved_events')
          .delete()
          .eq('user_id', userId)
          .eq('event_id', eventId);
      
      // Invalidate cache
      await _cache.invalidateCache('${CacheService.savedEventsKey}_$userId');
      
      _log.info('Event unsaved', tag: _tag, metadata: {'eventId': eventId});
      return true;
    } catch (e) {
      _log.error('Unsave event failed', tag: _tag, error: e);
      
      // Revert optimistic update on failure
      _optimisticUnsavedEvents.remove(eventId);
      
      // Queue for retry
      await _queue.enqueue(OfflineAction(
        id: 'unsave_${eventId}_${DateTime.now().millisecondsSinceEpoch}',
        type: OfflineActionType.unsaveEvent,
        payload: {'eventId': eventId},
        createdAt: DateTime.now(),
      ));
      
      return false;
    }
  }

  /// Check if an event is saved (includes optimistic state)
  Future<bool> isEventSaved(String eventId) async {
    // Check optimistic state first for instant response
    if (_optimisticUnsavedEvents.contains(eventId)) return false;
    if (_optimisticSavedEvents.contains(eventId)) return true;

    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return false;

      final response = await _supabase
          .from('saved_events')
          .select('id')
          .eq('user_id', userId)
          .eq('event_id', eventId)
          .maybeSingle();

      return response != null;
    } catch (e) {
      _log.error('Check saved event failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Toggle reminder with optimistic update
  Future<bool> toggleReminder(String savedEventId, bool enabled) async {
    // If offline, queue for later
    if (!ConnectivityService.instance.isOnline) {
      await _queue.enqueue(OfflineAction(
        id: 'reminder_${savedEventId}_${DateTime.now().millisecondsSinceEpoch}',
        type: OfflineActionType.toggleReminder,
        payload: {'savedEventId': savedEventId, 'enabled': enabled},
        createdAt: DateTime.now(),
      ));
      _log.debug('Toggle reminder queued for offline sync', tag: _tag);
      return true;
    }

    try {
      await _supabase
          .from('saved_events')
          .update({'reminder_enabled': enabled})
          .eq('id', savedEventId);
      
      _log.debug('Reminder toggled', tag: _tag, metadata: {'enabled': enabled});
      return true;
    } catch (e) {
      _log.error('Toggle reminder failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Set reminder time for a saved event
  Future<bool> setReminderTime(String savedEventId, DateTime reminderTime) async {
    try {
      await _supabase
          .from('saved_events')
          .update({
            'reminder_enabled': true,
            'reminder_time': reminderTime.toIso8601String(),
          })
          .eq('id', savedEventId);
      
      _log.debug('Reminder time set', tag: _tag, metadata: {'time': reminderTime.toIso8601String()});
      return true;
    } catch (e) {
      _log.error('Set reminder time failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Update notes for a saved event
  Future<bool> updateNotes(String savedEventId, String notes) async {
    try {
      await _supabase
          .from('saved_events')
          .update({'notes': notes})
          .eq('id', savedEventId);
      
      _log.debug('Notes updated', tag: _tag);
      return true;
    } catch (e) {
      _log.error('Update notes failed', tag: _tag, error: e);
      return false;
    }
  }

  /// Get count of saved events
  Future<int> getSavedEventsCount() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return 0;

      final response = await _supabase
          .from('saved_events')
          .select('id')
          .eq('user_id', userId);

      return (response as List).length;
    } catch (e) {
      _log.error('Get saved events count failed', tag: _tag, error: e);
      return 0;
    }
  }

  /// Get upcoming saved events (events that haven't started yet)
  Future<List<SavedEvent>> getUpcomingSavedEvents() async {
    try {
      final allEvents = await getSavedEvents();
      final now = DateTime.now();
      return allEvents.where((e) => e.eventStartDate.isAfter(now)).toList();
    } catch (e) {
      _log.error('Get upcoming saved events failed', tag: _tag, error: e);
      return [];
    }
  }

  /// Get past saved events (events that have ended)
  Future<List<SavedEvent>> getPastSavedEvents() async {
    try {
      final allEvents = await getSavedEvents();
      final now = DateTime.now();
      return allEvents.where((e) => e.eventEndDate.isBefore(now)).toList();
    } catch (e) {
      _log.error('Get past saved events failed', tag: _tag, error: e);
      return [];
    }
  }

  /// Get a single saved event by event ID
  Future<SavedEvent?> getSavedEventByEventId(String eventId) async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return null;

      final response = await _supabase
          .from('saved_events')
          .select('''
            id,
            event_id,
            reminder_enabled,
            reminder_time,
            notes,
            created_at,
            events!inner(
              id,
              name,
              start_date,
              end_date,
              branding,
              mode
            )
          ''')
          .eq('user_id', userId)
          .eq('event_id', eventId)
          .maybeSingle();

      if (response == null) return null;
      return SavedEvent.fromMap(response as Map<String, dynamic>);
    } catch (e) {
      _log.error('Get saved event by ID failed', tag: _tag, error: e);
      return null;
    }
  }

  /// Get saved events with reminders enabled
  Future<List<SavedEvent>> getSavedEventsWithReminders() async {
    try {
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) return [];

      final response = await _supabase
          .from('saved_events')
          .select('''
            id,
            event_id,
            reminder_enabled,
            reminder_time,
            notes,
            created_at,
            events!inner(
              id,
              name,
              start_date,
              end_date,
              branding,
              mode
            )
          ''')
          .eq('user_id', userId)
          .eq('reminder_enabled', true)
          .order('reminder_time', ascending: true);

      return (response as List)
          .map((data) => SavedEvent.fromMap(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log.error('Get events with reminders failed', tag: _tag, error: e);
      return [];
    }
  }

  /// Invalidate the saved events cache
  void invalidateCache() {
    final userId = _supabase.auth.currentUser?.id;
    if (userId != null) {
      _cache.invalidateCache('${CacheService.savedEventsKey}_$userId');
    }
    _optimisticSavedEvents.clear();
    _optimisticUnsavedEvents.clear();
    _log.debug('Saved events cache invalidated', tag: _tag);
  }
}
