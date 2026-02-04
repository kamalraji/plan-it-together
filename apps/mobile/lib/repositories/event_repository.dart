import '../models/models.dart';
import '../models/event_venue.dart';
import '../models/event_virtual_link.dart';
import '../models/event_image.dart';
import '../models/event_faq.dart';
import '../utils/result.dart';

/// Abstract repository interface for event operations.
/// 
/// This provides a clean abstraction over the data layer, enabling:
/// - Consistent error handling via Result<T> pattern
/// - Easy testing through mock implementations
/// - Separation of concerns between UI and data access
abstract class EventRepository {
  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT RETRIEVAL
  // ═══════════════════════════════════════════════════════════════════════════

  /// Fetches all published public events with optional cache-first strategy.
  Future<Result<List<Event>>> getAllEvents({bool forceRefresh = false});

  /// Fetches events by category.
  Future<Result<List<Event>>> getEventsByCategory(EventCategory category);

  /// Fetches events by mode (in-person, virtual, hybrid).
  Future<Result<List<Event>>> getEventsByMode(EventMode mode);

  /// Gets a single event by ID.
  Future<Result<Event?>> getEventById(String eventId);

  /// Searches events by name.
  Future<Result<List<Event>>> searchEvents(String query);

  /// Gets upcoming events (limited to 20).
  Future<Result<List<Event>>> getUpcomingEvents();

  // ═══════════════════════════════════════════════════════════════════════════
  // TICKET TIERS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets active ticket tiers for an event.
  Future<Result<List<TicketTier>>> getTicketTiers(String eventId);

  /// Gets ticket tiers for multiple events in a single query.
  /// Returns a map of eventId -> list of active tiers.
  Future<Result<Map<String, List<TicketTier>>>> getTicketTiersForEvents(
    List<String> eventIds,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /// Creates a new event.
  Future<Result<Event>> createEvent(Event event);

  /// Updates an existing event.
  Future<Result<bool>> updateEvent(Event event);

  /// Deletes an event.
  Future<Result<bool>> deleteEvent(String eventId);

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTRATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets all registrations for a user.
  Future<Result<List<Registration>>> getUserRegistrations(String userId);

  /// Gets a registration by ID.
  Future<Result<Registration?>> getRegistrationById(String registrationId);

  /// Checks if a user is registered for an event.
  Future<Result<bool>> isUserRegistered(String userId, String eventId);

  /// Gets the user's registration for a specific event.
  Future<Result<Registration?>> getUserEventRegistration(
    String userId,
    String eventId,
  );

  /// Registers a user for an event.
  Future<Result<Registration>> registerForEvent({
    required String eventId,
    required String tierId,
    required int quantity,
    required String userId,
    required String userName,
    required String userEmail,
    Map<String, dynamic>? formResponses,
    String? promoCodeId,
    double? subtotal,
    double? discountAmount,
    double? totalAmount,
  });

  /// Updates a registration status.
  Future<Result<bool>> updateRegistrationStatus(
    String registrationId,
    RegistrationStatus status,
  );

  /// Cancels a registration.
  Future<Result<bool>> cancelRegistration(String registrationId);

  /// Deletes a registration.
  Future<Result<bool>> deleteRegistration(String registrationId);

  /// Gets the registration count for an event.
  Future<Result<int>> getEventRegistrationCount(String eventId);

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT VENUES (Normalized Table)
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets the venue for an event.
  Future<Result<EventVenue?>> getEventVenue(String eventId);

  /// Creates or updates an event venue.
  Future<Result<EventVenue>> upsertEventVenue(EventVenue venue);

  /// Deletes an event venue.
  Future<Result<bool>> deleteEventVenue(String eventId);

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT VIRTUAL LINKS (Normalized Table)
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets all virtual links for an event.
  Future<Result<List<EventVirtualLink>>> getEventVirtualLinks(String eventId);

  /// Gets the primary virtual link for an event.
  Future<Result<EventVirtualLink?>> getPrimaryVirtualLink(String eventId);

  /// Creates a virtual link for an event.
  Future<Result<EventVirtualLink>> createVirtualLink(EventVirtualLink link);

  /// Updates a virtual link.
  Future<Result<bool>> updateVirtualLink(EventVirtualLink link);

  /// Deletes a virtual link.
  Future<Result<bool>> deleteVirtualLink(String linkId);

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT IMAGES (Normalized Table)
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets all images for an event (sorted by sort_order).
  Future<Result<List<EventImage>>> getEventImages(String eventId);

  /// Gets the primary image for an event.
  Future<Result<EventImage?>> getPrimaryEventImage(String eventId);

  /// Adds an image to an event.
  Future<Result<EventImage>> addEventImage(EventImage image);

  /// Updates an event image.
  Future<Result<bool>> updateEventImage(EventImage image);

  /// Deletes an event image.
  Future<Result<bool>> deleteEventImage(String imageId);

  /// Reorders event images.
  Future<Result<bool>> reorderEventImages(String eventId, List<String> imageIds);

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT FAQS (Normalized Table)
  // ═══════════════════════════════════════════════════════════════════════════

  /// Gets all FAQs for an event (sorted by sort_order).
  Future<Result<List<EventFaq>>> getEventFaqs(String eventId);

  /// Gets only published FAQs for an event.
  Future<Result<List<EventFaq>>> getPublishedEventFaqs(String eventId);

  /// Creates or updates an FAQ.
  Future<Result<EventFaq>> upsertEventFaq(EventFaq faq);

  /// Deletes an FAQ.
  Future<Result<bool>> deleteEventFaq(String faqId);

  /// Reorders FAQs.
  Future<Result<bool>> reorderEventFaqs(String eventId, List<String> faqIds);
}
