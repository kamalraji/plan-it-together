import '../models/saved_event.dart';
import '../services/saved_events_service.dart';
import '../supabase/supabase_config.dart';
import '../utils/result.dart';
import 'base_repository.dart';
import 'saved_events_repository.dart';

/// Supabase implementation of [SavedEventsRepository].
/// 
/// Extends [BaseRepository] for standardized error handling and logging.
/// Wraps [SavedEventsService] with consistent Result<T> return types.
/// 
/// ## Features
/// 
/// - Optimistic UI updates for save/unsave operations
/// - Cache-first strategy for event retrieval
/// - Reminder management
/// - Personal notes support
class SupabaseSavedEventsRepository extends BaseRepository implements SavedEventsRepository {
  @override
  String get tag => 'SavedEventsRepository';
  
  final SavedEventsService _service;

  // Optimistic state tracking
  final Map<String, bool> _optimisticState = {};

  SupabaseSavedEventsRepository({
    SavedEventsService? service,
  }) : _service = service ?? SavedEventsService.instance;

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE/UNSAVE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> saveEvent(String eventId) async {
    // Set optimistic state
    _optimisticState[eventId] = true;
    
    final result = await execute(() async {
      await _service.saveEvent(eventId);
      logInfo('Saved event: $eventId');
    }, operationName: 'saveEvent');
    
    if (result.isFailure) {
      // Revert optimistic state on failure
      _optimisticState.remove(eventId);
    }
    
    return result;
  }

  @override
  Future<Result<void>> unsaveEvent(String eventId) async {
    // Set optimistic state
    _optimisticState[eventId] = false;
    
    final result = await execute(() async {
      await _service.unsaveEvent(eventId);
      logDebug('Unsaved event: $eventId');
    }, operationName: 'unsaveEvent');
    
    if (result.isFailure) {
      // Revert optimistic state on failure
      _optimisticState.remove(eventId);
    }
    
    return result;
  }

  @override
  Future<Result<bool>> toggleSaveEvent(String eventId) async {
    try {
      // Check current state
      final currentlySaved = _optimisticState[eventId] ?? 
          await _service.isEventSaved(eventId);
      
      // Toggle
      if (currentlySaved) {
        final result = await unsaveEvent(eventId);
        if (result.isFailure) {
          return Failure((result as Failure).message, result.error);
        }
        return const Success(false);
      } else {
        final result = await saveEvent(eventId);
        if (result.isFailure) {
          return Failure((result as Failure).message, result.error);
        }
        return const Success(true);
      }
    } catch (e) {
      logError('Failed to toggle save event', error: e);
      return Failure(userFriendlyMessage(e), e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RETRIEVAL
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<SavedEvent>>> getSavedEvents({bool forceRefresh = false}) {
    return execute(() async {
      final events = await _service.getSavedEvents(forceRefresh: forceRefresh);
      logDbOperation('SELECT', 'saved_events', rowCount: events.length);
      return events;
    }, operationName: 'getSavedEvents');
  }

  @override
  Future<Result<List<SavedEvent>>> getUpcomingSavedEvents() {
    return execute(() async {
      final events = await _service.getUpcomingSavedEvents();
      logDbOperation('SELECT', 'saved_events', rowCount: events.length);
      return events;
    }, operationName: 'getUpcomingSavedEvents');
  }

  @override
  Future<Result<List<SavedEvent>>> getPastSavedEvents() {
    return execute(() async {
      final events = await _service.getPastSavedEvents();
      logDbOperation('SELECT', 'saved_events', rowCount: events.length);
      return events;
    }, operationName: 'getPastSavedEvents');
  }

  @override
  Future<Result<SavedEvent?>> getSavedEventByEventId(String eventId) {
    return execute(() async {
      return await _service.getSavedEventByEventId(eventId);
    }, operationName: 'getSavedEventByEventId');
  }

  @override
  Future<Result<int>> getSavedEventsCount() {
    return execute(() async {
      return await _service.getSavedEventsCount();
    }, operationName: 'getSavedEventsCount');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS CHECKS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<bool>> isEventSaved(String eventId) async {
    // Check optimistic state first
    if (_optimisticState.containsKey(eventId)) {
      return Success(_optimisticState[eventId]!);
    }
    
    return execute(() async {
      return await _service.isEventSaved(eventId);
    }, operationName: 'isEventSaved');
  }

  @override
  bool? isOptimisticallySaved(String eventId) {
    return _optimisticState[eventId];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REMINDERS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> toggleReminder(String savedEventId, bool enabled) {
    return execute(() async {
      await _service.toggleReminder(savedEventId, enabled);
      logDebug('Toggled reminder for saved event: $savedEventId to $enabled');
    }, operationName: 'toggleReminder');
  }

  @override
  Future<Result<void>> setReminderTime(String savedEventId, DateTime reminderTime) {
    return execute(() async {
      await _service.setReminderTime(savedEventId, reminderTime);
      logDebug('Set reminder time for saved event: $savedEventId');
    }, operationName: 'setReminderTime');
  }

  @override
  Future<Result<List<SavedEvent>>> getSavedEventsWithReminders() {
    return execute(() async {
      final events = await _service.getSavedEventsWithReminders();
      logDbOperation('SELECT', 'saved_events', rowCount: events.length);
      return events;
    }, operationName: 'getSavedEventsWithReminders');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTES
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<void>> updateNotes(String savedEventId, String notes) {
    return execute(() async {
      await _service.updateNotes(savedEventId, notes);
      logDebug('Updated notes for saved event: $savedEventId');
    }, operationName: 'updateNotes');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  String? getCurrentUserId() => SupabaseConfig.auth.currentUser?.id;

  @override
  void invalidateCache() {
    _service.invalidateCache();
    _optimisticState.clear();
    logDebug('Cache invalidated');
  }
}
