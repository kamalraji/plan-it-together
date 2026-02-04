import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/models.dart';
import '../models/event_venue.dart';
import '../models/event_virtual_link.dart';
import '../models/event_image.dart';
import '../models/event_faq.dart';
import '../utils/result.dart';
import '../services/event_service.dart';
import '../services/registration_service.dart';
import 'base_repository.dart';
import 'event_repository.dart';

/// Supabase implementation of [EventRepository].
/// 
/// Extends [BaseRepository] for standardized error handling and logging.
/// Wraps [EventService] and [RegistrationService] with consistent Result<T> return types.
class SupabaseEventRepository extends BaseRepository implements EventRepository {
  @override
  String get tag => 'EventRepository';
  
  final EventService _eventService;
  final RegistrationService _registrationService;
  final SupabaseClient _client = Supabase.instance.client;

  SupabaseEventRepository({
    EventService? eventService,
    RegistrationService? registrationService,
  })  : _eventService = eventService ?? EventService.instance,
        _registrationService = registrationService ?? RegistrationService.instance;

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT RETRIEVAL
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<Event>>> getAllEvents({bool forceRefresh = false}) async {
    final result = await _eventService.getAllEvents(forceRefresh: forceRefresh);
    if (result is Success<List<Event>>) {
      logDbOperation('SELECT', 'events', rowCount: result.data.length);
    }
    return result;
  }

  @override
  Future<Result<List<Event>>> getEventsByCategory(EventCategory category) async {
    return _eventService.getEventsByCategory(category);
  }

  @override
  Future<Result<List<Event>>> getEventsByMode(EventMode mode) async {
    return _eventService.getEventsByMode(mode);
  }

  @override
  Future<Result<Event?>> getEventById(String eventId) async {
    return _eventService.getEventById(eventId);
  }

  @override
  Future<Result<List<Event>>> searchEvents(String query) async {
    return _eventService.searchEvents(query);
  }

  @override
  Future<Result<List<Event>>> getUpcomingEvents() async {
    return _eventService.getUpcomingEvents();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TICKET TIERS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<TicketTier>>> getTicketTiers(String eventId) async {
    return _eventService.getTicketTiers(eventId);
  }

  @override
  Future<Result<Map<String, List<TicketTier>>>> getTicketTiersForEvents(
    List<String> eventIds,
  ) async {
    return _eventService.getTicketTiersForEvents(eventIds);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<Event>> createEvent(Event event) async {
    final result = await _eventService.createEvent(event);
    if (result is Success<Event>) {
      logInfo('Created event: ${result.data.name}');
    }
    return result;
  }

  @override
  Future<Result<bool>> updateEvent(Event event) async {
    final result = await _eventService.updateEvent(event);
    if (result is Success<bool>) {
      logInfo('Updated event: ${event.name}');
    }
    return result;
  }

  @override
  Future<Result<bool>> deleteEvent(String eventId) async {
    final result = await _eventService.deleteEvent(eventId);
    if (result is Success<bool>) {
      logInfo('Deleted event: $eventId');
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTRATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<Registration>>> getUserRegistrations(String userId) async {
    final result = await _registrationService.getUserRegistrations(userId);
    if (result is Success<List<Registration>>) {
      logDbOperation('SELECT', 'registrations', rowCount: result.data.length);
    }
    return result;
  }

  @override
  Future<Result<Registration?>> getRegistrationById(String registrationId) {
    return _registrationService.getRegistrationById(registrationId);
  }

  @override
  Future<Result<bool>> isUserRegistered(String userId, String eventId) {
    return _registrationService.isUserRegistered(userId, eventId);
  }

  @override
  Future<Result<Registration?>> getUserEventRegistration(
    String userId,
    String eventId,
  ) {
    return _registrationService.getUserEventRegistration(userId, eventId);
  }

  @override
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
  }) {
    return execute(() async {
      final registration = await RegistrationService.registerForEvent(
        eventId: eventId,
        tierId: tierId,
        quantity: quantity,
        userId: userId,
        userName: userName,
        userEmail: userEmail,
        formResponses: formResponses,
        promoCodeId: promoCodeId,
        subtotal: subtotal,
        discountAmount: discountAmount,
        totalAmount: totalAmount,
      );

      if (registration == null) {
        throw Exception('Registration failed');
      }

      logInfo('Registered user for event: $eventId');
      return registration;
    }, operationName: 'registerForEvent');
  }

  @override
  Future<Result<bool>> updateRegistrationStatus(
    String registrationId,
    RegistrationStatus status,
  ) {
    return _registrationService.updateRegistrationStatus(registrationId, status).then((result) {
      if (result is Success<bool> && result.data == true) {
        logInfo('Updated registration status to ${status.name}');
      }
      return result;
    });
  }

  @override
  Future<Result<bool>> cancelRegistration(String registrationId) {
    return _registrationService.cancelRegistration(registrationId).then((result) {
      if (result is Success<bool> && result.data == true) {
        logInfo('Cancelled registration: $registrationId');
      }
      return result;
    });
  }

  @override
  Future<Result<bool>> deleteRegistration(String registrationId) {
    return _registrationService.deleteRegistration(registrationId).then((result) {
      if (result is Success<bool> && result.data == true) {
        logInfo('Deleted registration: $registrationId');
      }
      return result;
    });
  }

  @override
  Future<Result<int>> getEventRegistrationCount(String eventId) {
    return _registrationService.getEventRegistrationCount(eventId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT VENUES (Normalized Table)
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<EventVenue?>> getEventVenue(String eventId) {
    return execute(() async {
      final response = await _client
          .from('event_venues')
          .select()
          .eq('event_id', eventId)
          .maybeSingle();

      if (response == null) return null;
      return EventVenue.fromJson(response);
    }, operationName: 'getEventVenue');
  }

  @override
  Future<Result<EventVenue>> upsertEventVenue(EventVenue venue) {
    return execute(() async {
      final response = await _client
          .from('event_venues')
          .upsert(venue.toJson())
          .select()
          .single();

      logInfo('Upserted venue for event: ${venue.eventId}');
      return EventVenue.fromJson(response);
    }, operationName: 'upsertEventVenue');
  }

  @override
  Future<Result<bool>> deleteEventVenue(String eventId) {
    return execute(() async {
      await _client.from('event_venues').delete().eq('event_id', eventId);
      logInfo('Deleted venue for event: $eventId');
      return true;
    }, operationName: 'deleteEventVenue');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT VIRTUAL LINKS (Normalized Table)
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<EventVirtualLink>>> getEventVirtualLinks(String eventId) {
    return execute(() async {
      final response = await _client
          .from('event_virtual_links')
          .select()
          .eq('event_id', eventId)
          .order('is_primary', ascending: false);

      final links = (response as List)
          .map((json) => EventVirtualLink.fromJson(json as Map<String, dynamic>))
          .toList();
      return links;
    }, operationName: 'getEventVirtualLinks');
  }

  @override
  Future<Result<EventVirtualLink?>> getPrimaryVirtualLink(String eventId) {
    return execute(() async {
      final response = await _client
          .from('event_virtual_links')
          .select()
          .eq('event_id', eventId)
          .eq('is_primary', true)
          .maybeSingle();

      if (response == null) return null;
      return EventVirtualLink.fromJson(response);
    }, operationName: 'getPrimaryVirtualLink');
  }

  @override
  Future<Result<EventVirtualLink>> createVirtualLink(EventVirtualLink link) {
    return execute(() async {
      final response = await _client
          .from('event_virtual_links')
          .insert(link.toJson())
          .select()
          .single();

      logInfo('Created virtual link for event: ${link.eventId}');
      return EventVirtualLink.fromJson(response);
    }, operationName: 'createVirtualLink');
  }

  @override
  Future<Result<bool>> updateVirtualLink(EventVirtualLink link) {
    return execute(() async {
      await _client
          .from('event_virtual_links')
          .update(link.toJson())
          .eq('id', link.id);

      logInfo('Updated virtual link: ${link.id}');
      return true;
    }, operationName: 'updateVirtualLink');
  }

  @override
  Future<Result<bool>> deleteVirtualLink(String linkId) {
    return execute(() async {
      await _client.from('event_virtual_links').delete().eq('id', linkId);
      logInfo('Deleted virtual link: $linkId');
      return true;
    }, operationName: 'deleteVirtualLink');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT IMAGES (Normalized Table)
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<EventImage>>> getEventImages(String eventId) {
    return execute(() async {
      final response = await _client
          .from('event_images')
          .select()
          .eq('event_id', eventId)
          .order('sort_order', ascending: true);

      final images = (response as List)
          .map((json) => EventImage.fromJson(json as Map<String, dynamic>))
          .toList();
      return images;
    }, operationName: 'getEventImages');
  }

  @override
  Future<Result<EventImage?>> getPrimaryEventImage(String eventId) {
    return execute(() async {
      final response = await _client
          .from('event_images')
          .select()
          .eq('event_id', eventId)
          .eq('is_primary', true)
          .maybeSingle();

      if (response == null) return null;
      return EventImage.fromJson(response);
    }, operationName: 'getPrimaryEventImage');
  }

  @override
  Future<Result<EventImage>> addEventImage(EventImage image) {
    return execute(() async {
      final response = await _client
          .from('event_images')
          .insert(image.toJson())
          .select()
          .single();

      logInfo('Added image to event: ${image.eventId}');
      return EventImage.fromJson(response);
    }, operationName: 'addEventImage');
  }

  @override
  Future<Result<bool>> updateEventImage(EventImage image) {
    return execute(() async {
      await _client
          .from('event_images')
          .update(image.toJson())
          .eq('id', image.id);

      logInfo('Updated event image: ${image.id}');
      return true;
    }, operationName: 'updateEventImage');
  }

  @override
  Future<Result<bool>> deleteEventImage(String imageId) {
    return execute(() async {
      await _client.from('event_images').delete().eq('id', imageId);
      logInfo('Deleted event image: $imageId');
      return true;
    }, operationName: 'deleteEventImage');
  }

  @override
  Future<Result<bool>> reorderEventImages(String eventId, List<String> imageIds) {
    return execute(() async {
      for (var i = 0; i < imageIds.length; i++) {
        await _client
            .from('event_images')
            .update({'sort_order': i})
            .eq('id', imageIds[i]);
      }
      logInfo('Reordered images for event: $eventId');
      return true;
    }, operationName: 'reorderEventImages');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT FAQS (Normalized Table)
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Future<Result<List<EventFaq>>> getEventFaqs(String eventId) {
    return execute(() async {
      final response = await _client
          .from('event_faqs')
          .select()
          .eq('event_id', eventId)
          .order('sort_order', ascending: true);

      final faqs = (response as List)
          .map((json) => EventFaq.fromJson(json as Map<String, dynamic>))
          .toList();
      return faqs;
    }, operationName: 'getEventFaqs');
  }

  @override
  Future<Result<List<EventFaq>>> getPublishedEventFaqs(String eventId) {
    return execute(() async {
      final response = await _client
          .from('event_faqs')
          .select()
          .eq('event_id', eventId)
          .eq('is_published', true)
          .order('sort_order', ascending: true);

      final faqs = (response as List)
          .map((json) => EventFaq.fromJson(json as Map<String, dynamic>))
          .toList();
      return faqs;
    }, operationName: 'getPublishedEventFaqs');
  }

  @override
  Future<Result<EventFaq>> upsertEventFaq(EventFaq faq) {
    return execute(() async {
      final response = await _client
          .from('event_faqs')
          .upsert(faq.toJson())
          .select()
          .single();

      logInfo('Upserted FAQ for event: ${faq.eventId}');
      return EventFaq.fromJson(response);
    }, operationName: 'upsertEventFaq');
  }

  @override
  Future<Result<bool>> deleteEventFaq(String faqId) {
    return execute(() async {
      await _client.from('event_faqs').delete().eq('id', faqId);
      logInfo('Deleted FAQ: $faqId');
      return true;
    }, operationName: 'deleteEventFaq');
  }

  @override
  Future<Result<bool>> reorderEventFaqs(String eventId, List<String> faqIds) {
    return execute(() async {
      for (var i = 0; i < faqIds.length; i++) {
        await _client
            .from('event_faqs')
            .update({'sort_order': i})
            .eq('id', faqIds[i]);
      }
      logInfo('Reordered FAQs for event: $eventId');
      return true;
    }, operationName: 'reorderEventFaqs');
  }
}
