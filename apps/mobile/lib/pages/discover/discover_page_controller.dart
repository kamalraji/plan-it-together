import 'package:flutter/foundation.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/services/event_service.dart';
import 'package:thittam1hub/services/saved_events_service.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/pages/discover/products_discovery_page.dart';
import 'package:thittam1hub/pages/discover/discover_tabs.dart';
import 'package:thittam1hub/models/product_with_org.dart';
import 'package:thittam1hub/services/logging_mixin.dart';

// Re-export for convenience
export 'package:thittam1hub/pages/discover/discover_tabs.dart';

/// Controller for DiscoverPage - handles all business logic
/// Reduces the page to UI-only by extracting state and operations
class DiscoverPageController extends ChangeNotifier with LoggingMixin {
  @override
  String get logTag => 'DiscoverPageController';

  // Dependencies
  final EventService _eventService;
  final SavedEventsService _savedEventsService;

  // View state
  DiscoverView _currentView = DiscoverView.events;
  bool _showSearch = false;
  String _searchQuery = '';

  // Events state
  List<Event> _events = [];
  Map<String, List<TicketTier>> _tiersByEvent = {};
  Set<String> _savedEventIds = {};
  EventCategory? _selectedCategory;
  EventMode? _selectedMode;
  bool _isLoading = true;
  String? _errorMessage;

  // Products state
  String? _productCategory;
  ProductSortBy _productSort = ProductSortBy.featured;

  // Large screen selection
  Event? _selectedEvent;

  DiscoverPageController({
    EventService? eventService,
    SavedEventsService? savedEventsService,
    String? initialView,
    String? initialCategory,
    String? initialMode,
    String? initialSort,
    String? initialSearch,
  })  : _eventService = eventService ?? EventService.instance,
        _savedEventsService = savedEventsService ?? SavedEventsService.instance {
    _initializeFilters(
      initialView: initialView,
      initialCategory: initialCategory,
      initialMode: initialMode,
      initialSort: initialSort,
      initialSearch: initialSearch,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  DiscoverView get currentView => _currentView;
  bool get showSearch => _showSearch;
  String get searchQuery => _searchQuery;
  List<Event> get events => List.unmodifiable(_events);
  Map<String, List<TicketTier>> get tiersByEvent => Map.unmodifiable(_tiersByEvent);
  Set<String> get savedEventIds => Set.unmodifiable(_savedEventIds);
  EventCategory? get selectedCategory => _selectedCategory;
  EventMode? get selectedMode => _selectedMode;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String? get productCategory => _productCategory;
  ProductSortBy get productSort => _productSort;
  Event? get selectedEvent => _selectedEvent;

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  void _initializeFilters({
    String? initialView,
    String? initialCategory,
    String? initialMode,
    String? initialSort,
    String? initialSearch,
  }) {
    // Initialize view
    _currentView = DiscoverViewExtension.fromString(initialView);

    // Initialize product filters
    _productCategory = initialCategory;
    if (initialSort != null) {
      _productSort = ProductSortByExtension.fromString(initialSort);
    }

    // Initialize event filters (only parse as event category if on events view)
    if (_currentView == DiscoverView.events && initialCategory != null) {
      _selectedCategory = _parseCategory(initialCategory);
    }
    if (initialMode != null) {
      _selectedMode = _parseMode(initialMode);
    }
    
    // Initialize search query
    if (initialSearch != null && initialSearch.isNotEmpty) {
      _searchQuery = initialSearch;
      _showSearch = true;
    }
  }

  /// Initialize and load data
  Future<void> initialize() async {
    await _loadSavedEventIds();
    if (_currentView == DiscoverView.events) {
      await loadEvents();
    }
  }

  Future<void> _loadSavedEventIds() async {
    try {
      final savedEvents = await _savedEventsService.getSavedEvents();
      _savedEventIds = savedEvents.map((e) => e.eventId).toSet();
      notifyListeners();
    } catch (e) {
      logError('Failed to load saved event IDs', error: e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY & MODE PARSING
  // ═══════════════════════════════════════════════════════════════════════════

  EventCategory? _parseCategory(String category) {
    if (category.isEmpty) return null;

    final upper = category.toUpperCase().trim();

    final match = EventCategory.values.cast<EventCategory?>().firstWhere(
          (e) => e?.name == upper,
          orElse: () => null,
        );

    if (match == null) {
      logDebug('Unknown event category "$category"');
    }

    return match;
  }

  EventMode? _parseMode(String mode) {
    switch (mode.toLowerCase()) {
      case 'online':
        return EventMode.ONLINE;
      case 'offline':
        return EventMode.OFFLINE;
      case 'hybrid':
        return EventMode.HYBRID;
      default:
        return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  void setView(DiscoverView view) {
    if (view == _currentView) return;
    _currentView = view;
    _showSearch = false;
    _searchQuery = '';
    notifyListeners();

    if (view == DiscoverView.events && _events.isEmpty) {
      loadEvents();
    }
  }

  void toggleSearch() {
    if (_showSearch) {
      _searchQuery = '';
    }
    _showSearch = !_showSearch;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void clearSearch() {
    _searchQuery = '';
    _showSearch = false;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  void setCategory(EventCategory? category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void setMode(EventMode? mode) {
    // Toggle off if same mode is selected
    if (_selectedMode == mode) {
      _selectedMode = null;
    } else {
      _selectedMode = mode;
    }
    notifyListeners();
  }

  void setProductCategory(String? category) {
    _productCategory = category;
    notifyListeners();
  }

  void setProductSort(ProductSortBy sort) {
    _productSort = sort;
    notifyListeners();
  }

  /// Generates URL query parameters for current filter state
  FilterUrlParams getUrlParams() {
    return FilterUrlParams(
      view: _currentView.queryValue,
      category: _currentView == DiscoverView.events
          ? _selectedCategory?.name.toLowerCase()
          : _productCategory,
      mode: _selectedMode?.name.toLowerCase(),
      sort: _currentView == DiscoverView.products ? _productSort.queryValue : null,
      searchQuery: _searchQuery.isNotEmpty ? _searchQuery : null,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> loadEvents({bool forceRefresh = false}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _eventService.getAllEvents(forceRefresh: forceRefresh);

    switch (result) {
      case Success(data: final events):
        logInfo('📅 Loaded ${events.length} events');

        Map<String, List<TicketTier>> tiers = {};
        if (events.isNotEmpty) {
          final ids = events.map((e) => e.id).toList();
          final tiersResult = await _eventService.getTicketTiersForEvents(ids);
          if (tiersResult case Success(data: final tiersData)) {
            tiers = tiersData;
          }
        }

        _events = events;
        _tiersByEvent = tiers;
        _isLoading = false;
        notifyListeners();

      case Failure(message: final msg):
        _errorMessage = msg;
        _isLoading = false;
        notifyListeners();
    }
  }

  /// Refresh events (for pull-to-refresh)
  Future<void> onRefresh() async {
    await loadEvents(forceRefresh: true);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTERING
  // ═══════════════════════════════════════════════════════════════════════════

  /// Returns filtered and sorted events based on current filters
  List<Event> get filteredEvents {
    final now = DateTime.now();
    final query = _searchQuery.trim().toLowerCase();

    return _events.where((e) {
      // Only show upcoming events (no past events tab)
      if (e.endDate.isBefore(now)) return false;
      if (_selectedCategory != null && e.category != _selectedCategory) return false;
      if (_selectedMode != null && e.mode != _selectedMode) return false;
      if (query.isNotEmpty) {
        final t = '${e.name} ${e.description ?? ''} ${e.organization.name}'.toLowerCase();
        if (!t.contains(query)) return false;
      }
      return true;
    }).toList()
      ..sort((a, b) => a.startDate.compareTo(b.startDate));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVED EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  bool isEventSaved(String eventId) => _savedEventIds.contains(eventId);

  Future<void> toggleSaveEvent(String eventId) async {
    final wasSaved = _savedEventIds.contains(eventId);

    // Optimistic update
    if (wasSaved) {
      _savedEventIds.remove(eventId);
    } else {
      _savedEventIds.add(eventId);
    }
    notifyListeners();

    try {
      if (wasSaved) {
        await _savedEventsService.unsaveEvent(eventId);
      } else {
        await _savedEventsService.saveEvent(eventId);
      }
    } catch (e) {
      // Revert on failure
      if (wasSaved) {
        _savedEventIds.add(eventId);
      } else {
        _savedEventIds.remove(eventId);
      }
      notifyListeners();
      logError('Failed to toggle save event', error: e);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LARGE SCREEN SELECTION
  // ═══════════════════════════════════════════════════════════════════════════

  void selectEvent(Event? event) {
    _selectedEvent = event;
    notifyListeners();
  }

  void clearSelectedEvent() {
    _selectedEvent = null;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets tiers for a specific event
  List<TicketTier> getTiersForEvent(String eventId) {
    return _tiersByEvent[eventId] ?? const [];
  }

  /// Featured categories for the filter chips
  static const List<EventCategory?> featuredCategories = [
    null, // All
    EventCategory.HACKATHON,
    EventCategory.WORKSHOP,
    EventCategory.CONFERENCE,
    EventCategory.MEETUP,
    EventCategory.WEBINAR,
    EventCategory.NETWORKING,
    EventCategory.STARTUP_PITCH,
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA CLASSES
// ═══════════════════════════════════════════════════════════════════════════

/// URL parameters for filter state
class FilterUrlParams {
  final String view;
  final String? category;
  final String? mode;
  final String? sort;
  final String? searchQuery;

  const FilterUrlParams({
    required this.view,
    this.category,
    this.mode,
    this.sort,
    this.searchQuery,
  });
}
