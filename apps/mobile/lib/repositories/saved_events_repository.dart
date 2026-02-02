import '../models/saved_event.dart';
import '../utils/result.dart';

/// Abstract repository interface for saved/bookmarked event operations.
/// 
/// This provides a clean abstraction over the saved events data layer, enabling:
/// - Consistent error handling via Result<T> pattern
/// - Optimistic UI updates with offline queue support
/// - Easy testing through mock implementations
/// - Separation of concerns between UI and data access
/// 
/// ## Optimistic Updates
/// 
/// Save/unsave operations return immediately with optimistic state,
/// then sync to the backend. If the operation fails, the optimistic
/// state is reverted.
/// 
/// ## Offline Support
/// 
/// When offline, save/unsave operations are queued and synced
/// when connectivity is restored.
abstract class SavedEventsRepository {
  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE/UNSAVE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Saves an event to the user's bookmarks.
  /// 
  /// Returns immediately with optimistic state, syncs in background.
  Future<Result<void>> saveEvent(String eventId);

  /// Removes an event from the user's bookmarks.
  /// 
  /// Returns immediately with optimistic state, syncs in background.
  Future<Result<void>> unsaveEvent(String eventId);

  /// Toggles the saved state of an event.
  Future<Result<bool>> toggleSaveEvent(String eventId);

  // ═══════════════════════════════════════════════════════════════════════════
  // RETRIEVAL
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets all saved events for the current user.
  /// 
  /// Uses cache-first strategy. Set [forceRefresh] to bypass cache.
  Future<Result<List<SavedEvent>>> getSavedEvents({bool forceRefresh = false});

  /// Gets saved events filtered by upcoming/past status.
  Future<Result<List<SavedEvent>>> getUpcomingSavedEvents();
  Future<Result<List<SavedEvent>>> getPastSavedEvents();

  /// Gets a single saved event by event ID.
  Future<Result<SavedEvent?>> getSavedEventByEventId(String eventId);

  /// Gets the count of saved events.
  Future<Result<int>> getSavedEventsCount();

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS CHECKS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Checks if an event is saved (includes optimistic state).
  Future<Result<bool>> isEventSaved(String eventId);

  /// Synchronous check using optimistic state only.
  /// 
  /// Returns true if optimistically saved, false if optimistically unsaved,
  /// null if no optimistic state (need to check DB).
  bool? isOptimisticallySaved(String eventId);

  // ═══════════════════════════════════════════════════════════════════════════
  // REMINDERS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Enables or disables the reminder for a saved event.
  Future<Result<void>> toggleReminder(String savedEventId, bool enabled);

  /// Sets a specific reminder time for a saved event.
  Future<Result<void>> setReminderTime(String savedEventId, DateTime reminderTime);

  /// Gets saved events with reminders enabled.
  Future<Result<List<SavedEvent>>> getSavedEventsWithReminders();

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Updates personal notes for a saved event.
  Future<Result<void>> updateNotes(String savedEventId, String notes);

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets the current user's ID.
  String? getCurrentUserId();

  /// Forces a cache refresh on next getSavedEvents call.
  void invalidateCache();
}
