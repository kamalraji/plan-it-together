import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/models/event_faq.dart';
import 'package:thittam1hub/services/event_service.dart';
import 'package:thittam1hub/services/saved_events_service.dart';
import 'package:thittam1hub/services/registration_service.dart';
import 'package:thittam1hub/services/logging_mixin.dart';
import 'package:thittam1hub/repositories/supabase_event_repository.dart';
import 'package:thittam1hub/utils/result.dart';

/// Controller for EventDetailPage - handles all business logic.
/// 
/// Follows the ProfilePageController pattern for consistency:
/// - All state management centralized
/// - Parallel loading via Future.wait
/// - Computed getters for derived state
/// - Dependency injection for testability
class EventDetailPageController extends ChangeNotifier with LoggingMixin {
  @override
  String get logTag => 'EventDetailPageController';

  // Dependencies
  final EventService _eventService;
  final SavedEventsService _savedEventsService;
  final RegistrationService _registrationService;
  final SupabaseEventRepository _eventRepository;

  // Core identifiers
  final String eventId;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  Event? _event;
  List<TicketTier> _tiers = [];
  List<EventFaq> _faqs = [];
  
  // Loading states
  bool _isLoading = true;
  bool _faqsLoading = false;
  bool _isSaving = false;
  bool _checkingRegistration = false;
  
  // Feature states
  bool _isSaved = false;
  bool _aboutExpanded = false;
  Registration? _existingRegistration;
  
  // Social proof
  int _registeredCount = 0;
  List<String> _attendeeAvatars = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════════════════════

  EventDetailPageController({
    required this.eventId,
    Event? initialEvent,
    EventService? eventService,
    SavedEventsService? savedEventsService,
    RegistrationService? registrationService,
    SupabaseEventRepository? eventRepository,
  })  : _eventService = eventService ?? EventService.instance,
        _savedEventsService = savedEventsService ?? SavedEventsService.instance,
        _registrationService = registrationService ?? RegistrationService.instance,
        _eventRepository = eventRepository ?? SupabaseEventRepository() {
    // Use passed event for immediate display (enables smooth hero animation)
    if (initialEvent != null) {
      _event = initialEvent;
      _isLoading = false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS - Core State
  // ═══════════════════════════════════════════════════════════════════════════

  Event? get event => _event;
  List<TicketTier> get tiers => List.unmodifiable(_tiers);
  List<EventFaq> get faqs => List.unmodifiable(_faqs);
  
  // Loading states
  bool get isLoading => _isLoading;
  bool get faqsLoading => _faqsLoading;
  bool get isSaving => _isSaving;
  bool get checkingRegistration => _checkingRegistration;
  
  // Feature states
  bool get isSaved => _isSaved;
  bool get aboutExpanded => _aboutExpanded;
  Registration? get existingRegistration => _existingRegistration;
  
  // Social proof
  int get registeredCount => _registeredCount;
  List<String> get attendeeAvatars => List.unmodifiable(_attendeeAvatars);

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS - Computed Properties
  // ═══════════════════════════════════════════════════════════════════════════

  /// Whether user is already registered for this event
  bool get isRegistered => _existingRegistration != null;

  /// Whether event is upcoming (starts in the future)
  bool get isUpcoming => _event != null && _event!.startDate.isAfter(DateTime.now());

  /// Current user ID from Supabase auth
  String? get currentUserId => Supabase.instance.client.auth.currentUser?.id;

  /// Available ticket tiers (within sale window, has stock)
  List<TicketTier> get availableTiers {
    final now = DateTime.now();
    return _tiers.where((t) {
      final withinStart = t.saleStart == null || !now.isBefore(t.saleStart!);
      final withinEnd = t.saleEnd == null || !now.isAfter(t.saleEnd!);
      final hasStock = t.quantity == null || t.soldCount < t.quantity!;
      return t.isActive && withinStart && withinEnd && hasStock;
    }).toList()
      ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
  }

  /// Price range for display
  PriceRange get priceRange {
    final priceTiers = availableTiers.isNotEmpty ? availableTiers : _tiers;
    if (priceTiers.isEmpty) return const PriceRange(label: '', min: null, max: null);

    final prices = priceTiers.map((t) => t.price).where((p) => p >= 0).toList()..sort();
    if (prices.isEmpty) return const PriceRange(label: '', min: null, max: null);

    final minP = prices.first;
    final maxP = prices.last;
    
    if (minP == 0 && maxP == 0) {
      return PriceRange(label: 'Free', min: minP, max: maxP);
    }
    if (minP == 0 && maxP > 0) {
      return PriceRange(label: 'Free – ₹${maxP.toStringAsFixed(0)}', min: minP, max: maxP);
    }
    if (minP == maxP) {
      return PriceRange(label: '₹${minP.toStringAsFixed(0)}', min: minP, max: maxP);
    }
    return PriceRange(
      label: '₹${minP.toStringAsFixed(0)} – ₹${maxP.toStringAsFixed(0)}',
      min: minP,
      max: maxP,
    );
  }

  /// Mode badge information (icon, color, label)
  ModeBadge get modeBadge {
    if (_event == null) return const ModeBadge.empty();
    return switch (_event!.mode) {
      EventMode.ONLINE => const ModeBadge.online(),
      EventMode.OFFLINE => const ModeBadge.offline(),
      EventMode.HYBRID => const ModeBadge.hybrid(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  /// Initialize the controller - call from initState
  /// Uses Future.wait for parallel loading (Phase 2 optimization)
  Future<void> initialize() async {
    logDebug('Initializing EventDetailPageController for: $eventId');
    
    // Load all data in parallel for performance
    await Future.wait([
      loadEvent(),
      loadFaqs(),
      checkIfSaved(),
      checkExistingRegistration(),
    ]);
    
    logDebug('Initialization complete');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> loadEvent() async {
    // Only show loading if we don't have an event yet
    if (_event == null) {
      _isLoading = true;
      notifyListeners();
    }

    try {
      // Parallel fetch of event and tiers
      final results = await Future.wait([
        _eventService.getEventById(eventId),
        _eventService.getTicketTiers(eventId),
      ]);

      final eventResult = results[0] as Result<Event?>;
      final tiersResult = results[1] as Result<List<TicketTier>>;

      Event? event;
      if (eventResult case Success(:final data)) {
        event = data;
      } else if (eventResult case Failure(:final message)) {
        logWarning('Failed to load event: $message');
      }

      List<TicketTier> tiers = [];
      int totalRegistered = 0;
      if (tiersResult case Success(:final data)) {
        tiers = data;
        totalRegistered = tiers.fold(0, (sum, t) => sum + t.soldCount);
      }

      _event = event;
      _tiers = tiers;
      _registeredCount = totalRegistered;
      _isLoading = false;
      
      logDebug('Loaded event with ${tiers.length} tiers, $totalRegistered registered');
      notifyListeners();
    } catch (e) {
      logError('Failed to load event', error: e);
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadFaqs() async {
    _faqsLoading = true;
    notifyListeners();

    final result = await _eventRepository.getPublishedEventFaqs(eventId);
    if (result.isSuccess) {
      _faqs = result.dataOrNull ?? [];
      logDebug('Loaded ${_faqs.length} FAQs');
    }
    
    _faqsLoading = false;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVED STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> checkIfSaved() async {
    final saved = await _savedEventsService.isEventSaved(eventId);
    _isSaved = saved;
    notifyListeners();
  }

  /// Toggle saved status with haptic feedback
  /// Returns tuple of (success, newSavedState) for UI feedback
  Future<SaveToggleResult> toggleSave() async {
    if (_isSaving) return SaveToggleResult.busy();

    HapticFeedback.lightImpact();
    _isSaving = true;
    notifyListeners();

    try {
      if (_isSaved) {
        await _savedEventsService.unsaveEvent(eventId);
        logDebug('Unsaved event: $eventId');
      } else {
        await _savedEventsService.saveEvent(eventId);
        logDebug('Saved event: $eventId');
      }
      _isSaved = !_isSaved;
      _isSaving = false;
      notifyListeners();
      return SaveToggleResult.success(_isSaved);
    } catch (e) {
      logError('Failed to toggle save', error: e);
      _isSaving = false;
      notifyListeners();
      return SaveToggleResult.failed(_isSaved);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTRATION STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> checkExistingRegistration() async {
    final userId = currentUserId;
    if (userId == null) return;

    _checkingRegistration = true;
    notifyListeners();

    final registrationResult = await _registrationService.getUserEventRegistration(userId, eventId);
    final registration = registrationResult.dataOrNull;
    _existingRegistration = registration;
    _checkingRegistration = false;
    logDebug('Registration check: ${registration != null ? 'found' : 'none'}');
    notifyListeners();
  }

  /// Refresh registration status after successful registration
  Future<void> refreshAfterRegistration() async {
    await Future.wait([
      checkExistingRegistration(),
      loadEvent(),
    ]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UI STATE
  // ═══════════════════════════════════════════════════════════════════════════

  void toggleAboutExpanded() {
    _aboutExpanded = !_aboutExpanded;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REFRESH
  // ═══════════════════════════════════════════════════════════════════════════

  /// Pull-to-refresh handler with parallel loading
  Future<void> onRefresh() async {
    HapticFeedback.lightImpact();
    await Future.wait([
      loadEvent(),
      loadFaqs(),
      checkIfSaved(),
      checkExistingRegistration(),
    ]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS - Date/Time Formatting
  // ═══════════════════════════════════════════════════════════════════════════

  String formatDate(DateTime dt) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final d = dt.toLocal();
    return '${months[d.month - 1]} ${d.day}, ${d.year}';
  }

  String formatTime(DateTime dt) {
    final d = dt.toLocal();
    final hour = d.hour % 12 == 0 ? 12 : d.hour % 12;
    final min = d.minute.toString().padLeft(2, '0');
    final ampm = d.hour < 12 ? 'AM' : 'PM';
    return '$hour:$min $ampm';
  }

  String formatDuration(DateTime start, DateTime end) {
    final diff = end.difference(start);
    if (diff.inDays > 0) return '${diff.inDays}d ${diff.inHours % 24}h';
    if (diff.inHours > 0) return '${diff.inHours}h ${diff.inMinutes % 60}m';
    return '${diff.inMinutes}m';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA CLASSES
// ═══════════════════════════════════════════════════════════════════════════

/// Price range display data
class PriceRange {
  final String label;
  final double? min;
  final double? max;
  
  const PriceRange({
    required this.label,
    required this.min,
    required this.max,
  });
}

/// Mode badge display data
class ModeBadge {
  final IconData icon;
  final Color color;
  final String label;
  
  const ModeBadge({
    required this.icon,
    required this.color,
    required this.label,
  });
  
  const ModeBadge.empty()
      : this(
          icon: const IconData(0xe23f, fontFamily: 'MaterialIcons'),
          color: const Color(0xFF9E9E9E),
          label: 'Event',
        );

  const ModeBadge.online()
      : this(
          icon: const IconData(0xe80b, fontFamily: 'MaterialIcons'),
          color: const Color(0xFF2196F3),
          label: 'Online',
        );

  const ModeBadge.offline()
      : this(
          icon: const IconData(0xe55e, fontFamily: 'MaterialIcons'),
          color: const Color(0xFF4CAF50),
          label: 'In-person',
        );

  const ModeBadge.hybrid()
      : this(
          icon: const IconData(0xe7ef, fontFamily: 'MaterialIcons'),
          color: const Color(0xFF9C27B0),
          label: 'Hybrid',
        );
}

/// Result of save toggle operation
sealed class SaveToggleResult {
  const SaveToggleResult();
  
  factory SaveToggleResult.success(bool isSaved) = SaveToggleSuccess;
  factory SaveToggleResult.failed(bool currentState) = SaveToggleFailed;
  factory SaveToggleResult.busy() = SaveToggleBusy;
}

class SaveToggleSuccess extends SaveToggleResult {
  final bool isSaved;
  const SaveToggleSuccess(this.isSaved);
}

class SaveToggleFailed extends SaveToggleResult {
  final bool currentState;
  const SaveToggleFailed(this.currentState);
}

class SaveToggleBusy extends SaveToggleResult {
  const SaveToggleBusy();
}
