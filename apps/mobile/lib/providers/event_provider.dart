import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../repositories/event_repository.dart';
import '../services/saved_events_service.dart';
import '../utils/result.dart';
import '../utils/result_extensions.dart';
import '../services/logging_service.dart';
import '../supabase/supabase_config.dart';

/// State of the event loading process.
enum EventLoadState {
  initial,
  loading,
  loaded,
  error,
  refreshing,
}

/// Provider for event state management using ChangeNotifier.
/// 
/// Centralizes event data (listing, filtering, search, saved events) and 
/// notifies listeners when state changes. Designed for cross-page sharing.
/// 
/// Usage:
/// ```dart
/// // In main.dart
/// ChangeNotifierProvider(
///   create: (_) => EventProvider(SupabaseEventRepository()),
///   child: MyApp(),
/// )
/// 
/// // In widgets
/// final eventProvider = context.watch<EventProvider>();
/// ```
class EventProvider extends ChangeNotifier {
  static const _tag = 'EventProvider';

  final EventRepository _repository;
  final SavedEventsService _savedEventsService;

  EventProvider(
    this._repository, {
    SavedEventsService? savedEventsService,
  }) : _savedEventsService = savedEventsService ?? SavedEventsService.instance;

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  EventLoadState _state = EventLoadState.initial;
  List<Event> _events = [];
  Map<String, List<TicketTier>> _tiersByEvent = {};
  Set<String> _savedEventIds = {};
  Event? _selectedEvent;
  String? _errorMessage;

  // Filtering state
  EventCategory? _activeCategory;
  EventMode? _activeMode;
  String _searchQuery = '';

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  EventLoadState get state => _state;
  List<Event> get events => _events;
  Map<String, List<TicketTier>> get tiersByEvent => _tiersByEvent;
  Set<String> get savedEventIds => _savedEventIds;
  Event? get selectedEvent => _selectedEvent;
  String? get errorMessage => _errorMessage;

  // Filtering getters
  EventCategory? get activeCategory => _activeCategory;
  EventMode? get activeMode => _activeMode;
  String get searchQuery => _searchQuery;

  // Computed properties
  bool get isLoading => _state == EventLoadState.loading;
  bool get isRefreshing => _state == EventLoadState.refreshing;
  bool get hasError => _state == EventLoadState.error;
  bool get hasData => _events.isNotEmpty;
  int get savedCount => _savedEventIds.length;
  int get totalEvents => _events.length;

  /// Current user ID from auth.
  String? get currentUserId => SupabaseConfig.auth.currentUser?.id;

  /// Returns filtered events based on active filters and search query.
  List<Event> get filteredEvents {
    var result = _events;

    // Filter by category
    if (_activeCategory != null) {
      result = result.where((e) => e.category == _activeCategory).toList();
    }

    // Filter by mode
    if (_activeMode != null) {
      result = result.where((e) => e.mode == _activeMode).toList();
    }

    // Filter by search query
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      result = result.where((e) {
        return e.name.toLowerCase().contains(query) ||
            (e.description?.toLowerCase().contains(query) ?? false) ||
            e.organization.name.toLowerCase().contains(query);
      }).toList();
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  /// Loads all events with optional force refresh.
  Future<void> loadEvents({bool forceRefresh = false}) async {
    if (_state == EventLoadState.loading) return;

    _state = forceRefresh ? EventLoadState.refreshing : EventLoadState.loading;
    _errorMessage = null;
    notifyListeners();

    final result = await _repository.getAllEvents(forceRefresh: forceRefresh);

    result.handle(
      onSuccess: (events) {
        _events = events;
        _state = EventLoadState.loaded;
        log.info('Loaded ${events.length} events', tag: _tag);

        // Load ticket tiers and saved events in background
        _loadTicketTiersForEvents(events.map((e) => e.id).toList());
        _loadSavedEventIds();
      },
      onFailure: (message, error) {
        _errorMessage = message;
        _state = EventLoadState.error;
        log.error('Failed to load events: $message', tag: _tag, error: error);
      },
    );

    notifyListeners();
  }

  /// Loads events by category.
  Future<void> loadEventsByCategory(EventCategory category) async {
    _state = EventLoadState.loading;
    _errorMessage = null;
    notifyListeners();

    final result = await _repository.getEventsByCategory(category);

    result.handle(
      onSuccess: (events) {
        _events = events;
        _activeCategory = category;
        _state = EventLoadState.loaded;
      },
      onFailure: (message, error) {
        _errorMessage = message;
        _state = EventLoadState.error;
        log.error('Failed to load category events', tag: _tag, error: error);
      },
    );

    notifyListeners();
  }

  /// Loads events by mode (online/offline/hybrid).
  Future<void> loadEventsByMode(EventMode mode) async {
    _state = EventLoadState.loading;
    _errorMessage = null;
    notifyListeners();

    final result = await _repository.getEventsByMode(mode);

    result.handle(
      onSuccess: (events) {
        _events = events;
        _activeMode = mode;
        _state = EventLoadState.loaded;
      },
      onFailure: (message, error) {
        _errorMessage = message;
        _state = EventLoadState.error;
        log.error('Failed to load mode events', tag: _tag, error: error);
      },
    );

    notifyListeners();
  }

  /// Loads a single event by ID.
  Future<Event?> loadEventById(String eventId) async {
    final result = await _repository.getEventById(eventId);

    Event? event;
    result.handle(
      onSuccess: (e) {
        event = e;
        _selectedEvent = e;
        notifyListeners();
      },
      onFailure: (message, _) {
        log.warning('Event not found: $eventId', tag: _tag);
      },
    );

    return event;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTERING & SEARCH
  // ═══════════════════════════════════════════════════════════════════════════

  /// Sets the active category filter.
  void setCategory(EventCategory? category) {
    if (_activeCategory == category) return;
    _activeCategory = category;
    notifyListeners();
    log.debug('Category filter set: ${category?.name ?? "all"}', tag: _tag);
  }

  /// Sets the active mode filter.
  void setMode(EventMode? mode) {
    if (_activeMode == mode) return;
    _activeMode = mode;
    notifyListeners();
    log.debug('Mode filter set: ${mode?.name ?? "all"}', tag: _tag);
  }

  /// Sets the search query.
  void setSearchQuery(String query) {
    if (_searchQuery == query) return;
    _searchQuery = query;
    notifyListeners();
  }

  /// Clears all active filters.
  void clearFilters() {
    _activeCategory = null;
    _activeMode = null;
    _searchQuery = '';
    notifyListeners();
    log.debug('Filters cleared', tag: _tag);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVED EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Checks if an event is saved.
  bool isEventSaved(String eventId) {
    // Check optimistic state first
    if (_savedEventsService.isOptimisticallySaved(eventId)) return true;
    return _savedEventIds.contains(eventId);
  }

  /// Toggles save status for an event.
  Future<void> toggleSaveEvent(String eventId) async {
    final isSaved = isEventSaved(eventId);

    // Optimistic update
    if (isSaved) {
      _savedEventIds.remove(eventId);
    } else {
      _savedEventIds.add(eventId);
    }
    notifyListeners();

    // Sync with backend
    final success = isSaved
        ? await _savedEventsService.unsaveEvent(eventId)
        : await _savedEventsService.saveEvent(eventId);

    if (!success) {
      // Revert on failure
      if (isSaved) {
        _savedEventIds.add(eventId);
      } else {
        _savedEventIds.remove(eventId);
      }
      notifyListeners();
      log.warning('Save toggle failed, reverted', tag: _tag);
    }
  }

  /// Refreshes saved event IDs from backend.
  Future<void> refreshSavedEvents() async {
    await _loadSavedEventIds(forceRefresh: true);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SELECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /// Selects an event for detail view.
  void selectEvent(Event? event) {
    _selectedEvent = event;
    notifyListeners();
  }

  /// Clears the selected event.
  void clearSelectedEvent() {
    _selectedEvent = null;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TICKET TIERS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets ticket tiers for a specific event.
  List<TicketTier> getTiersForEvent(String eventId) {
    return _tiersByEvent[eventId] ?? [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  /// Clears all event state (call on logout).
  void clearAll() {
    _events = [];
    _tiersByEvent = {};
    _savedEventIds = {};
    _selectedEvent = null;
    _activeCategory = null;
    _activeMode = null;
    _searchQuery = '';
    _state = EventLoadState.initial;
    _errorMessage = null;
    notifyListeners();
    log.info('Event state cleared', tag: _tag);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> _loadTicketTiersForEvents(List<String> eventIds) async {
    if (eventIds.isEmpty) return;

    final result = await _repository.getTicketTiersForEvents(eventIds);
    result.handle(
      onSuccess: (tiers) {
        _tiersByEvent = tiers;
        notifyListeners();
        log.debug('Loaded tiers for ${tiers.length} events', tag: _tag);
      },
      onFailure: (_, __) {
        log.warning('Failed to load ticket tiers', tag: _tag);
      },
    );
  }

  Future<void> _loadSavedEventIds({bool forceRefresh = false}) async {
    try {
      final savedEvents = await _savedEventsService.getSavedEvents(
        forceRefresh: forceRefresh,
      );
      _savedEventIds = savedEvents.map((e) => e.eventId).toSet();
      notifyListeners();
      log.debug('Loaded ${_savedEventIds.length} saved event IDs', tag: _tag);
    } catch (e) {
      log.warning('Failed to load saved event IDs', tag: _tag);
    }
  }
}
