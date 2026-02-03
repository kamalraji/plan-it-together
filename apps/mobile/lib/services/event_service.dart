import 'package:thittam1hub/supabase/supabase_config.dart';
import 'package:thittam1hub/models/models.dart';
import 'package:thittam1hub/utils/result.dart';
import 'package:thittam1hub/services/cache_service.dart';
import 'package:thittam1hub/services/base_service.dart';
import 'package:thittam1hub/services/error_handler.dart';

/// Event service with standardized error handling and logging.
/// 
/// Migrated to use [BaseService] pattern with [ErrorHandler.guard]
/// for consistent error classification and [LoggingService] integration.
class EventService extends BaseService with CachingServiceMixin {
  static EventService? _instance;
  static EventService get instance => _instance ??= EventService._();
  EventService._();
  
  final CacheService _cache = CacheService.instance;

  @override
  String get tag => 'EventService';

  /// Get all published public events with cache-first strategy
  /// Uses performance monitoring to detect slow queries (>500ms threshold)
  Future<Result<List<Event>>> getAllEvents({bool forceRefresh = false}) async {
    // Try cache first (unless forced refresh)
    if (!forceRefresh) {
      final cached = await _cache.getCachedEvents();
      if (cached != null) {
        logDebug('Events loaded from cache', metadata: {'count': cached.length});
        return Success(cached);
      }
    }

    // Use performance monitoring for this critical path
    final result = await executeWithMonitoring(() async {
      final data = await SupabaseConfig.client
          .from('events')
          .select('*, organization:organizations(*)')
          // Include COMPLETED so Past Events tab can render finished events
          .inFilter('status', ['PUBLISHED', 'ONGOING', 'COMPLETED'])
          .inFilter('visibility', ['PUBLIC'])
          .order('start_date', ascending: true);

      final events = (data as List).map((json) => Event.fromJson(json)).toList();
      
      // Cache the results
      await _cache.cacheEvents(events);
      logDbOperation('SELECT', 'events', rowCount: events.length);
      
      return events;
    }, operationName: 'getAllEvents', threshold: const Duration(milliseconds: 500));

    // On failure, try stale cache
    if (result is Failure<List<Event>>) {
      final staleCache = await _cache.getCachedEventsStale();
      if (staleCache != null) {
        logWarning('Returning stale cache due to network error');
        return Success(staleCache);
      }
    }

    return result;
  }

  /// Get events by category
  Future<Result<List<Event>>> getEventsByCategory(EventCategory category) async {
    return execute(() async {
      final data = await SupabaseConfig.client
          .from('events')
          .select('*, organization:organizations(*)')
          .inFilter('status', ['PUBLISHED'])
          .inFilter('visibility', ['PUBLIC'])
          .eq('category', category.name)
          .order('start_date', ascending: true);

      final events = (data as List).map((json) => Event.fromJson(json)).toList();
      logDbOperation('SELECT', 'events', rowCount: events.length);
      return events;
    }, operationName: 'getEventsByCategory');
  }

  /// Get events by mode
  Future<Result<List<Event>>> getEventsByMode(EventMode mode) async {
    return execute(() async {
      final data = await SupabaseConfig.client
          .from('events')
          .select('*, organization:organizations(*)')
          .inFilter('status', ['PUBLISHED'])
          .inFilter('visibility', ['PUBLIC'])
          .eq('mode', mode.name)
          .order('start_date', ascending: true);

      final events = (data as List).map((json) => Event.fromJson(json)).toList();
      logDbOperation('SELECT', 'events', rowCount: events.length);
      return events;
    }, operationName: 'getEventsByMode');
  }

  /// Get event by ID
  Future<Result<Event?>> getEventById(String eventId) async {
    return execute(() async {
      final data = await SupabaseConfig.client
          .from('events')
          .select('*, organization:organizations(*)')
          .eq('id', eventId)
          .maybeSingle();

      if (data == null) return null;
      logDbOperation('SELECT', 'events', rowCount: 1);
      return Event.fromJson(data);
    }, operationName: 'getEventById');
  }

  /// Get ticket tiers for an event
  Future<Result<List<TicketTier>>> getTicketTiers(String eventId) async {
    return execute(() async {
      final data = await SupabaseConfig.client
          .from('ticket_tiers')
          .select()
          .eq('event_id', eventId)
          .eq('is_active', true)
          .order('sort_order', ascending: true);

      final tiers = (data as List).map((json) => TicketTier.fromJson(json)).toList();
      logDbOperation('SELECT', 'ticket_tiers', rowCount: tiers.length);
      return tiers;
    }, operationName: 'getTicketTiers');
  }

  /// Get ticket tiers for multiple events in a single query
  /// Returns a map of eventId -> list of active tiers (sorted by sort_order)
  Future<Result<Map<String, List<TicketTier>>>> getTicketTiersForEvents(List<String> eventIds) async {
    if (eventIds.isEmpty) return const Success({});
    
    return execute(() async {
      final data = await SupabaseConfig.client
          .from('ticket_tiers')
          .select()
          .inFilter('event_id', eventIds)
          .eq('is_active', true)
          .order('sort_order', ascending: true);

      final tiers = (data as List).map((j) => TicketTier.fromJson(j as Map<String, dynamic>)).toList();
      final Map<String, List<TicketTier>> map = {};
      for (final t in tiers) {
        map.putIfAbsent(t.eventId, () => []).add(t);
      }
      logDbOperation('SELECT', 'ticket_tiers', rowCount: tiers.length);
      return map;
    }, operationName: 'getTicketTiersForEvents');
  }

  /// Search events by name
  Future<Result<List<Event>>> searchEvents(String query) async {
    return execute(() async {
      final data = await SupabaseConfig.client
          .from('events')
          .select('*, organization:organizations(*)')
          .inFilter('status', ['PUBLISHED'])
          .inFilter('visibility', ['PUBLIC'])
          .ilike('name', '%$query%')
          .order('start_date', ascending: true);

      final events = (data as List).map((json) => Event.fromJson(json)).toList();
      logDbOperation('SELECT', 'events', rowCount: events.length);
      return events;
    }, operationName: 'searchEvents');
  }

  /// Get upcoming events - with performance monitoring for home page critical path
  Future<Result<List<Event>>> getUpcomingEvents() async {
    return executeWithMonitoring(() async {
      final now = DateTime.now().toIso8601String();
      final data = await SupabaseConfig.client
          .from('events')
          .select('*, organization:organizations(*)')
          .inFilter('status', ['PUBLISHED'])
          .inFilter('visibility', ['PUBLIC'])
          .gte('start_date', now)
          .order('start_date', ascending: true)
          .limit(20);

      final events = (data as List).map((json) => Event.fromJson(json)).toList();
      logDbOperation('SELECT', 'events', rowCount: events.length);
      return events;
    }, operationName: 'getUpcomingEvents', threshold: const Duration(milliseconds: 500));
  }

  /// Create a new event
  Future<Result<Event>> createEvent(Event event) async {
    return execute(() async {
      final json = event.toJson();
      json.remove('organization'); // Remove nested object
      
      final data = await SupabaseConfig.client
          .from('events')
          .insert(json)
          .select('*, organization:organizations(*)')
          .single();

      logDbOperation('INSERT', 'events', rowCount: 1);
      logInfo('Event created', metadata: {'event_id': data['id']});
      return Event.fromJson(data);
    }, operationName: 'createEvent');
  }

  /// Update an event
  Future<Result<bool>> updateEvent(Event event) async {
    return execute(() async {
      final json = event.toJson();
      json.remove('organization'); // Remove nested object
      
      await SupabaseConfig.client
          .from('events')
          .update(json)
          .eq('id', event.id);

      logDbOperation('UPDATE', 'events', rowCount: 1);
      logInfo('Event updated', metadata: {'event_id': event.id});
      return true;
    }, operationName: 'updateEvent');
  }

  /// Delete an event
  Future<Result<bool>> deleteEvent(String eventId) async {
    return execute(() async {
      await SupabaseConfig.client.from('events').delete().eq('id', eventId);
      logDbOperation('DELETE', 'events', rowCount: 1);
      logInfo('Event deleted', metadata: {'event_id': eventId});
      return true;
    }, operationName: 'deleteEvent');
  }
}
